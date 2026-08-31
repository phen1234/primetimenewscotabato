export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  const ua = (request.headers.get('User-Agent') || '').toLowerCase();

  if (!id) return context.next();

  const redirectUrl = `/article.html?id=${id}`;

  // Lahat ng error, redirect lang. Para walang 1101
  try {
    const projectId = env.FIREBASE_PROJECT_ID;
    if (!projectId) return Response.redirect(redirectUrl, 302);

    const apiUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/news/${id}`;
    const res = await fetch(apiUrl, { method: 'GET' });
    
    if (res.status !== 200) return Response.redirect(redirectUrl, 302);
    
    const doc = await res.json();
    if (!doc.fields) return Response.redirect(redirectUrl, 302);

    const f = doc.fields;
    const headline = f.headline?.stringValue || "Prime Time News Cotabato";
    const summary = f.summary?.stringValue || "Latest News";
    const image = f.featuredImage?.stringValue || "https://primetimenewscotabato.pages.dev/images/profile.png";

    // Pag FB Bot lang magbibigay tayo OG tags
    if (ua.includes('facebook') || ua.includes('facebot')) {
      const html = `<!doctype html><html><head>
        <meta charset="utf-8">
        <title>${headline}</title>
        <meta property="og:title" content="${headline}" />
        <meta property="og:description" content="${summary}" />
        <meta property="og:image" content="${image}" />
        <meta property="og:url" content="${url.href}" />
        <meta property="og:type" content="article" />
      </head><body></body></html>`;
      return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
    }
    
  } catch (e) {
    // ignore error, redirect lang
  }

  // Default: redirect lahat ng tao
  return Response.redirect(redirectUrl, 302);
}
