import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const error = url.searchParams.get("error");

    // Get the app URL for redirects
    const appUrl = Deno.env.get("APP_URL") || "https://id-preview--9cd618c9-dc5b-4b50-b133-1e902eb0492d.lovable.app";

    if (error) {
      console.error("OAuth error from Google:", error);
      return Response.redirect(`${appUrl}/connections?error=oauth_denied`, 302);
    }

    if (!code || !state) {
      console.error("Missing code or state");
      return Response.redirect(`${appUrl}/connections?error=invalid_request`, 302);
    }

    // Decode state to get user ID
    let stateData;
    try {
      stateData = JSON.parse(atob(state));
    } catch (e) {
      console.error("Invalid state:", e);
      return Response.redirect(`${appUrl}/connections?error=invalid_state`, 302);
    }

    const { userId } = stateData;

    // Check state timestamp (expires after 10 minutes)
    if (Date.now() - stateData.timestamp > 600000) {
      console.error("State expired");
      return Response.redirect(`${appUrl}/connections?error=expired`, 302);
    }

    // Exchange code for tokens
    const clientId = Deno.env.get("GOOGLE_CLIENT_ID")!;
    const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET")!;
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
      console.error("Token exchange failed:", errorText);
      return Response.redirect(`${appUrl}/connections?error=token_exchange_failed`, 302);
    }

    const tokens = await tokenResponse.json();
    console.log("Token exchange successful");

    // Get user email from Google
    const userInfoResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    const userInfo = await userInfoResponse.json();
    const email = userInfo.email;

    console.log(`Got user info for: ${email}`);

    // Store tokens in database using service role
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
      access_token_encrypted: tokens.access_token, // In production, encrypt this
      refresh_token_encrypted: tokens.refresh_token,
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
        console.error("Error updating account:", updateError);
        return Response.redirect(`${appUrl}/connections?error=db_error`, 302);
      }
    } else {
      // Insert new account
      const { error: insertError } = await supabase
        .from("connected_accounts")
        .insert(accountData);

      if (insertError) {
        console.error("Error inserting account:", insertError);
        return Response.redirect(`${appUrl}/connections?error=db_error`, 302);
      }
    }

    console.log(`Gmail account connected for user ${userId}`);

    // Redirect back to app with success
    return Response.redirect(`${appUrl}/connections?success=gmail_connected`, 302);
  } catch (error) {
    console.error("Error in gmail-callback:", error);
    const appUrl = Deno.env.get("APP_URL") || "https://id-preview--9cd618c9-dc5b-4b50-b133-1e902eb0492d.lovable.app";
    return Response.redirect(`${appUrl}/connections?error=internal_error`, 302);
  }
});
