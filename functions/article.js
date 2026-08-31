export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  const userAgent = request.headers.get('User-Agent') || '';

  if (!id) return context.next();

  try {
    const res = await fetch(`https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents/news/${id}`);
    if (!res.ok) return context.next();
    const doc = await res.json();
    const data = doc.fields;

    const headline = data.headline.stringValue || "No Title";
    const summary = data.summary.stringValue || "No Summary";
    const image = data.featuredImage.stringValue || "https://primetimenewscotabato.pages.dev/images/profile.png";

    // KUNG FB BOT: bigay natin OG tags
    if (userAgent.includes('facebook') || userAgent.includes('Facebot')) {
      const html = `<!doctype html><html><head>
        <title>${headline}</title>
        <meta property="og:title" content="${headline}" />
        <meta property="og:description" content="${summary}" />
        <meta property="og:image" content="${image}" />
        <meta property="og:url" content="${url.href}" />
      </head></html>`;
      return new Response(html, { headers: { "Content-Type": "text/html" } });
    }

    // KUNG TAO: redirect agad sa article.html mo
    return Response.redirect(`/article.html?id=${id}`, 302);

  } catch (e) {
    return Response.redirect(`/article.html?id=${id}`, 302);
  }
}
