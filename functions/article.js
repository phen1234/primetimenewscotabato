export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const id = url.searchParams.get("id");

  if (!id) return context.next();

  try {
    const { initializeApp, cert, getApps } = await import("firebase-admin/app");
    const { getFirestore } = await import("firebase-admin/firestore");

    if (!getApps().length) {
      initializeApp({
        credential: cert({
          projectId: env.FIREBASE_PROJECT_ID,
          clientEmail: env.FIREBASE_CLIENT_EMAIL,
          privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
      });
    }

    const db = getFirestore();
    const doc = await db.collection("news").doc(id).get();

    if (!doc.exists) return context.next();
    const data = doc.data();

    const html = `<!doctype html>
<html lang="en"><head>
  <meta charset="utf-8">
  <title>${data.headline}</title>
  <meta name="description" content="${data.summary}" />
  
  <meta property="og:type" content="article" />
  <meta property="og:title" content="${data.headline}" />
  <meta property="og:description" content="${data.summary}" />
  <meta property="og:image" content="${data.featuredImage}" />
  <meta property="og:url" content="${url.href}" />
  
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${data.headline}" />
  <meta name="twitter:description" content="${data.summary}" />
  <meta name="twitter:image" content="${data.featuredImage}" />

  <meta http-equiv="refresh" content="0;url=/article.html?id=${id}" />
</head><body>Redirecting...</body></html>`;

    return new Response(html, { 
      headers: { "Content-Type": "text/html; charset=utf-8" } 
    });
  } catch (e) {
    return context.next();
  }
}
