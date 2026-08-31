export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const id = url.searchParams.get("id");

  if (!id) return context.next();

  // TEST: Ipakita muna natin kung ano yung nabasa na Project ID
  const projectId = env.FIREBASE_PROJECT_ID || "WALANG PROJECT ID NA NABASA";
  
  const html = `<h1>Test</h1><p>Project ID: ${projectId}</p><p>ID: ${id}</p>`;
  return new Response(html, { headers: { "Content-Type": "text/html" } });
}
