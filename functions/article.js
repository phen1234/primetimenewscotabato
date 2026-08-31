export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  const ua = (request.headers.get('User-Agent') || '').toLowerCase();

  if (!id) return context.next();

  const redirectUrl = `/article.html?id=${id}`;

  try {
    const res = await fetch(`https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents/news/${id}`);
    
    if (!res.ok) return Response.redirect(redirectUrl, 302);
    const doc = await res.json();
    const f = doc.fields;

    const headline = f.headline.stringValue || "Prime Time News Cotabato";
    const summary = f.summary.stringValue || "Latest News";
    const image = f.featuredImage.stringValue || "https://primetimenewscotabato.pages.dev/images/profile.png";

    // Pag FB Bot: bigay OG tags para sa thumbnail
    if (ua.includes('facebook') || ua.includes('facebot') || ua.includes('twitterbot')) {
      return new Response(`<!doctype html><html><head>
        <meta charset="utf-8">
        <title>${headline}</title>
        <meta property="og:title" content="${headline}" />
        <meta property="og:description" content="${summary}" />
        <meta property="og:image" content="${image}" />
        <meta property="og:url" content="${url.href}" />
        <meta property="og:type" content="article" />
      </head></html>`, { headers: { "Content-Type": "text/html; charset=utf-8" } });
    }
    
  } catch (e) {}

  // Pag tao: redirect agad sa article.html mo
  return Response.redirect(redirectUrl, 302);
}
