export async function onRequest(context) { 
  const { request, env } = context; 
  const requestUrl = new URL(request.url); 
  const articleId = requestUrl.searchParams.get("id"); 
  const ua = (request.headers.get("User-Agent") || "").toLowerCase();

  if (!articleId) { 
    return context.next(); 
  } 

  const projectId = env.FIREBASE_PROJECT_ID;
  const defaultImg = `${requestUrl.origin}/images/profile.png`;

  try { 
    const accessToken = await createFirebaseAccessToken(env.FIREBASE_CLIENT_EMAIL, env.FIREBASE_PRIVATE_KEY); 
    
    const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents/news/${encodeURIComponent(articleId)}`; 
    const firebaseResponse = await fetch(firestoreUrl, { headers: { Authorization: `Bearer ${accessToken}` } }); 
    
    if (!firebaseResponse.ok) return context.next(); 
    
    const firestoreData = await firebaseResponse.json(); 
    const fields = firestoreData.fields || {}; 
    const headline = getFirestoreValue(fields.headline) || "Primetime News Cotabato"; 
    let summary = getFirestoreValue(fields.summary);
    if(!summary) {
      const content = getFirestoreValue(fields.content) || "";
      summary = content.replace(/<[^>]*>/g, '').substring(0, 200) + '...';
    }
    let featuredImage = getFirestoreValue(fields.featuredImage) || defaultImg; 

    if (featuredImage && !featuredImage.startsWith('http')) {
      featuredImage = new URL(featuredImage, requestUrl.origin).toString();
    }

    const safeTitle = escapeHtml(headline); 
    const safeDescription = escapeHtml(summary); 
    const safeUrl = escapeHtml(requestUrl.toString()); 
    const safeImage = escapeHtml(featuredImage); 

    const ogTags = `
      <meta property="og:url" content="${safeUrl}">
      <meta property="og:type" content="article">
      <meta property="og:title" content="${safeTitle}">
      <meta property="og:description" content="${safeDescription}">
      <meta property="og:site_name" content="Primetime News Cotabato">
      <meta property="og:image" content="${safeImage}">
      <meta property="og:image:width" content="1200">
      <meta property="og:image:height" content="630">
      <meta name="twitter:card" content="summary_large_image">
    `;

    // KEY: Pag FB bot, serve agad ng OG
    if (ua.includes("facebook") || ua.includes("facebookexternalhit")) {
      return new Response(`<!doctype html><html><head><title>${safeTitle}</title>${ogTags}</head><body></body></html>`, {
        headers: { "Content-Type": "text/html; charset=UTF-8" }
      });
    }

    // Pag tao, inject sa article.html
    const response = await context.next(); 
    let html = await response.text(); 
    html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${safeTitle} | Primetime News Cotabato</title>`); 
    html = html.replace(/<\/head>/i, `${ogTags}\n</head>`); 
    
    return new Response(html, { status: response.status, headers: { "Content-Type": "text/html; charset=UTF-8" } }); 

  } catch (error) { 
    return context.next(); 
  } 
} 

function getFirestoreValue(field) { if (!field) return ""; return field.stringValue || field.integerValue || field.doubleValue || field.booleanValue || field.timestampValue || ""; } 
function escapeHtml(value = "") { return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;"); } 
async function createFirebaseAccessToken(clientEmail, privateKey) { /* same code mo dito */ 
const now = Math.floor(Date.now() / 1000); const header = { alg: "RS256", typ: "JWT" }; const payload = { iss: clientEmail, scope: "https://www.googleapis.com/auth/datastore", aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600 }; const encodedHeader = btoa(JSON.stringify(header)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); const encodedPayload = btoa(JSON.stringify(payload)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); const unsignedToken = `${encodedHeader}.${encodedPayload}`; const normalizedPrivateKey = privateKey.replace(/\\n/g, "\n"); const pemContents = normalizedPrivateKey.replace("-----BEGIN PRIVATE KEY-----", "").replace("-----END PRIVATE KEY-----", "").replace(/\s/g, ""); const binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0)); const cryptoKey = await crypto.subtle.importKey("pkcs8", binaryKey.buffer, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]); const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", cryptoKey, new TextEncoder().encode(unsignedToken)); const jwt = `${unsignedToken}.${btoa(String.fromCharCode(...new Uint8Array(signature))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")}`; const tokenResponse = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: jwt }) }); const tokenData = await tokenResponse.json(); return tokenData.access_token; }
