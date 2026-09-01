export async function onRequest(context) {
  const { request, env } = context;

  const url = new URL(request.url);

  // ==========================================
  // ONLY HANDLE /article
  // DO NOT INTERFERE WITH /article.html
  // ==========================================
  if (url.pathname !== "/article") {
    return context.next();
  }

  const id = url.searchParams.get("id");
  const ua = (request.headers.get("User-Agent") || "").toLowerCase();

  if (!id) {
    return context.next();
  }

  // ==========================================
  // NORMAL VISITOR DESTINATION
  // ==========================================
  const redirectUrl = new URL(
    `/article.html?id=${encodeURIComponent(id)}`,
    url.origin
  ).toString();

  const defaultTitle = "Prime Time News Cotabato";
  const defaultDesc = "Latest News and Updates";
  const defaultImg =
    "https://primetimenewscotabato.pages.dev/images/profile.png";

  try {
    // ==========================================
    // GET ARTICLE FROM FIRESTORE
    // ==========================================
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
    // FACEBOOK BOT
    // ==========================================
    if (
      ua.includes("facebook") ||
      ua.includes("facebot") ||
      ua.includes("facebookexternalhit")
    ) {
      return new Response(
        `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">

<title>${headline}</title>

<meta property="og:title" content="${headline}">
<meta property="og:description" content="${summary}">
<meta property="og:image" content="${image}">
<meta property="og:url" content="${url.href}">
<meta property="og:type" content="article">

<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${headline}">
<meta name="twitter:description" content="${summary}">
<meta name="twitter:image" content="${image}">

</head>
<body></body>
</html>`,
        {
          headers: {
            "Content-Type": "text/html; charset=utf-8"
          }
        }
      );
    }

  } catch (error) {
    console.log("Article Function Error:", error);
  }

  // ==========================================
  // NORMAL VISITOR
  // ==========================================
  return Response.redirect(redirectUrl, 302);
}
