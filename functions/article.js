export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const id = url.searchParams.get("id");

  if (!id) return context.next();

  // Test muna tayo ng static para sure na tumatakbo
  const html = `<!doctype html>
<html><head>
  <meta charset="utf-8">
  <title>TEST ARTICLE ${id}</title>
  <meta property="og:title" content="TEST: Ito yung Article ${id}" />
  <meta property="og:description" content="Pag lumitaw to, gumagana na function" />
  <meta property="og:image" content="https://via.placeholder.com/1200x630.png?text=TEST+IMAGE+${id}" />
  <meta property="og:url" content="${url.href}" />
  <meta http-equiv="refresh" content="0;url=/article.html?id=${id}" />
</head><body>Redirecting...</body></html>`;

  return new Response(html, { 
    headers: { "Content-Type": "text/html" },
    status: 200 
  });
}
