import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

export async function onRequestDelete(context) {
  // Kunin yung UID galing sa URL: /delete-user/ABC123
  const url = new URL(context.request.url);
  const uid = url.pathname.split('/').pop();
  
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };

  try {
    // Init Firebase Admin gamit yung env variable
    if (!getApps().length) {
      const serviceAccount = JSON.parse(context.env.FIREBASE_SERVICE_ACCOUNT);
      initializeApp({ credential: cert(serviceAccount) });
    }

    // 1. Delete sa Firebase Auth
    await getAuth().deleteUser(uid);
    // 2. Delete sa Firestore
    await getFirestore().collection("users").doc(uid).delete();

    return new Response(JSON.stringify({ success: true, message: "User deleted" }), { headers });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });
  }
}

// Para sa CORS preflight
export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
}
