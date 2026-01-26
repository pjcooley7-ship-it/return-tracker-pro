const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Common retail patterns for purchase/return emails (International)
const VENDOR_PATTERNS = [
  // === GLOBAL MARKETPLACES ===
  { pattern: /amazon/i, name: "Amazon" },
  { pattern: /ebay/i, name: "eBay" },
  { pattern: /etsy/i, name: "Etsy" },
  { pattern: /aliexpress/i, name: "AliExpress" },
  { pattern: /wish\.com|wish app/i, name: "Wish" },
  { pattern: /temu/i, name: "Temu" },
  
  // === USA ===
  { pattern: /walmart/i, name: "Walmart" },
  { pattern: /target/i, name: "Target" },
  { pattern: /costco/i, name: "Costco" },
  { pattern: /bestbuy|best buy/i, name: "Best Buy" },
  { pattern: /apple/i, name: "Apple" },
  { pattern: /newegg/i, name: "Newegg" },
  { pattern: /b&h|bhphoto/i, name: "B&H Photo" },
  { pattern: /nike/i, name: "Nike" },
  { pattern: /adidas/i, name: "Adidas" },
  { pattern: /nordstrom/i, name: "Nordstrom" },
  { pattern: /macys|macy's/i, name: "Macy's" },
  { pattern: /kohls|kohl's/i, name: "Kohl's" },
  { pattern: /zappos/i, name: "Zappos" },
  { pattern: /gap\.com|gap inc/i, name: "Gap" },
  { pattern: /old navy/i, name: "Old Navy" },
  { pattern: /banana republic/i, name: "Banana Republic" },
  { pattern: /home depot/i, name: "Home Depot" },
  { pattern: /lowes|lowe's/i, name: "Lowe's" },
  { pattern: /wayfair/i, name: "Wayfair" },
  { pattern: /overstock/i, name: "Overstock" },
  { pattern: /pottery barn/i, name: "Pottery Barn" },
  { pattern: /williams[- ]sonoma/i, name: "Williams Sonoma" },
  { pattern: /crate\s*&?\s*barrel/i, name: "Crate & Barrel" },
  { pattern: /bed\s*bath/i, name: "Bed Bath & Beyond" },
  { pattern: /sephora/i, name: "Sephora" },
  { pattern: /ulta/i, name: "Ulta Beauty" },
  { pattern: /staples/i, name: "Staples" },
  { pattern: /chewy/i, name: "Chewy" },
  { pattern: /petco/i, name: "Petco" },
  { pattern: /petsmart/i, name: "PetSmart" },
  { pattern: /jcpenney|jc\s*penney/i, name: "JCPenney" },
  { pattern: /tj\s*maxx|tjmaxx/i, name: "TJ Maxx" },
  { pattern: /marshalls/i, name: "Marshalls" },
  { pattern: /gamestop/i, name: "GameStop" },
  { pattern: /stitch\s*fix/i, name: "Stitch Fix" },
  { pattern: /warby\s*parker/i, name: "Warby Parker" },
  
  // === EUROPE (General) ===
  { pattern: /zara/i, name: "Zara" },
  { pattern: /h&m|hm\.com/i, name: "H&M" },
  { pattern: /uniqlo/i, name: "Uniqlo" },
  { pattern: /asos/i, name: "ASOS" },
  { pattern: /shein/i, name: "SHEIN" },
  { pattern: /ikea/i, name: "IKEA" },
  { pattern: /mango/i, name: "Mango" },
  { pattern: /pull\s*&?\s*bear/i, name: "Pull&Bear" },
  { pattern: /bershka/i, name: "Bershka" },
  { pattern: /massimo\s*dutti/i, name: "Massimo Dutti" },
  { pattern: /primark/i, name: "Primark" },
  { pattern: /decathlon/i, name: "Decathlon" },
  
  // === SWITZERLAND / DACH ===
  { pattern: /westwing/i, name: "Westwing" },
  { pattern: /zalando/i, name: "Zalando" },
  { pattern: /manor/i, name: "Manor" },
  { pattern: /globus/i, name: "Globus" },
  { pattern: /migros/i, name: "Migros" },
  { pattern: /coop\.ch|coop switzerland/i, name: "Coop" },
  { pattern: /digitec/i, name: "Digitec" },
  { pattern: /galaxus/i, name: "Galaxus" },
  { pattern: /microspot/i, name: "Microspot" },
  { pattern: /brack\.ch|brack/i, name: "Brack" },
  { pattern: /pfister/i, name: "Pfister" },
  { pattern: /interio/i, name: "Interio" },
  { pattern: /ochsner\s*sport/i, name: "Ochsner Sport" },
  { pattern: /dosenbach/i, name: "Dosenbach" },
  { pattern: /siroop/i, name: "Siroop" },
  
  // === GERMANY ===
  { pattern: /otto\.de|otto germany/i, name: "Otto" },
  { pattern: /about\s*you/i, name: "About You" },
  { pattern: /lidl/i, name: "Lidl" },
  { pattern: /aldi/i, name: "Aldi" },
  { pattern: /mediamarkt|media markt/i, name: "MediaMarkt" },
  { pattern: /saturn/i, name: "Saturn" },
  { pattern: /douglas/i, name: "Douglas" },
  { pattern: /dm-drogerie|dm\.de/i, name: "dm" },
  { pattern: /bonprix/i, name: "Bonprix" },
  { pattern: /tchibo/i, name: "Tchibo" },
  { pattern: /notebooksbilliger/i, name: "Notebooksbilliger" },
  { pattern: /cyberport/i, name: "Cyberport" },
  { pattern: /thomann/i, name: "Thomann" },
  { pattern: /home24/i, name: "Home24" },
  
  // === UK ===
  { pattern: /argos/i, name: "Argos" },
  { pattern: /john\s*lewis/i, name: "John Lewis" },
  { pattern: /marks\s*&?\s*spencer|m&s/i, name: "Marks & Spencer" },
  { pattern: /next\.co|next plc/i, name: "Next" },
  { pattern: /currys/i, name: "Currys" },
  { pattern: /boots/i, name: "Boots" },
  { pattern: /very\.co/i, name: "Very" },
  { pattern: /ao\.com/i, name: "AO" },
  { pattern: /boohoo/i, name: "Boohoo" },
  { pattern: /prettylittlething/i, name: "PrettyLittleThing" },
  { pattern: /missguided/i, name: "Missguided" },
  { pattern: /superdrug/i, name: "Superdrug" },
  { pattern: /screwfix/i, name: "Screwfix" },
  { pattern: /wickes/i, name: "Wickes" },
  
  // === FRANCE ===
  { pattern: /cdiscount/i, name: "Cdiscount" },
  { pattern: /fnac/i, name: "Fnac" },
  { pattern: /darty/i, name: "Darty" },
  { pattern: /boulanger/i, name: "Boulanger" },
  { pattern: /la\s*redoute/i, name: "La Redoute" },
  { pattern: /galeries\s*lafayette/i, name: "Galeries Lafayette" },
  { pattern: /printemps/i, name: "Printemps" },
  { pattern: /carrefour/i, name: "Carrefour" },
  { pattern: /leroy\s*merlin/i, name: "Leroy Merlin" },
  { pattern: /castorama/i, name: "Castorama" },
  
  // === ITALY ===
  { pattern: /yoox/i, name: "YOOX" },
  { pattern: /luisaviaroma/i, name: "LuisaViaRoma" },
  { pattern: /esselunga/i, name: "Esselunga" },
  { pattern: /unieuro/i, name: "Unieuro" },
  
  // === SPAIN ===
  { pattern: /el\s*corte\s*ingl[eé]s/i, name: "El Corte Inglés" },
  { pattern: /pc\s*componentes/i, name: "PcComponentes" },
  
  // === NETHERLANDS ===
  { pattern: /bol\.com|bol netherlands/i, name: "Bol.com" },
  { pattern: /coolblue/i, name: "Coolblue" },
  { pattern: /wehkamp/i, name: "Wehkamp" },
  { pattern: /albert\s*heijn/i, name: "Albert Heijn" },
  
  // === NORDICS ===
  { pattern: /elgiganten/i, name: "Elgiganten" },
  { pattern: /komplett/i, name: "Komplett" },
  { pattern: /jula/i, name: "Jula" },
  { pattern: /clas\s*ohlson/i, name: "Clas Ohlson" },
  { pattern: /boozt/i, name: "Boozt" },
  
  // === AUSTRALIA ===
  { pattern: /kogan/i, name: "Kogan" },
  { pattern: /jb\s*hi-?fi/i, name: "JB Hi-Fi" },
  { pattern: /myer/i, name: "Myer" },
  { pattern: /david\s*jones/i, name: "David Jones" },
  { pattern: /bunnings/i, name: "Bunnings" },
  { pattern: /the\s*iconic/i, name: "The Iconic" },
  { pattern: /catch\.com/i, name: "Catch" },
  
  // === CANADA ===
  { pattern: /canadian\s*tire/i, name: "Canadian Tire" },
  { pattern: /hudson'?s\s*bay|thebay/i, name: "Hudson's Bay" },
  { pattern: /shoppers\s*drug/i, name: "Shoppers Drug Mart" },
  { pattern: /loblaws/i, name: "Loblaws" },
  { pattern: /roots/i, name: "Roots" },
  
  // === LUXURY / FASHION (Global) ===
  { pattern: /net-a-porter/i, name: "Net-a-Porter" },
  { pattern: /farfetch/i, name: "Farfetch" },
  { pattern: /mytheresa/i, name: "Mytheresa" },
  { pattern: /ssense/i, name: "SSENSE" },
  { pattern: /mr\s*porter/i, name: "MR PORTER" },
  { pattern: /matches\s*fashion/i, name: "MatchesFashion" },
  { pattern: /selfridges/i, name: "Selfridges" },
  { pattern: /harrods/i, name: "Harrods" },
  { pattern: /bergdorf/i, name: "Bergdorf Goodman" },
  { pattern: /neiman\s*marcus/i, name: "Neiman Marcus" },
  { pattern: /saks/i, name: "Saks Fifth Avenue" },
  { pattern: /bloomingdale/i, name: "Bloomingdale's" },
  
  // === SPORTS (Global) ===
  { pattern: /footlocker|foot\s*locker/i, name: "Foot Locker" },
  { pattern: /dick'?s\s*sporting/i, name: "Dick's Sporting Goods" },
  { pattern: /lululemon/i, name: "Lululemon" },
  { pattern: /under\s*armour/i, name: "Under Armour" },
  { pattern: /puma/i, name: "Puma" },
  { pattern: /reebok/i, name: "Reebok" },
  { pattern: /new\s*balance/i, name: "New Balance" },
  { pattern: /asics/i, name: "ASICS" },
  { pattern: /converse/i, name: "Converse" },
  { pattern: /vans\.com|vans shoes/i, name: "Vans" },
  
  // === TECH (Global) ===
  { pattern: /microsoft\s*store/i, name: "Microsoft Store" },
  { pattern: /playstation|sony\s*store/i, name: "PlayStation Store" },
  { pattern: /nintendo/i, name: "Nintendo" },
  { pattern: /steam/i, name: "Steam" },
  { pattern: /dell/i, name: "Dell" },
  { pattern: /hp\.com|hp store/i, name: "HP" },
  { pattern: /lenovo/i, name: "Lenovo" },
  { pattern: /samsung\s*shop/i, name: "Samsung" },
  { pattern: /bose/i, name: "Bose" },
  { pattern: /sonos/i, name: "Sonos" },
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

// Multilingual return keywords (English, German, French, Italian, Spanish, Dutch)
const RETURN_KEYWORDS_MULTILINGUAL = [
  // English
  "return confirmation", "return label", "return authorized", "rma", "refund initiated",
  "return shipment", "return request", "package return", "your return", "return merchandise",
  "return your order", "return your item", "return instructions", "drop off your return",
  "print return label", "schedule pickup", "refund processed", "refund complete",
  "money back", "credit issued", "exchange request",
  // German
  "rücksendung", "retoure", "rückgabe", "retourenlabel", "rücksendeetikett",
  "rückerstattung", "erstattung", "geld zurück", "umtausch", "rücksendeschein",
  "paket zurücksenden", "artikel zurücksenden", "rückgabebestätigung",
  // French
  "retour confirmé", "étiquette de retour", "retour autorisé", "remboursement",
  "renvoi", "colis retour", "demande de retour", "bon de retour",
  // Italian
  "reso confermato", "etichetta di reso", "rimborso", "restituzione",
  "reso autorizzato", "richiesta di reso",
  // Spanish
  "devolución confirmada", "etiqueta de devolución", "reembolso", "devolución",
  "solicitud de devolución",
  // Dutch
  "retour bevestigd", "retourlabel", "terugbetaling", "retourzending",
];

function isReturnRelated(subject: string, body: string): { isRelated: boolean; isExcluded: boolean } {
  const combined = `${subject} ${body}`.toLowerCase();
  
  // Check for exclusion keywords first (tax returns, investment returns, etc.)
  const hasExcludeKeyword = EXCLUDE_KEYWORDS.some((keyword) => combined.includes(keyword));
  if (hasExcludeKeyword) {
    return { isRelated: false, isExcluded: true };
  }
  
  // Check for return-related keywords in multiple languages
  const hasReturnKeyword = RETURN_KEYWORDS_MULTILINGUAL.some((keyword) => combined.includes(keyword));
  return { isRelated: hasReturnKeyword, isExcluded: false };
}

// Simple language detection based on common words
function detectLanguage(text: string): string {
  const lowerText = text.toLowerCase();
  
  const languageMarkers: { [key: string]: string[] } = {
    de: ["bestellung", "rücksendung", "retoure", "lieferung", "versand", "danke", "bestätigung", "artikel", "ihre", "ihr", "wir haben", "erhalten"],
    fr: ["commande", "livraison", "retour", "votre", "nous avons", "merci", "confirmation", "colis", "expédition"],
    it: ["ordine", "consegna", "reso", "spedizione", "conferma", "grazie", "il tuo", "abbiamo"],
    es: ["pedido", "devolución", "envío", "confirmación", "gracias", "tu", "hemos"],
    nl: ["bestelling", "retour", "bezorging", "verzending", "bedankt", "uw", "we hebben"],
  };
  
  let maxScore = 0;
  let detectedLang = "en";
  
  for (const [lang, markers] of Object.entries(languageMarkers)) {
    const score = markers.filter(marker => lowerText.includes(marker)).length;
    if (score > maxScore) {
      maxScore = score;
      detectedLang = lang;
    }
  }
  
  // Only return non-English if we have strong confidence (3+ markers)
  return maxScore >= 2 ? detectedLang : "en";
}

// Translate text using Lovable AI Gateway
async function translateToEnglish(text: string, fromLang: string): Promise<string> {
  const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!lovableApiKey) {
    console.log("gmail-scan: No LOVABLE_API_KEY, skipping translation");
    return text;
  }
  
  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          {
            role: "system",
            content: "You are a translator. Translate the following email content to English. Only output the translation, nothing else. Preserve any order numbers, dates, and proper nouns."
          },
          {
            role: "user",
            content: text.substring(0, 2000) // Limit to avoid token limits
          }
        ],
        max_tokens: 1000,
      }),
    });
    
    if (!response.ok) {
      console.log("gmail-scan: Translation failed", response.status);
      return text;
    }
    
    const data = await response.json();
    return data.choices?.[0]?.message?.content || text;
  } catch (error) {
    console.log("gmail-scan: Translation error", error);
    return text;
  }
}

function extractOrderNumber(text: string): string | null {
  // Common order number patterns (including European formats)
  const patterns = [
    /order\s*#?\s*[:\s]?\s*([A-Z0-9-]+)/i,
    /order\s+number[:\s]+([A-Z0-9-]+)/i,
    /confirmation\s*#?\s*[:\s]?\s*([A-Z0-9-]+)/i,
    /#([0-9]{3}-[0-9]{7}-[0-9]{7})/i, // Amazon format
    /bestellnummer[:\s]+([A-Z0-9-]+)/i, // German
    /numéro\s*de\s*commande[:\s]+([A-Z0-9-]+)/i, // French
    /numero\s*ordine[:\s]+([A-Z0-9-]+)/i, // Italian
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
  // Support multiple currency formats
  const patterns = [
    /\$([0-9,]+\.?[0-9]*)/,           // USD
    /€\s*([0-9.,]+)/,                  // EUR
    /CHF\s*([0-9.']+)/i,               // Swiss Franc
    /£([0-9,]+\.?[0-9]*)/,             // GBP
    /([0-9.,]+)\s*€/,                  // EUR (suffix)
    /([0-9.']+)\s*CHF/i,               // CHF (suffix)
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      // Normalize number format (handle European comma as decimal)
      let numStr = match[1].replace(/'/g, "").replace(/\s/g, "");
      // If has both comma and period, comma is thousands separator
      if (numStr.includes(",") && numStr.includes(".")) {
        numStr = numStr.replace(/,/g, "");
      } else if (numStr.includes(",") && !numStr.includes(".")) {
        // Comma might be decimal separator (European format)
        const parts = numStr.split(",");
        if (parts.length === 2 && parts[1].length <= 2) {
          numStr = numStr.replace(",", ".");
        } else {
          numStr = numStr.replace(/,/g, "");
        }
      }
      return parseFloat(numStr);
    }
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
    
    // Parse request body for scan options
    let days = 30;
    try {
      const body = await req.json();
      if (body.days && typeof body.days === 'number' && body.days > 0 && body.days <= 365) {
        days = body.days;
      }
    } catch {
      // No body or invalid JSON, use default
    }
    
    console.log(`gmail-scan: Starting request with ${days} days range`);
    
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

    // Search for return-related emails with configurable time range
    // Include multilingual terms in search query
    const searchTerms = [
      "return", "refund", "RMA", "rücksendung", "retoure", "retour", 
      "rimborso", "reso", "devolución", "reembolso"
    ];
    const query = `subject:(${searchTerms.join(" OR ")}) newer_than:${days}d`;
    const maxResults = days > 90 ? 100 : 50; // More results for longer ranges
    const searchUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=${maxResults}`;

    console.log(`gmail-scan: Searching emails with query: ${query}`);
    
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

      let fullText = `${subject} ${body}`;
      
      // Detect language and translate if non-English
      const detectedLang = detectLanguage(fullText);
      let wasTranslated = false;
      let translatedText = fullText;
      
      if (detectedLang !== "en") {
        console.log(`gmail-scan: Detected ${detectedLang} language, translating...`);
        translatedText = await translateToEnglish(fullText, detectedLang);
        wasTranslated = translatedText !== fullText;
      }

      // Check if this is return-related (and not a false positive like tax returns)
      // Use both original and translated text for matching
      const { isRelated: returnRelated, isExcluded } = isReturnRelated(subject, body);
      const { isRelated: returnRelatedTranslated } = wasTranslated 
        ? isReturnRelated(translatedText, translatedText) 
        : { isRelated: false };
      
      const isReturn = returnRelated || returnRelatedTranslated;
      
      // Detect vendor from original text (vendor names are usually in original language)
      const vendor = detectVendor(from, subject);

      // Build reason string
      let reason = "";
      if (isExcluded) {
        reason = "Excluded (tax/investment/non-retail context)";
      } else if (!isReturn) {
        reason = wasTranslated 
          ? `No return keywords (translated from ${detectedLang.toUpperCase()})` 
          : "No return keywords found";
      } else if (!vendor) {
        reason = wasTranslated 
          ? `Return-related (${detectedLang.toUpperCase()}) but unknown vendor` 
          : "Return-related but unknown vendor";
      } else {
        reason = wasTranslated 
          ? `Detected as return (translated from ${detectedLang.toUpperCase()})` 
          : "Detected as return";
      }

      scannedEmails.push({
        subject,
        from,
        date,
        emailId: msg.id,
        isReturnRelated: isReturn && !isExcluded,
        detectedVendor: vendor,
        reason,
      });

      if (!isReturn || isExcluded || !vendor) continue;

      // Extract data from both original and translated text
      const textForExtraction = wasTranslated ? `${fullText} ${translatedText}` : fullText;
      const orderNumber = extractOrderNumber(textForExtraction);
      const amount = extractAmount(textForExtraction);
      const tracking = extractTrackingNumber(textForExtraction);

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
