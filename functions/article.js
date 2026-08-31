export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const id = url.searchParams.get("id");

  if (!id) return context.next();

  // TEST LANG MUNA. Walang firebase para sure
  const html = `<!doctype html>
<html><head>
  <meta charset="utf-8">
  <title>ARTICLE ${id}</title>
  <meta property="og:title" content="ARTICLE ${id} - GUMANA NA" />
  <meta property="og:description" content="Pag nakita mo to sa FB, solved na" />
  <meta property="og:image" content="https://i.imgur.com/8Km9tLL.png" />
  <meta property="og:url" content="${url.href}" />
  <meta http-equiv="refresh" content="0;url=/article.html?id=${id}" />
</head><body>Redirecting...</body></html>`;

  return new Response(html, { 
    headers: { "Content-Type": "text/html; charset=utf-8" },
    status: 200 
  });
}
