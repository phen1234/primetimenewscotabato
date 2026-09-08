import { initializeApp, cert, getApps } from 'https://esm.sh/firebase-admin@11.11.0/app';
import { getAuth } from 'https://esm.sh/firebase-admin@11.11.0/auth';
import { getFirestore } from 'https://esm.sh/firebase-admin@11.11.0/firestore';

export async function onRequestDelete(context) {
  const url = new URL(context.request.url);
  const uid = url.pathname.split('/').pop();
  
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };

  try {
    if (!getApps().length) {
      const serviceAccount = JSON.parse(context.env.FIREBASE_SERVICE_ACCOUNT);
      initializeApp({ credential: cert(serviceAccount) });
    }

    await getAuth().deleteUser(uid);
    await getFirestore().collection("users").doc(uid).delete();

    return new Response(JSON.stringify({ success: true, message: "User deleted" }), { headers });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
}
