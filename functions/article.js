export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const id = url.searchParams.get("id");

  if (!id) return context.next();

  // WALANG FETCH. REDIRECT LANG AGAD. 
  // Para hindi na mag 1101 kahit kailan
  const redirectUrl = `/article.html?id=${id}`;
  return Response.redirect(redirectUrl, 302);
}
