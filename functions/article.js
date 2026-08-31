export async function onRequest(context) { 
  const { request, env } = context; 
  try { 
    const requestUrl = new URL(request.url); 
    const articleId = requestUrl.searchParams.get("id"); 
    
    if (!articleId) { return context.next(); } 
    
    const projectId = env.FIREBASE_PROJECT_ID; 
    const clientEmail = env.FIREBASE_CLIENT_EMAIL; 
    const privateKey = env.FIREBASE_PRIVATE_KEY; 
    
    if ( !projectId || !clientEmail || !privateKey ) { 
      return context.next(); 
    } 
    
    const accessToken = await createFirebaseAccessToken(clientEmail, privateKey); 
    
    const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents/news/${encodeURIComponent(articleId)}`; 
    const firebaseResponse = await fetch(firestoreUrl, { 
      method: "GET", 
      headers: { Authorization: `Bearer ${accessToken}` } 
    }); 
    
    let headline = "Primetime News Cotabato"; 
    let summary = "Read the latest news from Primetime News Cotabato."; 
    let featuredImage = "https://primetimenewscotabato.pages.dev/images/profile.png"; // default image mo
    
    if (firebaseResponse.ok) { 
      const firestoreData = await firebaseResponse.json(); 
      const fields = firestoreData.fields || {}; 
      headline = getFirestoreValue(fields.headline) || headline; 
      summary = getFirestoreValue(fields.summary) || summary; 
      featuredImage = getFirestoreValue(fields.featuredImage) || featuredImage; 
      
      if (featuredImage && !featuredImage.startsWith("http")) { 
        try { featuredImage = new URL(featuredImage, requestUrl.origin).toString(); } 
        catch (error) {} 
      } 
    } 
    
    const response = await context.next(); 
    if (!response || !response.ok) { return response; } 
    
    let html = await response.text(); 
    const articleUrl = requestUrl.toString(); 
    
    const ogTags = ` 
    <meta property="og:url" content="${escapeHtml(articleUrl)}"> 
    <meta property="og:type" content="article"> 
    <meta property="og:title" content="${escapeHtml(headline)}"> 
    <meta property="og:description" content="${escapeHtml(summary)}"> 
    <meta property="og:site_name" content="Primetime News Cotabato"> 
    <meta property="og:image" content="${escapeHtml(featuredImage)}"> 
    <meta property="og:image:width" content="1200"> 
    <meta property="og:image:height" content="630"> 
    <meta name="twitter:card" content="summary_large_image"> 
    <meta name="twitter:title" content="${escapeHtml(headline)}"> 
    <meta name="twitter:description" content="${escapeHtml(summary)}"> 
    <meta name="twitter:image" content="${escapeHtml(featuredImage)}"> 
    `; 
    
    html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(headline)} | Primetime News Cotabato</title>`); 
    if ( /<\/head>/i.test(html) ) { 
      html = html.replace(/<\/head>/i, `${ogTags}</head>`); 
    } 
    
    const headers = new Headers(response.headers); 
    headers.set("Content-Type", "text/html; charset=UTF-8"); 
    headers.set("Cache-Control", "public, max-age=300"); 
    return new Response(html, { status: response.status, headers }); 
    
  } catch (error) { 
    return await context.next(); 
  } 
} 

function getFirestoreValue(field) { 
  if (!field) return ""; 
  if (field.stringValue !== undefined) return field.stringValue; 
  if (field.integerValue !== undefined) return field.integerValue; 
  if (field.doubleValue !== undefined) return field.doubleValue; 
  if (field.booleanValue !== undefined) return field.booleanValue; 
  if (field.timestampValue !== undefined) return field.timestampValue; 
  return ""; 
} 

function escapeHtml(value = "") { 
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;"); 
} 

async function createFirebaseAccessToken(clientEmail, privateKey) { 
  const now = Math.floor(Date.now() / 1000); 
  const header = { alg: "RS256", typ: "JWT" }; 
  const payload = { iss: clientEmail, scope: "https://www.googleapis.com/auth/datastore", aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600 }; 
  const encodedHeader = base64UrlEncode(JSON.stringify(header)); 
  const encodedPayload = base64UrlEncode(JSON.stringify(payload)); 
  const unsignedToken = `${encodedHeader}.${encodedPayload}`; 
  const normalizedPrivateKey = privateKey.replace(/\\n/g, "\n"); 
  const pemContents = normalizedPrivateKey.replace("-----BEGIN PRIVATE KEY-----", "").replace("-----END PRIVATE KEY-----", "").replace(/\s/g, ""); 
  const binaryKey = Uint8Array.from(atob(pemContents), character => character.charCodeAt(0)); 
  const cryptoKey = await crypto.subtle.importKey("pkcs8", binaryKey.buffer, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]); 
  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", cryptoKey, new TextEncoder().encode(unsignedToken)); 
  const jwt = `${unsignedToken}.${base64UrlEncodeBytes(signature)}`; 
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", { 
    method: "POST", 
    headers: { "Content-Type": "application/x-www-form-urlencoded" }, 
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: jwt }) 
  }); 
  if (!tokenResponse.ok) throw new Error("Unable to authenticate with Firebase."); 
  const tokenData = await tokenResponse.json(); 
  return tokenData.access_token; 
} 

function base64UrlEncode(value) { 
  return base64UrlEncodeBytes(new TextEncoder().encode(value)); 
} 

function base64UrlEncodeBytes(bytes) { 
  let binary = ""; 
  const chunkSize = 0x8000; 
  for (let i = 0; i < bytes.length; i += chunkSize) { 
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize)); 
  } 
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); 
}
