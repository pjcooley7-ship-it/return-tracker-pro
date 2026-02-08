const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function structuredLog(severity: string, message: string, data?: Record<string, unknown>) {
  const entry = JSON.stringify({
    severity,
    function: "gmail-scan",
    message,
    timestamp: new Date().toISOString(),
    ...data,
  });
  if (severity === "ERROR") console.error(entry);
  else console.log(entry);
}

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

interface GmailMessagePart {
  partId?: string;
  mimeType?: string;
  filename?: string;
  headers?: Array<{ name: string; value: string }>;
  body?: { attachmentId?: string; data?: string; size?: number };
  parts?: GmailMessagePart[];
}

interface GmailMessage {
  id: string;
  threadId: string;
  labelIds?: string[];
  snippet: string;
  payload?: GmailMessagePart;
}

function decodeBase64Url(data: string): string {
  const base64 = data.replace(/-/g, "+").replace(/_/g, "/");
  try {
    return atob(base64);
  } catch {
    return "";
  }
}

// Extract text content from PDF binary data
function extractTextFromPdf(pdfData: Uint8Array): string {
  // Simple PDF text extraction - looks for text streams
  // This handles most simple return label PDFs
  try {
    const decoder = new TextDecoder("utf-8", { fatal: false });
    const text = decoder.decode(pdfData);
    
    // Extract text between stream markers (simplified PDF parsing)
    const textChunks: string[] = [];
    
    // Look for literal text in the PDF
    const literalPattern = /\(([^)]+)\)/g;
    let match;
    while ((match = literalPattern.exec(text)) !== null) {
      const chunk = match[1];
      // Filter out binary garbage - keep only printable strings
      if (chunk.length > 2 && /^[\x20-\x7E\s]+$/.test(chunk)) {
        textChunks.push(chunk);
      }
    }
    
    // Also look for hex-encoded text
    const hexPattern = /<([0-9A-Fa-f]+)>/g;
    while ((match = hexPattern.exec(text)) !== null) {
      const hex = match[1];
      if (hex.length >= 4 && hex.length % 2 === 0) {
        let decoded = "";
        for (let i = 0; i < hex.length; i += 2) {
          const charCode = parseInt(hex.substr(i, 2), 16);
          if (charCode >= 32 && charCode <= 126) {
            decoded += String.fromCharCode(charCode);
          }
        }
        if (decoded.length > 2) {
          textChunks.push(decoded);
        }
      }
    }
    
    return textChunks.join(" ");
  } catch (error) {
    structuredLog("WARN", "PDF text extraction error", { error: String(error) });
    return "";
  }
}

// Fetch and extract text from PDF attachments
async function extractPdfAttachmentText(
  messageId: string,
  attachmentId: string,
  accessToken: string
): Promise<string> {
  try {
    const attachmentUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/attachments/${attachmentId}`;
    const response = await fetch(attachmentUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    
    if (!response.ok) {
      structuredLog("WARN", "Failed to fetch attachment", { attachmentId });
      return "";
    }
    
    const attachmentData = await response.json();
    if (!attachmentData.data) return "";
    
    // Decode base64url to binary
    const base64 = attachmentData.data.replace(/-/g, "+").replace(/_/g, "/");
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    return extractTextFromPdf(bytes);
  } catch (error) {
    structuredLog("WARN", "Error extracting PDF attachment", { error: String(error) });
    return "";
  }
}

// Find PDF attachments in message parts recursively
function findPdfAttachments(part: GmailMessagePart): Array<{ filename: string; attachmentId: string }> {
  const pdfs: Array<{ filename: string; attachmentId: string }> = [];
  
  if (part.mimeType === "application/pdf" && part.body?.attachmentId) {
    pdfs.push({
      filename: part.filename || "attachment.pdf",
      attachmentId: part.body.attachmentId,
    });
  }
  
  if (part.parts) {
    for (const subpart of part.parts) {
      pdfs.push(...findPdfAttachments(subpart));
    }
  }
  
  return pdfs;
}

// Recursively extract text/plain body from nested multipart emails
function extractBodyText(part: GmailMessagePart): string {
  // Direct body data
  if (part.mimeType === "text/plain" && part.body?.data) {
    return decodeBase64Url(part.body.data);
  }
  // Recurse into sub-parts (multipart/alternative, multipart/mixed, etc.)
  if (part.parts) {
    // Prefer text/plain over text/html
    for (const sub of part.parts) {
      if (sub.mimeType === "text/plain" && sub.body?.data) {
        return decodeBase64Url(sub.body.data);
      }
    }
    // If no plain text, try HTML stripped or recurse deeper
    for (const sub of part.parts) {
      const result = extractBodyText(sub);
      if (result) return result;
    }
  }
  // Fallback: try HTML and strip tags
  if (part.mimeType === "text/html" && part.body?.data) {
    const html = decodeBase64Url(part.body.data);
    return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  }
  return "";
}

function extractHeader(headers: Array<{ name: string; value: string }> | undefined, name: string): string | null {
  return headers?.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value || null;
}

// Extract domain/name from email "From" header for vendor fallback
function extractSenderVendor(from: string): string | null {
  // Match email address in "Name <email@domain.com>" or "email@domain.com"
  const emailMatch = from.match(/<([^>]+)>/) || from.match(/([^\s]+@[^\s]+)/);
  if (emailMatch) {
    const email = emailMatch[1].toLowerCase();
    const domain = email.split("@")[1];
    if (!domain) return null;
    // Skip generic email providers
    const genericDomains = [
      "gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "icloud.com",
      "mail.com", "aol.com", "protonmail.com", "gmx.com", "gmx.ch", "gmx.de",
      "bluewin.ch", "sunrise.ch", "hispeed.ch",
    ];
    if (genericDomains.includes(domain)) return null;
    // Use the second-level domain as vendor name, capitalized
    const parts = domain.split(".");
    const name = parts.length >= 2 ? parts[parts.length - 2] : parts[0];
    return name.charAt(0).toUpperCase() + name.slice(1);
  }
  // Try extracting the display name portion
  const nameMatch = from.match(/^"?([^"<]+)"?\s*</);
  if (nameMatch) {
    return nameMatch[1].trim();
  }
  return null;
}

function detectVendor(from: string, subject: string, body: string = ""): string | null {
  const combined = `${from} ${subject} ${body}`;
  for (const vendor of VENDOR_PATTERNS) {
    if (vendor.pattern.test(combined)) {
      return vendor.name;
    }
  }
  // Fallback: extract vendor from sender domain
  return extractSenderVendor(from);
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
    structuredLog("INFO", "No LOVABLE_API_KEY, skipping translation");
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
      structuredLog("WARN", "Translation failed", { status: response.status });
      return text;
    }
    
    const data = await response.json();
    return data.choices?.[0]?.message?.content || text;
  } catch (error) {
    structuredLog("WARN", "Translation error", { error: String(error) });
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

function extractAmount(text: string): { amount: number; currency: string } | null {
  // Support multiple currency formats — each pattern maps to its currency
  const patterns: Array<{ regex: RegExp; currency: string }> = [
    { regex: /\$([0-9,]+\.?[0-9]*)/, currency: "USD" },
    { regex: /€\s*([0-9.,]+)/, currency: "EUR" },
    { regex: /CHF\s*([0-9.']+)/i, currency: "CHF" },
    { regex: /£([0-9,]+\.?[0-9]*)/, currency: "GBP" },
    { regex: /([0-9.,]+)\s*€/, currency: "EUR" },
    { regex: /([0-9.']+)\s*CHF/i, currency: "CHF" },
  ];

  for (const { regex, currency } of patterns) {
    const match = text.match(regex);
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
      return { amount: parseFloat(numStr), currency };
    }
  }
  return null;
}

function extractTrackingNumber(text: string): { carrier: string; number: string } | null {
  // Comprehensive tracking number patterns for global carriers
  const patterns = [
    // === USA ===
    { carrier: "UPS", pattern: /\b(1Z[A-Z0-9]{16})\b/i },
    { carrier: "FedEx", pattern: /\b((?:96\d{20}|[0-9]{12}|[0-9]{15}|[0-9]{20}|[0-9]{22}))\b/ },
    { carrier: "USPS", pattern: /\b(9[0-9]{15,21})\b/ },
    { carrier: "USPS", pattern: /\b([A-Z]{2}[0-9]{9}US)\b/i },
    { carrier: "USPS", pattern: /\b((?:94|93|92|91)[0-9]{18,22})\b/ },
    
    // === INTERNATIONAL / EUROPE ===
    // DHL (multiple formats)
    { carrier: "DHL", pattern: /\b([0-9]{10,11})\b(?=.*(?:dhl|express|shipment))/i },
    { carrier: "DHL", pattern: /\b(JD[0-9]{18})\b/i },
    { carrier: "DHL", pattern: /\b([0-9]{3}[- ]?[0-9]{8}[- ]?[0-9]{1})\b/ },
    { carrier: "DHL Express", pattern: /\b([0-9]{10})\b(?=.*dhl)/i },
    
    // DPD
    { carrier: "DPD", pattern: /\b(0[0-9]{13})\b/ },
    { carrier: "DPD", pattern: /\b([0-9]{14})\b(?=.*dpd)/i },
    
    // GLS
    { carrier: "GLS", pattern: /\b([0-9]{11,12})\b(?=.*gls)/i },
    { carrier: "GLS", pattern: /\b([A-Z]{2}[0-9]{9}[A-Z]{2})\b/i },
    
    // Hermes / Evri (UK)
    { carrier: "Hermes", pattern: /\b([0-9]{16})\b(?=.*(?:hermes|evri))/i },
    
    // Royal Mail (UK)
    { carrier: "Royal Mail", pattern: /\b([A-Z]{2}[0-9]{9}GB)\b/i },
    
    // === SWITZERLAND ===
    // Swiss Post
    { carrier: "Swiss Post", pattern: /\b(99\.[0-9]{2}\.[0-9]{6}\.[0-9]{8})\b/ },
    { carrier: "Swiss Post", pattern: /\b([0-9]{18})\b(?=.*(?:swiss|post|poste))/i },
    { carrier: "Swiss Post", pattern: /\b([A-Z]{2}[0-9]{9}CH)\b/i },
    
    // === GERMANY ===
    // Deutsche Post / DHL Germany
    { carrier: "Deutsche Post", pattern: /\b([A-Z]{2}[0-9]{9}DE)\b/i },
    
    // === FRANCE ===
    // La Poste / Colissimo
    { carrier: "La Poste", pattern: /\b([0-9]{11}[A-Z])\b/i },
    { carrier: "Colissimo", pattern: /\b([A-Z]{2}[0-9]{9}FR)\b/i },
    { carrier: "Chronopost", pattern: /\b([A-Z]{2}[0-9]{13})\b/i },
    
    // === NETHERLANDS ===
    // PostNL
    { carrier: "PostNL", pattern: /\b(3S[A-Z0-9]{12,14})\b/i },
    { carrier: "PostNL", pattern: /\b([A-Z]{2}[0-9]{9}NL)\b/i },
    
    // === SPAIN ===
    // Correos
    { carrier: "Correos", pattern: /\b([A-Z]{2}[0-9]{9}ES)\b/i },
    
    // === ITALY ===
    // Poste Italiane / SDA
    { carrier: "Poste Italiane", pattern: /\b([A-Z]{2}[0-9]{9}IT)\b/i },
    { carrier: "SDA", pattern: /\b([0-9]{12})\b(?=.*sda)/i },
    
    // === AUSTRIA ===
    { carrier: "Austrian Post", pattern: /\b([A-Z]{2}[0-9]{9}AT)\b/i },
    
    // === CANADA ===
    { carrier: "Canada Post", pattern: /\b([0-9]{16})\b(?=.*canada\s*post)/i },
    { carrier: "Canada Post", pattern: /\b([A-Z]{2}[0-9]{9}CA)\b/i },
    
    // === AUSTRALIA ===
    { carrier: "Australia Post", pattern: /\b([A-Z]{2}[0-9]{9}AU)\b/i },
    
    // === GENERIC INTERNATIONAL (EMS/Universal Postal Union) ===
    { carrier: "EMS", pattern: /\b(E[A-Z][0-9]{9}[A-Z]{2})\b/i },
    { carrier: "International", pattern: /\b([A-Z]{2}[0-9]{9}[A-Z]{2})\b/i },
  ];

  for (const { carrier, pattern } of patterns) {
    const match = text.match(pattern);
    if (match) {
      // Clean up the tracking number
      const trackingNum = match[1].replace(/[- ]/g, "").toUpperCase();
      // Validate minimum length for generic numeric patterns
      if (/^[0-9]+$/.test(trackingNum) && trackingNum.length < 10) {
        continue; // Skip too-short numeric matches
      }
      return { carrier, number: trackingNum };
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
    
    structuredLog("INFO", "Starting request", { days });
    
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
      structuredLog("WARN", "User verification failed", { error: String(userError) });
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = userData.user.id;
    structuredLog("INFO", "User verified", { userId });

    // Get connected Gmail account
    const { data: account, error: accountError } = await supabase
      .from("connected_accounts")
      .select("*")
      .eq("user_id", userId)
      .eq("account_type", "gmail")
      .eq("is_active", true)
      .single();

    if (accountError || !account) {
      structuredLog("WARN", "No Gmail account found");
      return new Response(
        JSON.stringify({ error: "Gmail not connected" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create a service_role client for decrypt/encrypt operations
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    // Decrypt access token
    const { data: decryptedAccessToken, error: decryptAccessErr } = await serviceClient
      .rpc("decrypt_token", { ciphertext: account.access_token_encrypted });
    if (decryptAccessErr || !decryptedAccessToken) {
      structuredLog("ERROR", "Failed to decrypt access token", { error: String(decryptAccessErr) });
      return new Response(
        JSON.stringify({ error: "Failed to decrypt token" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let accessToken: string = decryptedAccessToken;

    // Check if token is expired and refresh if needed
    if (account.token_expires_at && new Date(account.token_expires_at) < new Date()) {
      structuredLog("INFO", "Token expired, refreshing");

      const clientId = Deno.env.get("GOOGLE_CLIENT_ID")!;
      const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET")!;

      // Decrypt refresh token
      const { data: decryptedRefreshToken, error: decryptRefreshErr } = await serviceClient
        .rpc("decrypt_token", { ciphertext: account.refresh_token_encrypted });
      if (decryptRefreshErr || !decryptedRefreshToken) {
        structuredLog("ERROR", "Failed to decrypt refresh token", { error: String(decryptRefreshErr) });
        return new Response(
          JSON.stringify({ error: "Failed to decrypt refresh token" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const refreshResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: decryptedRefreshToken,
          grant_type: "refresh_token",
        }),
      });

      if (!refreshResponse.ok) {
        structuredLog("ERROR", "Token refresh failed");
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

      // Encrypt new access token before storing
      const { data: encNewAccessToken, error: encErr } = await serviceClient
        .rpc("encrypt_token", { plaintext: newTokens.access_token });
      if (encErr) {
        structuredLog("ERROR", "Failed to encrypt new access token", { error: String(encErr) });
      }

      // Update tokens in database
      await supabase
        .from("connected_accounts")
        .update({
          access_token_encrypted: encNewAccessToken || newTokens.access_token,
          token_expires_at: new Date(Date.now() + newTokens.expires_in * 1000).toISOString(),
        })
        .eq("id", account.id);
    }

    // Search for return-related emails with configurable time range.
    // No `subject:` prefix — searches full email (subject + body + attachments).
    // Broad multilingual terms to catch German/French/Italian/Spanish/Dutch returns.
    // Multi-word phrases are quoted for exact matching in Gmail search.
    const searchTerms = [
      // English
      '"return label"', '"return confirmation"', 'refund', 'RMA',
      '"return authorized"', '"return shipment"', '"refund processed"',
      '"money back"', '"return request"',
      // German / Swiss-German
      'rücksendung', 'retoure', 'retourenlabel', 'rücksendeetikett',
      'rückerstattung', 'rückgabe', 'erstattung', 'umtausch',
      'rücksendeschein', 'retourenformular',
      // French
      'remboursement', '"bon de retour"', '"retour confirmé"',
      '"étiquette de retour"',
      // Italian
      'rimborso', '"reso confermato"', '"etichetta di reso"', 'restituzione',
      // Spanish
      '"devolución confirmada"', 'reembolso', '"etiqueta de devolución"',
      // Dutch
      '"retour bevestigd"', 'retourlabel', 'terugbetaling',
    ];
    const query = `(${searchTerms.join(" OR ")}) newer_than:${days}d`;
    const maxResults = days > 90 ? 100 : 50; // More results for longer ranges
    const searchUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=${maxResults}`;

    structuredLog("INFO", "Searching emails", { query });
    
    const searchResponse = await fetch(searchUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      structuredLog("ERROR", "Gmail search failed", { response: errorText });
      return new Response(
        JSON.stringify({ error: "Failed to search emails" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const searchData = await searchResponse.json();
    const messages = searchData.messages || [];

    structuredLog("INFO", "Found potential return emails", { count: messages.length });

    interface DetectedReturnResult {
      vendor: string;
      orderNumber: string | null;
      amount: number | null;
      currency: string | null;
      subject: string;
      date: string;
      emailId: string;
      tracking: { carrier: string; number: string } | null;
    }

    interface ScannedEmailResult {
      subject: string;
      from: string;
      date: string;
      emailId: string;
      isReturnRelated: boolean;
      detectedVendor: string | null;
      reason: string;
    }

    interface ProcessEmailResult {
      scannedEmail: ScannedEmailResult;
      detectedReturn?: DetectedReturnResult;
    }

    // Process a single email message
    async function processEmail(msgId: string, token: string): Promise<ProcessEmailResult> {
      const msgUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msgId}?format=full`;
      const msgResponse = await fetch(msgUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!msgResponse.ok) {
        return {
          scannedEmail: {
            subject: "(failed to fetch)",
            from: "",
            date: "",
            emailId: msgId,
            isReturnRelated: false,
            detectedVendor: null,
            reason: "Failed to fetch email details",
          },
        };
      }

      const message: GmailMessage = await msgResponse.json();
      const headers = message.payload?.headers;
      const subject = extractHeader(headers, "Subject") || "(no subject)";
      const from = extractHeader(headers, "From") || "";
      const date = extractHeader(headers, "Date") || "";

      // Get email body — recursively search nested multipart structures
      let body = "";
      if (message.payload) {
        body = extractBodyText(message.payload);
      }

      // Extract text from PDF attachments in parallel (return labels often contain tracking numbers)
      let pdfText = "";
      if (message.payload) {
        const pdfAttachments = findPdfAttachments(message.payload);
        if (pdfAttachments.length > 0) {
          structuredLog("INFO", "Found PDF attachments", { count: pdfAttachments.length, emailId: msgId });
          // Process first 2 PDFs in parallel
          const pdfResults = await Promise.allSettled(
            pdfAttachments.slice(0, 2).map(pdf =>
              extractPdfAttachmentText(msgId, pdf.attachmentId, token)
            )
          );
          for (let i = 0; i < pdfResults.length; i++) {
            const result = pdfResults[i];
            if (result.status === "fulfilled" && result.value) {
              pdfText += ` ${result.value}`;
              structuredLog("INFO", "Extracted text from PDF", { chars: result.value.length, filename: pdfAttachments[i].filename });
            }
          }
        }
      }

      const fullText = `${subject} ${body} ${pdfText}`;

      // Detect language and translate if non-English
      const detectedLang = detectLanguage(fullText);
      let wasTranslated = false;
      let translatedText = fullText;

      if (detectedLang !== "en") {
        structuredLog("INFO", "Detected non-English language, translating", { language: detectedLang });
        translatedText = await translateToEnglish(fullText, detectedLang);
        wasTranslated = translatedText !== fullText;
      }

      // Check if this is return-related (and not a false positive like tax returns)
      const { isRelated: returnRelated, isExcluded } = isReturnRelated(subject, body);
      const { isRelated: returnRelatedPdf } = pdfText
        ? isReturnRelated("", pdfText)
        : { isRelated: false };
      const { isRelated: returnRelatedTranslated } = wasTranslated
        ? isReturnRelated(translatedText, translatedText)
        : { isRelated: false };

      const isReturn = returnRelated || returnRelatedPdf || returnRelatedTranslated;

      // Detect vendor — check from/subject/body and translated text
      const vendor = detectVendor(from, subject, body)
        || (wasTranslated ? detectVendor(from, subject, translatedText) : null);

      // Build reason string
      let reason = "";
      const hasPdfAttachment = pdfText.length > 0;
      if (isExcluded) {
        reason = "Excluded (tax/investment/non-retail context)";
      } else if (!isReturn) {
        reason = wasTranslated
          ? `No return keywords (translated from ${detectedLang.toUpperCase()})`
          : "No return keywords found";
      } else if (!vendor) {
        reason = wasTranslated
          ? `Return-related (${detectedLang.toUpperCase()}) — enter vendor to save`
          : "Return-related — enter vendor to save";
      } else {
        reason = wasTranslated
          ? `Detected as return (translated from ${detectedLang.toUpperCase()})`
          : "Detected as return";
        if (hasPdfAttachment) {
          reason += " (PDF scanned)";
        }
      }

      const scannedEmail: ScannedEmailResult = {
        subject,
        from,
        date,
        emailId: msgId,
        isReturnRelated: isReturn && !isExcluded,
        detectedVendor: vendor,
        reason,
      };

      if (!isReturn || isExcluded) {
        return { scannedEmail };
      }

      // Extract data from both original and translated text (including PDF content)
      const textForExtraction = wasTranslated ? `${fullText} ${translatedText}` : fullText;
      const orderNumber = extractOrderNumber(textForExtraction);
      const amountResult = extractAmount(textForExtraction);

      // Try to extract tracking from email body first, then from PDF
      let tracking = extractTrackingNumber(body);
      if (!tracking && pdfText) {
        tracking = extractTrackingNumber(pdfText);
        if (tracking) {
          structuredLog("INFO", "Found tracking in PDF", { carrier: tracking.carrier, number: tracking.number });
        }
      }
      if (!tracking) {
        tracking = extractTrackingNumber(textForExtraction);
      }

      return {
        scannedEmail,
        detectedReturn: {
          vendor: vendor || "Unknown",
          orderNumber,
          amount: amountResult?.amount ?? null,
          currency: amountResult?.currency ?? null,
          subject,
          date,
          emailId: msgId,
          tracking,
        },
      };
    }

    const detectedReturns: DetectedReturnResult[] = [];
    const scannedEmails: ScannedEmailResult[] = [];

    // Process emails in parallel batches of 10
    const messagesToProcess = messages.slice(0, 50);
    const BATCH_SIZE = 10;
    for (let i = 0; i < messagesToProcess.length; i += BATCH_SIZE) {
      const batch = messagesToProcess.slice(i, i + BATCH_SIZE);
      const results = await Promise.allSettled(
        batch.map((msg: { id: string }) => processEmail(msg.id, accessToken))
      );

      for (const result of results) {
        if (result.status === "fulfilled") {
          scannedEmails.push(result.value.scannedEmail);
          if (result.value.detectedReturn) {
            detectedReturns.push(result.value.detectedReturn);
          }
        } else {
          structuredLog("ERROR", "Email processing failed", { error: String(result.reason) });
        }
      }
    }

    // Update last sync time
    await supabase
      .from("connected_accounts")
      .update({ last_sync_at: new Date().toISOString() })
      .eq("id", account.id);

    structuredLog("INFO", "Scan complete", { detectedReturns: detectedReturns.length, scannedEmails: scannedEmails.length });

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
    structuredLog("ERROR", "Unhandled error", { error: String(error) });
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
