export async function onRequest(context) { 
  const { request, env } = context; 
  const url = new URL(request.url); 
  
  // ONLY HANDLE /article 
  if (url.pathname !== "/article") { 
    return context.next(); 
  } 
  
  const id = url.searchParams.get("id"); 
  const ua = (request.headers.get("User-Agent") || "").toLowerCase(); 
  
  // FIX DITO: Walang article ID = redirect sa homepage
  if (!id) { 
    return Response.redirect(`/`, 302); // Palitan mo ng `/news.html` kung may news page ka
  } 
  
  const defaultTitle = "Prime Time News Cotabato"; 
  const defaultDesc = "Latest News and Updates"; 
  const defaultImg = "https://primetimenewscotabato.pages.dev/images/profile.png"; 
  
  try { 
    // ========================================== 
    // GET ARTICLE FROM FIRESTORE 
    // ========================================== 
    const res = await fetch( 
      `https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents/news/${encodeURIComponent(id)}` 
    ); 
    
    if (!res.ok) { 
      // Pag walang nakitang article sa DB, redirect na lang din
      return Response.redirect(`/`, 302);
    } 
    
    const doc = await res.json(); 
    const f = doc.fields || {}; 
    const headline = f.headline?.stringValue || defaultTitle; 
    const summary = f.summary?.stringValue || defaultDesc; 
    const image = f.featuredImage?.stringValue || defaultImg; 
    
    // ========================================== 
    // FACEBOOK BOT
    // ========================================== 
    if ( ua.includes("facebook") || ua.includes("facebot") || ua.includes("facebookexternalhit") ) { 
      const escapeHtml = (value) => String(value) 
        .replace(/&/g, "&amp;") 
        .replace(/"/g, "&quot;") 
        .replace(/</g, "&lt;") 
        .replace(/>/g, "&gt;"); 
        
      return new Response( 
        `<!doctype html> <html lang="en"> <head> 
        <meta charset="utf-8"> 
        <title>${escapeHtml(headline)}</title> 
        <meta property="og:title" content="${escapeHtml(headline)}"> 
        <meta property="og:description" content="${escapeHtml(summary)}"> 
        <meta property="og:image" content="${escapeHtml(image)}"> 
        <meta property="og:url" content="${escapeHtml(url.href)}"> 
        <meta property="og:type" content="article"> 
        <meta name="twitter:card" content="summary_large_image"> 
        <meta name="twitter:title" content="${escapeHtml(headline)}"> 
        <meta name="twitter:description" content="${escapeHtml(summary)}"> 
        <meta name="twitter:image" content="${escapeHtml(image)}"> 
        </head> <body></body> </html>`, 
        { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } 
      ); 
    } 
    
    // ========================================== 
    // NORMAL VISITOR: SERVE article.html
    // ========================================== 
    const assetUrl = new URL(`/article.html?id=${id}`, url.origin); 
    return env.ASSETS.fetch( 
      new Request(assetUrl, { method: request.method, headers: request.headers }) 
    ); 
    
  } catch (error) { 
    console.error("ARTICLE FUNCTION ERROR:", error); 
    return Response.redirect(`/`, 302); // Pag nag error, uwi sa homepage
  } 
}
