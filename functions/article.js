export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  const ua = (request.headers.get("User-Agent") || "").toLowerCase();

  if (!id) return context.next();

  const redirectUrl = `/article.html?id=${id}`;
  const defaultTitle = "Prime Time News Cotabato";
  const defaultDesc = "Latest News and Updates";
  const defaultImg =
    "https://primetimenewscotabato.pages.dev/images/profile.png";

  try {
    const res = await fetch(
      `https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents/news/${id}`
    );

    if (!res.ok) throw new Error("fetch failed");

    const doc = await res.json();
    const f = doc.fields || {};

    const headline = f.headline?.stringValue || defaultTitle;
    const summary = f.summary?.stringValue || defaultDesc;
    const image = f.featuredImage?.stringValue || defaultImg;

    // Facebook
    if (
      ua.includes("facebook") ||
      ua.includes("facebot")
    ) {
      return new Response(
        `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>${headline}</title>
<meta property="og:title" content="${headline}">
<meta property="og:description" content="${summary}">
<meta property="og:image" content="${image}">
<meta property="og:url" content="${url.href}">
<meta property="og:type" content="article">
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
  } catch (e) {
    console.log("Error:", e);
  }

  // Normal visitor
  return Response.redirect(redirectUrl, 302);
}
