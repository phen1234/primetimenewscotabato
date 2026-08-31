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

    return new Response(`<!doctype html><html><head>
      <meta charset="utf-8">
      <title>${data.headline}</title>
      <meta property="og:title" content="${data.headline}" />
      <meta property="og:description" content="${data.summary}" />
      <meta property="og:image" content="${data.featuredImage}" />
      <meta property="og:url" content="${url.href}" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta http-equiv="refresh" content="0;url=/article.html?id=${id}" />
    </head><body>Redirecting...</body></html>`, { 
      headers: { "Content-Type": "text/html" } 
    });
  } catch (e) {
    return context.next();
  }
}
