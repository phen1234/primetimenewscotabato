export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const id = url.searchParams.get("id");

  if (!id) return context.next();

  try {
    // Kunin sa Firebase gamit REST API - walang admin SDK para hindi mag crash
    const res = await fetch(`https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents/news/${id}`);
    
    if (!res.ok) return context.next();
    const doc = await res.json();
    const data = doc.fields;

    const headline = data.headline.stringValue || "No Title";
    const summary = data.summary.stringValue || "No Summary";
    const image = data.featuredImage.stringValue || "https://primetimenewscotabato.pages.dev/images/profile.png";

    const html = `<!doctype html>
<html lang="en"><head>
  <meta charset="utf-8">
  <title>${headline}</title>
  <meta name="description" content="${summary}" />
  
  <meta property="og:type" content="article" />
  <meta property="og:title" content="${headline}" />
  <meta property="og:description" content="${summary}" />
  <meta property="og:image" content="${image}" />
  <meta property="og:url" content="${url.href}" />
  
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${headline}" />
  <meta name="twitter:description" content="${summary}" />
  <meta name="twitter:image" content="${image}" />

  <meta http-equiv="refresh" content="0;url=/article.html?id=${id}" />
</head><body>Redirecting...</body></html>`;

    return new Response(html, { 
      headers: { "Content-Type": "text/html; charset=utf-8" } 
    });
  } catch (e) {
    return context.next();
  }
}
