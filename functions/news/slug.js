export async function onRequestGet(context) {
  const { request, env } = context;
  const slug = request.url.split('/').pop();

  const firebaseUrl = `https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents/news/${slug}`;
  const res = await fetch(firebaseUrl);
  const data = await res.json();

  if (!data.fields) return new Response("News not found", { status: 404 });

  const news = {
    title: data.fields.title.stringValue,
    description: data.fields.description.stringValue,
    featuredImage: data.fields.featuredImage.stringValue,
    content: data.fields.content.stringValue,
  }

  const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <title>${news.title} | Primetime News</title>
    <meta property="og:title" content="${news.title}" />
    <meta property="og:description" content="${news.description}" />
    <meta property="og:image" content="${news.featuredImage}" />
    <meta property="og:url" content="${request.url}" />
    <meta property="og:type" content="article" />
  </head>
  <body>
    <h1>${news.title}</h1>
    <img src="${news.featuredImage}" width="100%" />
    <p>${news.content}</p>
  </body>
  </html>
  `;
  return new Response(html, { headers: { 'Content-Type': 'text/html' } });
}