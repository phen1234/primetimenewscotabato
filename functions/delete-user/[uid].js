const FIREBASE_AUTH_DELETE_URL =
  "https://identitytoolkit.googleapis.com/v1/projects";

const FIRESTORE_URL =
  "https://firestore.googleapis.com/v1/projects";


// ======================================================
// CREATE FIREBASE ACCESS TOKEN USING SERVICE ACCOUNT
// ======================================================

async function createAccessToken(serviceAccount) {
  const now = Math.floor(Date.now() / 1000);

  const header = {
    alg: "RS256",
    typ: "JWT"
  };

  const payload = {
    iss: serviceAccount.client_email,
    scope: "https://www.googleapis.com/auth/cloud-platform",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600
  };

  const base64url = (obj) =>
    btoa(JSON.stringify(obj))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

  const unsignedToken =
    `${base64url(header)}.${base64url(payload)}`;

  const privateKeyPem = serviceAccount.private_key;

  const privateKey = await importPrivateKey(privateKeyPem);

  const signature = await crypto.subtle.sign(
    {
      name: "RSASSA-PKCS1-v1_5"
    },
    privateKey,
    new TextEncoder().encode(unsignedToken)
  );

  const signatureBase64 = arrayBufferToBase64Url(signature);

  const jwt =
    `${unsignedToken}.${signatureBase64}`;

  const tokenResponse = await fetch(
    "https://oauth2.googleapis.com/token",
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/x-www-form-urlencoded"
      },
      body:
        `grant_type=${encodeURIComponent(
          "urn:ietf:params:oauth:grant-type:jwt-bearer"
        )}&assertion=${encodeURIComponent(jwt)}`
    }
  );

  const tokenData = await tokenResponse.json();

  if (!tokenResponse.ok || !tokenData.access_token) {
    throw new Error(
      tokenData.error_description ||
      tokenData.error ||
      "Failed to create Firebase access token."
    );
  }

  return tokenData.access_token;
}


// ======================================================
// IMPORT PRIVATE KEY
// ======================================================

async function importPrivateKey(pem) {
  const pemContents = pem
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\s/g, "");

  const binaryString = atob(pemContents);

  const bytes = new Uint8Array(binaryString.length);

  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  return crypto.subtle.importKey(
    "pkcs8",
    bytes.buffer,
    {
      name: "RSASSA-PKCS1-v1_5",
      hash: "SHA-256"
    },
    false,
    ["sign"]
  );
}


// ======================================================
// ARRAY BUFFER → BASE64URL
// ======================================================

function arrayBufferToBase64Url(buffer) {
  const bytes = new Uint8Array(buffer);

  let binary = "";

  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }

  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}


// ======================================================
// DELETE FIREBASE AUTH USER
// ======================================================

async function deleteFirebaseAuthUser(
  projectId,
  uid,
  accessToken
) {
  const response = await fetch(
    `${FIREBASE_AUTH_DELETE_URL}/${encodeURIComponent(projectId)}/accounts:delete`,
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        localId: uid
      })
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error?.message ||
      "Failed to delete Firebase Authentication account."
    );
  }

  return data;
}


// ======================================================
// DELETE FIRESTORE USER DOCUMENT
// ======================================================

async function deleteFirestoreUser(
  projectId,
  uid,
  accessToken
) {
  const response = await fetch(
    `${FIRESTORE_URL}/${encodeURIComponent(projectId)}/databases/(default)/documents/users/${encodeURIComponent(uid)}`,
    {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${accessToken}`
      }
    }
  );

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));

    throw new Error(
      data.error?.message ||
      "Failed to delete Firestore user document."
    );
  }

  return true;
}


// ======================================================
// DELETE USER
// ======================================================

export async function onRequestDelete(context) {

  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json"
  };

  try {

    // ------------------------------------------
    // GET UID
    // ------------------------------------------

    const url = new URL(context.request.url);

    const uid = url.pathname
      .split("/")
      .filter(Boolean)
      .pop();

    if (!uid) {
      return new Response(
        JSON.stringify({
          error: "User ID is required."
        }),
        {
          status: 400,
          headers
        }
      );
    }


    // ------------------------------------------
    // GET SERVICE ACCOUNT
    // ------------------------------------------

    const serviceAccountRaw =
      context.env.FIREBASE_SERVICE_ACCOUNT;

    if (!serviceAccountRaw) {
      throw new Error(
        "FIREBASE_SERVICE_ACCOUNT is not configured in Cloudflare."
      );
    }

    let serviceAccount;

    try {
      serviceAccount =
        JSON.parse(serviceAccountRaw);
    } catch {
      throw new Error(
        "FIREBASE_SERVICE_ACCOUNT contains invalid JSON."
      );
    }


    // ------------------------------------------
    // GET PROJECT ID
    // ------------------------------------------

    const projectId =
      serviceAccount.project_id;

    if (!projectId) {
      throw new Error(
        "Firebase project_id is missing from service account."
      );
    }


    // ------------------------------------------
    // CREATE ACCESS TOKEN
    // ------------------------------------------

    const accessToken =
      await createAccessToken(serviceAccount);


    // ------------------------------------------
    // DELETE FIREBASE AUTH ACCOUNT
    // ------------------------------------------

    await deleteFirebaseAuthUser(
      projectId,
      uid,
      accessToken
    );


    // ------------------------------------------
    // DELETE FIRESTORE USER DOCUMENT
    // ------------------------------------------

    await deleteFirestoreUser(
      projectId,
      uid,
      accessToken
    );


    // ------------------------------------------
    // SUCCESS
    // ------------------------------------------

    return new Response(
      JSON.stringify({
        success: true,
        message: "User deleted successfully."
      }),
      {
        status: 200,
        headers
      }
    );

  } catch (error) {

    console.error(
      "Delete User Error:",
      error
    );

    return new Response(
      JSON.stringify({
        success: false,
        error:
          error?.message ||
          "Failed to delete user."
      }),
      {
        status: 500,
        headers
      }
    );
  }
}


// ======================================================
// CORS OPTIONS
// ======================================================

export async function onRequestOptions() {

  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods":
        "DELETE, OPTIONS",
      "Access-Control-Allow-Headers":
        "Content-Type"
    }
  });

}