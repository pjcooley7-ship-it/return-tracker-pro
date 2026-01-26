import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Common retail patterns for purchase/return emails
const VENDOR_PATTERNS = [
  { pattern: /amazon/i, name: "Amazon" },
  { pattern: /target/i, name: "Target" },
  { pattern: /walmart/i, name: "Walmart" },
  { pattern: /bestbuy|best buy/i, name: "Best Buy" },
  { pattern: /apple/i, name: "Apple" },
  { pattern: /nike/i, name: "Nike" },
  { pattern: /adidas/i, name: "Adidas" },
  { pattern: /nordstrom/i, name: "Nordstrom" },
  { pattern: /macys|macy's/i, name: "Macy's" },
  { pattern: /kohls|kohl's/i, name: "Kohl's" },
  { pattern: /costco/i, name: "Costco" },
  { pattern: /home depot/i, name: "Home Depot" },
  { pattern: /lowes|lowe's/i, name: "Lowe's" },
  { pattern: /wayfair/i, name: "Wayfair" },
  { pattern: /etsy/i, name: "Etsy" },
  { pattern: /ebay/i, name: "eBay" },
  { pattern: /zappos/i, name: "Zappos" },
];

// Keywords for return-related emails
const RETURN_KEYWORDS = [
  "return confirmation",
  "return label",
  "return authorized",
  "rma",
  "refund initiated",
  "return shipment",
  "return request",
  "package return",
  "your return",
];

interface GmailMessage {
  id: string;
  threadId: string;
  labelIds?: string[];
  snippet: string;
  payload?: {
    headers?: Array<{ name: string; value: string }>;
    body?: { data?: string };
    parts?: Array<{ body?: { data?: string }; mimeType?: string }>;
  };
}

function decodeBase64Url(data: string): string {
  const base64 = data.replace(/-/g, "+").replace(/_/g, "/");
  try {
    return atob(base64);
  } catch {
    return "";
  }
}

function extractHeader(headers: Array<{ name: string; value: string }> | undefined, name: string): string | null {
  return headers?.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value || null;
}

function detectVendor(from: string, subject: string): string | null {
  const combined = `${from} ${subject}`;
  for (const vendor of VENDOR_PATTERNS) {
    if (vendor.pattern.test(combined)) {
      return vendor.name;
    }
  }
  return null;
}

function isReturnRelated(subject: string, body: string): boolean {
  const combined = `${subject} ${body}`.toLowerCase();
  return RETURN_KEYWORDS.some((keyword) => combined.includes(keyword));
}

function extractOrderNumber(text: string): string | null {
  // Common order number patterns
  const patterns = [
    /order\s*#?\s*[:\s]?\s*([A-Z0-9-]+)/i,
    /order\s+number[:\s]+([A-Z0-9-]+)/i,
    /confirmation\s*#?\s*[:\s]?\s*([A-Z0-9-]+)/i,
    /#([0-9]{3}-[0-9]{7}-[0-9]{7})/i, // Amazon format
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1];
    }
  }
  return null;
}

function extractAmount(text: string): number | null {
  const pattern = /\$([0-9,]+\.?[0-9]*)/;
  const match = text.match(pattern);
  if (match) {
    return parseFloat(match[1].replace(/,/g, ""));
  }
  return null;
}

function extractTrackingNumber(text: string): { carrier: string; number: string } | null {
  const patterns = [
    { carrier: "UPS", pattern: /\b(1Z[A-Z0-9]{16})\b/i },
    { carrier: "FedEx", pattern: /\b([0-9]{12,22})\b/ },
    { carrier: "USPS", pattern: /\b(9[0-9]{15,21})\b/ },
    { carrier: "USPS", pattern: /\b([A-Z]{2}[0-9]{9}US)\b/i },
  ];

  for (const { carrier, pattern } of patterns) {
    const match = text.match(pattern);
    if (match) {
      return { carrier, number: match[1] };
    }
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify the user
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);

    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.claims.sub;

    // Get connected Gmail account
    const { data: account, error: accountError } = await supabase
      .from("connected_accounts")
      .select("*")
      .eq("user_id", userId)
      .eq("account_type", "gmail")
      .eq("is_active", true)
      .single();

    if (accountError || !account) {
      return new Response(
        JSON.stringify({ error: "Gmail not connected" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let accessToken = account.access_token_encrypted;

    // Check if token is expired and refresh if needed
    if (account.token_expires_at && new Date(account.token_expires_at) < new Date()) {
      console.log("Token expired, refreshing...");

      const clientId = Deno.env.get("GOOGLE_CLIENT_ID")!;
      const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET")!;

      const refreshResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: account.refresh_token_encrypted!,
          grant_type: "refresh_token",
        }),
      });

      if (!refreshResponse.ok) {
        console.error("Token refresh failed");
        // Mark account as inactive
        await supabase
          .from("connected_accounts")
          .update({ is_active: false })
          .eq("id", account.id);

        return new Response(
          JSON.stringify({ error: "Gmail connection expired. Please reconnect." }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const newTokens = await refreshResponse.json();
      accessToken = newTokens.access_token;

      // Update tokens in database
      await supabase
        .from("connected_accounts")
        .update({
          access_token_encrypted: accessToken,
          token_expires_at: new Date(Date.now() + newTokens.expires_in * 1000).toISOString(),
        })
        .eq("id", account.id);
    }

    // Search for return-related emails from the last 30 days
    const query = "subject:(return OR refund OR RMA) newer_than:30d";
    const searchUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=50`;

    const searchResponse = await fetch(searchUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      console.error("Gmail search failed:", errorText);
      return new Response(
        JSON.stringify({ error: "Failed to search emails" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const searchData = await searchResponse.json();
    const messages = searchData.messages || [];

    console.log(`Found ${messages.length} potential return emails`);

    const detectedReturns: Array<{
      vendor: string;
      orderNumber: string | null;
      amount: number | null;
      subject: string;
      date: string;
      emailId: string;
      tracking: { carrier: string; number: string } | null;
    }> = [];

    // Process each message
    for (const msg of messages.slice(0, 20)) {
      // Limit to 20 for performance
      const msgUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`;
      const msgResponse = await fetch(msgUrl, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!msgResponse.ok) continue;

      const message: GmailMessage = await msgResponse.json();
      const headers = message.payload?.headers;
      const subject = extractHeader(headers, "Subject") || "";
      const from = extractHeader(headers, "From") || "";
      const date = extractHeader(headers, "Date") || "";

      // Get email body
      let body = "";
      if (message.payload?.body?.data) {
        body = decodeBase64Url(message.payload.body.data);
      } else if (message.payload?.parts) {
        for (const part of message.payload.parts) {
          if (part.mimeType === "text/plain" && part.body?.data) {
            body = decodeBase64Url(part.body.data);
            break;
          }
        }
      }

      const fullText = `${subject} ${body}`;

      // Check if this is return-related
      if (!isReturnRelated(subject, body)) continue;

      // Detect vendor
      const vendor = detectVendor(from, subject);
      if (!vendor) continue;

      // Extract data
      const orderNumber = extractOrderNumber(fullText);
      const amount = extractAmount(fullText);
      const tracking = extractTrackingNumber(fullText);

      detectedReturns.push({
        vendor,
        orderNumber,
        amount,
        subject,
        date,
        emailId: msg.id,
        tracking,
      });
    }

    // Update last sync time
    await supabase
      .from("connected_accounts")
      .update({ last_sync_at: new Date().toISOString() })
      .eq("id", account.id);

    console.log(`Detected ${detectedReturns.length} returns`);

    return new Response(
      JSON.stringify({
        success: true,
        returns: detectedReturns,
        scannedCount: messages.length,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in gmail-scan:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
