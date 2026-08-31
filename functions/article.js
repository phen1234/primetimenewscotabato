export async function onRequest(context) {
  const { request, env } = context;

  const url = new URL(request.url);
  const id = url.searchParams.get("id");

  if (!id) {
    return context.next();
  }

  const ua = (request.headers.get("User-Agent") || "").toLowerCase();

  const defaultTitle = "Prime Time News Cotabato";
  const defaultDesc = "Latest News and Updates";
  const defaultImg =
    "https://primetimenewscotabato.pages.dev/images/profile.png";

  try {
    const res = await fetch(
      `https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents/news/${id}`
    );

    if (!res.ok) {
      throw new Error("Firestore fetch failed");
    }

    const doc = await res.json();
    const f = doc.fields || {};

    const headline =
      f.headline?.stringValue || defaultTitle;

    const summary =
      f.summary?.stringValue || defaultDesc;

    const image =
      f.featuredImage?.stringValue || defaultImg;

    // ==========================================
    // FACEBOOK / SOCIAL CRAWLER
    // ==========================================
    if (
      ua.includes("facebook") ||
      ua.includes("facebot") ||
      ua.includes("facebookexternalhit")
    ) {
      const escapeHtml = (text) =>
        String(text)
          .replace(/&/g, "&amp;")
          .replace(/"/g, "&quot;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;");

      return new Response(
        `<!doctype html>
<html lang="en">
<head>
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

</head>
<body></body>
</html>`,
        {
          headers: {
            "Content-Type": "text/html; charset=utf-8",
            "Cache-Control": "public, max-age=300"
          }
        }
      );
    }

    // ==========================================
    // NORMAL VISITOR
    // SERVE article.html WITHOUT REDIRECT
    // ==========================================
    const articleUrl = new URL("/article.html", url.origin);

    const articleRequest = new Request(articleUrl, request);

    return env.ASSETS.fetch(articleRequest);

  } catch (error) {
    console.log("Article Function Error:", error);

    // Fallback: serve article.html
    const articleUrl = new URL("/article.html", url.origin);
    const articleRequest = new Request(articleUrl, request);

    return env.ASSETS.fetch(articleRequest);
  }
}
