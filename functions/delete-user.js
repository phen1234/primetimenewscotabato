export async function onRequestDelete(context) {
  const url = new URL(context.request.url);
  const uid = url.pathname.split('/').pop(); // kukunin yung last part
  
  // delete logic here
  return new Response(JSON.stringify({success: true}));
}
