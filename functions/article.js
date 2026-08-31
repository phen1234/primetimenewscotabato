export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const id = url.searchParams.get("id");

  if (!id) return context.next();

  const html = `<!doctype html>
<html><head>
  <meta charset="utf-8">
  <title>ARTICLE ${id} - GUMAGANA NA!</title>
  <meta property="og:title" content="BREAKING: Article ${id}" />
  <meta property="og:description" content="Pag nakita mo to, solved na tayo boss" />
  <meta property="og:image" content="https://i.imgur.com/8Km9tLL.png" />
  <meta property="og:url" content="${url.href}" />
  <meta http-equiv="refresh" content="0;url=/article.html?id=${id}" />
</head><body><h1>Redirecting to article ${id}...</h1></body></html>`;

  return new Response(html, { headers: { "Content-Type": "text/html" } });
}
