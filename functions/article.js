export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  const ua = (request.headers.get('User-Agent') || '').toLowerCase();

  if (!id) return context.next();

  const redirectUrl = `/article.html?id=${id}`;

  try {
    if (!env.FIREBASE_PROJECT_ID) throw new Error("No env");

    const apiUrl = `https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents/news/${id}`;
    const res = await fetch(apiUrl);
    if (!res.ok) throw new Error("Fetch failed");

    const doc = await res.json();
    const f = doc.fields;

    const headline = f.headline.stringValue;
    const summary = f.summary.stringValue;
    const image = f.featuredImage.stringValue;

    // Pag FB bot: bigay OG tags
    if (ua.includes('facebook') || ua.includes('facebot')) {
      return new Response(`<!doctype html><html><head>
        <title>${headline}</title>
        <meta property="og:title" content="${headline}" />
        <meta property="og:description" content="${summary}" />
        <meta property="og:image" content="${image}" />
        <meta property="og:url" content="${url.href}" />
      </head></html>`, { headers: { "Content-Type": "text/html" } });
    }
    
  } catch (e) {
    // kung ano man error, diretso redirect para hindi mag 1101
  }

  // Pag tao: redirect agad
  return Response.redirect(redirectUrl, 302);
}
