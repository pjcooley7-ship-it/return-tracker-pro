const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Common retail patterns for purchase/return emails
const VENDOR_PATTERNS = [
  // Major marketplaces
  { pattern: /amazon/i, name: "Amazon" },
  { pattern: /ebay/i, name: "eBay" },
  { pattern: /etsy/i, name: "Etsy" },
  { pattern: /walmart/i, name: "Walmart" },
  { pattern: /target/i, name: "Target" },
  { pattern: /costco/i, name: "Costco" },
  // Electronics
  { pattern: /bestbuy|best buy/i, name: "Best Buy" },
  { pattern: /apple/i, name: "Apple" },
  { pattern: /newegg/i, name: "Newegg" },
  { pattern: /b&h|bhphoto/i, name: "B&H Photo" },
  // Fashion & Apparel
  { pattern: /nike/i, name: "Nike" },
  { pattern: /adidas/i, name: "Adidas" },
  { pattern: /nordstrom/i, name: "Nordstrom" },
  { pattern: /macys|macy's/i, name: "Macy's" },
  { pattern: /kohls|kohl's/i, name: "Kohl's" },
  { pattern: /zappos/i, name: "Zappos" },
  { pattern: /zara/i, name: "Zara" },
  { pattern: /h&m|hm\.com/i, name: "H&M" },
  { pattern: /gap\.com|gap inc/i, name: "Gap" },
  { pattern: /old navy/i, name: "Old Navy" },
  { pattern: /banana republic/i, name: "Banana Republic" },
  { pattern: /uniqlo/i, name: "Uniqlo" },
  { pattern: /asos/i, name: "ASOS" },
  { pattern: /shein/i, name: "SHEIN" },
  { pattern: /forever ?21/i, name: "Forever 21" },
  { pattern: /urban outfitters/i, name: "Urban Outfitters" },
  { pattern: /anthropologie/i, name: "Anthropologie" },
  { pattern: /lululemon/i, name: "Lululemon" },
  { pattern: /under armour/i, name: "Under Armour" },
  { pattern: /foot locker/i, name: "Foot Locker" },
  { pattern: /dick'?s sporting/i, name: "Dick's Sporting Goods" },
  // Home & Furniture
  { pattern: /home depot/i, name: "Home Depot" },
  { pattern: /lowes|lowe's/i, name: "Lowe's" },
  { pattern: /wayfair/i, name: "Wayfair" },
  { pattern: /ikea/i, name: "IKEA" },
  { pattern: /overstock/i, name: "Overstock" },
  { pattern: /pottery barn/i, name: "Pottery Barn" },
  { pattern: /williams[- ]sonoma/i, name: "Williams Sonoma" },
  { pattern: /crate\s*&?\s*barrel/i, name: "Crate & Barrel" },
  { pattern: /bed\s*bath/i, name: "Bed Bath & Beyond" },
  // Beauty & Personal Care
  { pattern: /sephora/i, name: "Sephora" },
  { pattern: /ulta/i, name: "Ulta Beauty" },
  // Office & Supplies
  { pattern: /staples/i, name: "Staples" },
  { pattern: /office\s*depot|officedepot/i, name: "Office Depot" },
  // Pet
  { pattern: /chewy/i, name: "Chewy" },
  { pattern: /petco/i, name: "Petco" },
  { pattern: /petsmart/i, name: "PetSmart" },
  // Other major retailers
  { pattern: /jcpenney|jc\s*penney/i, name: "JCPenney" },
  { pattern: /sears/i, name: "Sears" },
  { pattern: /kmart/i, name: "Kmart" },
  { pattern: /tj\s*maxx|tjmaxx/i, name: "TJ Maxx" },
  { pattern: /marshalls/i, name: "Marshalls" },
  { pattern: /ross\s*stores/i, name: "Ross" },
  { pattern: /burlington/i, name: "Burlington" },
  { pattern: /dollar\s*general/i, name: "Dollar General" },
  { pattern: /cvs/i, name: "CVS" },
  { pattern: /walgreens/i, name: "Walgreens" },
  { pattern: /rite\s*aid/i, name: "Rite Aid" },
  // Tech & Gaming
  { pattern: /microsoft\s*store/i, name: "Microsoft Store" },
  { pattern: /playstation|sony\s*store/i, name: "PlayStation Store" },
  { pattern: /nintendo/i, name: "Nintendo" },
  { pattern: /steam/i, name: "Steam" },
  { pattern: /gamestop/i, name: "GameStop" },
  // Subscription boxes & DTC brands
  { pattern: /stitch\s*fix/i, name: "Stitch Fix" },
  { pattern: /warby\s*parker/i, name: "Warby Parker" },
  { pattern: /casper/i, name: "Casper" },
  { pattern: /allbirds/i, name: "Allbirds" },
  { pattern: /everlane/i, name: "Everlane" },
];

// Keywords for return-related emails (retail/e-commerce context)
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
  "return merchandise",
  "return your order",
  "return your item",
  "return instructions",
  "drop off your return",
  "print return label",
  "schedule pickup",
  "refund processed",
  "refund complete",
  "money back",
  "credit issued",
  "exchange request",
];

// Keywords that indicate NON-retail returns (false positives to exclude)
const EXCLUDE_KEYWORDS = [
  "tax return",
  "tax refund",
  "irs",
  "internal revenue",
  "w-2",
  "w2",
  "1099",
  "turbotax",
  "h&r block",
  "hrblock",
  "taxact",
  "tax preparation",
  "tax filing",
  "return on investment",
  "roi",
  "annual return",
  "quarterly return",
  "investment return",
  "stock return",
  "dividend",
  "portfolio",
  "financial return",
  "survey return",
  "return call",
  "return phone call",
  "job application",
  "interview",
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

function isReturnRelated(subject: string, body: string): { isRelated: boolean; isExcluded: boolean } {
  const combined = `${subject} ${body}`.toLowerCase();
  
  // Check for exclusion keywords first (tax returns, investment returns, etc.)
  const hasExcludeKeyword = EXCLUDE_KEYWORDS.some((keyword) => combined.includes(keyword));
  if (hasExcludeKeyword) {
    return { isRelated: false, isExcluded: true };
  }
  
  // Check for return-related keywords
  const hasReturnKeyword = RETURN_KEYWORDS.some((keyword) => combined.includes(keyword));
  return { isRelated: hasReturnKeyword, isExcluded: false };
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
  // Handle CORS preflight immediately
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Lazy import to speed up cold start
    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2.49.1");
    
    console.log("gmail-scan: Starting request");
    
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

    // Verify the user using getUser
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData?.user) {
      console.log("gmail-scan: User verification failed", userError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = userData.user.id;
    console.log(`gmail-scan: User verified: ${userId}`);

    // Get connected Gmail account
    const { data: account, error: accountError } = await supabase
      .from("connected_accounts")
      .select("*")
      .eq("user_id", userId)
      .eq("account_type", "gmail")
      .eq("is_active", true)
      .single();

    if (accountError || !account) {
      console.log("gmail-scan: No Gmail account found");
      return new Response(
        JSON.stringify({ error: "Gmail not connected" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let accessToken = account.access_token_encrypted;

    // Check if token is expired and refresh if needed
    if (account.token_expires_at && new Date(account.token_expires_at) < new Date()) {
      console.log("gmail-scan: Token expired, refreshing...");

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
        console.error("gmail-scan: Token refresh failed");
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

    console.log("gmail-scan: Searching emails");
    
    const searchResponse = await fetch(searchUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      console.error("gmail-scan: Gmail search failed:", errorText);
      return new Response(
        JSON.stringify({ error: "Failed to search emails" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const searchData = await searchResponse.json();
    const messages = searchData.messages || [];

    console.log(`gmail-scan: Found ${messages.length} potential return emails`);

    const detectedReturns: Array<{
      vendor: string;
      orderNumber: string | null;
      amount: number | null;
      subject: string;
      date: string;
      emailId: string;
      tracking: { carrier: string; number: string } | null;
    }> = [];

    // Store all scanned emails for debugging
    const scannedEmails: Array<{
      subject: string;
      from: string;
      date: string;
      emailId: string;
      isReturnRelated: boolean;
      detectedVendor: string | null;
      reason: string;
    }> = [];

    // Process each message
    for (const msg of messages.slice(0, 50)) {
      // Process up to 50 emails for better coverage
      const msgUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`;
      const msgResponse = await fetch(msgUrl, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!msgResponse.ok) {
        scannedEmails.push({
          subject: "(failed to fetch)",
          from: "",
          date: "",
          emailId: msg.id,
          isReturnRelated: false,
          detectedVendor: null,
          reason: "Failed to fetch email details",
        });
        continue;
      }

      const message: GmailMessage = await msgResponse.json();
      const headers = message.payload?.headers;
      const subject = extractHeader(headers, "Subject") || "(no subject)";
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

      // Check if this is return-related (and not a false positive like tax returns)
      const { isRelated: returnRelated, isExcluded } = isReturnRelated(subject, body);
      
      // Detect vendor
      const vendor = detectVendor(from, subject);

      // Build reason string
      let reason = "";
      if (isExcluded) {
        reason = "Excluded (tax/investment/non-retail context)";
      } else if (!returnRelated) {
        reason = "No return keywords found";
      } else if (!vendor) {
        reason = "Return-related but unknown vendor";
      } else {
        reason = "Detected as return";
      }

      scannedEmails.push({
        subject,
        from,
        date,
        emailId: msg.id,
        isReturnRelated: returnRelated && !isExcluded,
        detectedVendor: vendor,
        reason,
      });

      if (!returnRelated || isExcluded || !vendor) continue;

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

    console.log(`gmail-scan: Detected ${detectedReturns.length} returns from ${scannedEmails.length} emails`);

    return new Response(
      JSON.stringify({
        success: true,
        returns: detectedReturns,
        scannedEmails,
        scannedCount: messages.length,
        processedCount: scannedEmails.length,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("gmail-scan: Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
