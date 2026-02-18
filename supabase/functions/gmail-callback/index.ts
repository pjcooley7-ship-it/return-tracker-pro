function structuredLog(severity: string, message: string, data?: Record<string, unknown>) {
  const entry = JSON.stringify({
    severity,
    function: "gmail-callback",
    message,
    timestamp: new Date().toISOString(),
    ...data,
  });
  if (severity === "ERROR") console.error(entry);
  else console.log(entry);
}

// Verify HMAC-SHA256 signature on a payload
async function hmacVerify(payload: string, signature: string, secret: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const expected = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  const expectedHex = Array.from(new Uint8Array(expected))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  // Constant-time comparison to prevent timing attacks
  if (expectedHex.length !== signature.length) return false;
  let mismatch = 0;
  for (let i = 0; i < expectedHex.length; i++) {
    mismatch |= expectedHex.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return mismatch === 0;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2.49.1");

    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const error = url.searchParams.get("error");

    // Get the app URL for redirects
    const appUrl = Deno.env.get("APP_URL") || "https://id-preview--9cd618c9-dc5b-4b50-b133-1e902eb0492d.lovable.app";

    if (error) {
      structuredLog("ERROR", "OAuth error from Google", { oauthError: error });
      return Response.redirect(`${appUrl}/connections?error=oauth_denied`, 302);
    }

    if (!code || !state) {
      structuredLog("ERROR", "Missing code or state");
      return Response.redirect(`${appUrl}/connections?error=invalid_request`, 302);
    }

    // Exchange code for tokens (need clientSecret early for HMAC verification)
    const clientId = Deno.env.get("GOOGLE_CLIENT_ID")!;
    const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET")!;

    // Verify HMAC-signed state to prevent forgery
    const dotIndex = state.lastIndexOf(".");
    if (dotIndex === -1) {
      structuredLog("ERROR", "State missing HMAC signature");
      return Response.redirect(`${appUrl}/connections?error=invalid_state`, 302);
    }

    const statePayload = state.substring(0, dotIndex);
    const stateSig = state.substring(dotIndex + 1);

    const isValid = await hmacVerify(statePayload, stateSig, clientSecret);
    if (!isValid) {
      structuredLog("ERROR", "State HMAC verification failed");
      return Response.redirect(`${appUrl}/connections?error=invalid_state`, 302);
    }

    // Decode state to get user ID
    let stateData;
    try {
      stateData = JSON.parse(atob(statePayload));
    } catch (e) {
      structuredLog("ERROR", "Invalid state", { error: String(e) });
      return Response.redirect(`${appUrl}/connections?error=invalid_state`, 302);
    }

    const { userId } = stateData;

    // Check state timestamp (expires after 10 minutes)
    if (Date.now() - stateData.timestamp > 600000) {
      structuredLog("WARN", "State expired");
      return Response.redirect(`${appUrl}/connections?error=expired`, 302);
    }
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const redirectUri = `${supabaseUrl}/functions/v1/gmail-callback`;

    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      structuredLog("ERROR", "Token exchange failed", { response: errorText });
      return Response.redirect(`${appUrl}/connections?error=token_exchange_failed`, 302);
    }

    const tokens = await tokenResponse.json();
    structuredLog("INFO", "Token exchange successful");

    // Get user email from Google
    const userInfoResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    const userInfo = await userInfoResponse.json();
    const email = userInfo.email;

    structuredLog("INFO", "Got user info", { email });

    // Store tokens in database using service role
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Encrypt tokens before storing
    const { data: encAccessToken, error: encAccessErr } = await supabase
      .rpc("encrypt_token", { plaintext: tokens.access_token });
    if (encAccessErr) {
      structuredLog("ERROR", "Failed to encrypt access token", { error: String(encAccessErr) });
      return Response.redirect(`${appUrl}/connections?error=internal_error`, 302);
    }

    let encRefreshToken: string | null = null;
    if (tokens.refresh_token) {
      const { data, error: encRefreshErr } = await supabase
        .rpc("encrypt_token", { plaintext: tokens.refresh_token });
      if (encRefreshErr) {
        structuredLog("ERROR", "Failed to encrypt refresh token", { error: String(encRefreshErr) });
        return Response.redirect(`${appUrl}/connections?error=internal_error`, 302);
      }
      encRefreshToken = data;
    }

    // Check if account already exists
    const { data: existingAccount } = await supabase
      .from("connected_accounts")
      .select("id")
      .eq("user_id", userId)
      .eq("account_type", "gmail")
      .single();

    const accountData = {
      user_id: userId,
      account_type: "gmail",
      account_identifier: email,
      access_token_encrypted: encAccessToken,
      refresh_token_encrypted: encRefreshToken,
      token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
      is_active: true,
      last_sync_at: null,
      metadata: { scope: tokens.scope },
    };

    if (existingAccount) {
      // Update existing account
      const { error: updateError } = await supabase
        .from("connected_accounts")
        .update(accountData)
        .eq("id", existingAccount.id);

      if (updateError) {
        structuredLog("ERROR", "Error updating account", { error: String(updateError) });
        return Response.redirect(`${appUrl}/connections?error=db_error`, 302);
      }
    } else {
      // Insert new account
      const { error: insertError } = await supabase
        .from("connected_accounts")
        .insert(accountData);

      if (insertError) {
        structuredLog("ERROR", "Error inserting account", { error: String(insertError) });
        return Response.redirect(`${appUrl}/connections?error=db_error`, 302);
      }
    }

    structuredLog("INFO", "Gmail account connected", { userId });

    // Redirect back to app with success
    return Response.redirect(`${appUrl}/connections?success=gmail_connected`, 302);
  } catch (error) {
    structuredLog("ERROR", "Unhandled error", { error: String(error) });
    const appUrl = Deno.env.get("APP_URL") || "https://id-preview--9cd618c9-dc5b-4b50-b133-1e902eb0492d.lovable.app";
    return Response.redirect(`${appUrl}/connections?error=internal_error`, 302);
  }
});
