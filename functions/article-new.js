export async function onRequest(context) { 
  const { request, env } = context; 
  const url = new URL(request.url); 
  
  const id = url.searchParams.get("id"); 
  
  // WALANG ID = HOME
  if (!id) { 
    return Response.redirect(`/`, 302); 
  } 
  
  const defaultTitle = "Prime Time News Cotabato"; 
  const defaultDesc = "Latest News and Updates"; 
  const defaultImg = "https://primetimenewscotabato.pages.dev/images/profile.png"; 
  
  try { 
    const res = await fetch( 
      `https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents/news/${encodeURIComponent(id)}` 
    ); 
    
    if (!res.ok) return Response.redirect(`/`, 302);
    
    const doc = await res.json(); 
    const f = doc.fields || {}; 
    const headline = f.headline?.stringValue || defaultTitle; 
    const summary = f.summary?.stringValue || defaultDesc; 
    const image = f.featuredImage?.stringValue || defaultImg; 
    
    // FB BOT
    const ua = (request.headers.get("User-Agent") || "").toLowerCase();
    if ( ua.includes("facebook") || ua.includes("facebot") ) { 
      const escapeHtml = (v) => String(v).replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); 
      return new Response(`<!doctype html><html><head>
        <title>${escapeHtml(headline)}</title>
        <meta property="og:title" content="${escapeHtml(headline)}">
        <meta property="og:description" content="${escapeHtml(summary)}">
        <meta property="og:image" content="${escapeHtml(image)}">
        <meta property="og:url" content="${escapeHtml(url.href)}">
        <meta property="og:type" content="article">
      </head><body></body></html>`, { headers: { "Content-Type": "text/html; charset=utf-8" } }); 
    } 
    
    // TAO = SERVE ARTICLE.HTML
    const assetUrl = new URL(`/article.html?id=${id}`, url.origin); 
    return env.ASSETS.fetch(new Request(assetUrl, request)); 
    
  } catch (e) { 
    return Response.redirect(`/`, 302); 
  } 
}
