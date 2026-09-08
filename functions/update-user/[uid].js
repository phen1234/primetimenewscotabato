// ============================================================
// PRIMETIME NEWS COTABATO
// CLOUDFLARE PAGES FUNCTION
// UPDATE USER
//
// Route:
// PUT /update-user/:uid
//
// Example:
// /update-user/JcIqHtsCnegaonSUbajN9z02ZBB2
//
// Uses:
// - Cloudflare Pages Functions
// - Firebase Service Account
// - Google OAuth 2.0
// - Firebase Identity Platform REST API
// - Firestore REST API
//
// Required Cloudflare Secret:
// FIREBASE_SERVICE_ACCOUNT
// ============================================================


// ============================================================
// CORS
// ============================================================

function corsHeaders() {
    return {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "PUT, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Content-Type": "application/json; charset=UTF-8"
    };
}


// ============================================================
// JSON RESPONSE
// ============================================================

function jsonResponse(data, status = 200) {
    return new Response(
        JSON.stringify(data),
        {
            status,
            headers: corsHeaders()
        }
    );
}


// ============================================================
// BASE64URL
// ============================================================

function base64UrlEncode(data) {

    let bytes;

    if (typeof data === "string") {
        bytes = new TextEncoder().encode(data);
    } else {
        bytes = new Uint8Array(data);
    }

    let binary = "";

    for (const byte of bytes) {
        binary += String.fromCharCode(byte);
    }

    return btoa(binary)
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/g, "");
}


// ============================================================
// IMPORT SERVICE ACCOUNT
// ============================================================

function getServiceAccount(env) {

    if (!env.FIREBASE_SERVICE_ACCOUNT) {
        throw new Error(
            "FIREBASE_SERVICE_ACCOUNT is not configured in Cloudflare."
        );
    }

    let serviceAccount;

    try {

        serviceAccount =
            typeof env.FIREBASE_SERVICE_ACCOUNT === "string"
                ? JSON.parse(env.FIREBASE_SERVICE_ACCOUNT)
                : env.FIREBASE_SERVICE_ACCOUNT;

    } catch (error) {

        throw new Error(
            "FIREBASE_SERVICE_ACCOUNT contains invalid JSON."
        );
    }

    if (
        !serviceAccount.client_email ||
        !serviceAccount.private_key ||
        !serviceAccount.project_id
    ) {
        throw new Error(
            "FIREBASE_SERVICE_ACCOUNT is missing client_email, private_key, or project_id."
        );
    }

    return serviceAccount;
}


// ============================================================
// CREATE GOOGLE ACCESS TOKEN
// ============================================================

async function createGoogleAccessToken(serviceAccount) {

    const now = Math.floor(Date.now() / 1000);

    const header = {
        alg: "RS256",
        typ: "JWT"
    };

    const payload = {
        iss: serviceAccount.client_email,
        scope: [
            "https://www.googleapis.com/auth/identitytoolkit",
            "https://www.googleapis.com/auth/datastore"
        ].join(" "),
        aud: "https://oauth2.googleapis.com/token",
        iat: now,
        exp: now + 3600
    };

    const encodedHeader =
        base64UrlEncode(JSON.stringify(header));

    const encodedPayload =
        base64UrlEncode(JSON.stringify(payload));

    const unsignedToken =
        `${encodedHeader}.${encodedPayload}`;

    const privateKeyPem =
        serviceAccount.private_key;

    const pemContents =
        privateKeyPem
            .replace("-----BEGIN PRIVATE KEY-----", "")
            .replace("-----END PRIVATE KEY-----", "")
            .replace(/\s/g, "");

    const binaryKey =
        Uint8Array.from(
            atob(pemContents),
            char => char.charCodeAt(0)
        );

    const cryptoKey =
        await crypto.subtle.importKey(
            "pkcs8",
            binaryKey.buffer,
            {
                name: "RSASSA-PKCS1-v1_5",
                hash: "SHA-256"
            },
            false,
            ["sign"]
        );

    const signature =
        await crypto.subtle.sign(
            "RSASSA-PKCS1-v1_5",
            cryptoKey,
            new TextEncoder().encode(unsignedToken)
        );

    const jwt =
        `${unsignedToken}.${base64UrlEncode(signature)}`;

    const tokenResponse =
        await fetch(
            "https://oauth2.googleapis.com/token",
            {
                method: "POST",
                headers: {
                    "Content-Type":
                        "application/x-www-form-urlencoded"
                },
                body:
                    new URLSearchParams({
                        grant_type:
                            "urn:ietf:params:oauth:grant-type:jwt-bearer",
                        assertion: jwt
                    })
            }
        );

    const tokenText =
        await tokenResponse.text();

    if (!tokenResponse.ok) {

        throw new Error(
            `Google OAuth token error: ${tokenText}`
        );
    }

    let tokenData;

    try {
        tokenData =
            JSON.parse(tokenText);
    } catch {
        throw new Error(
            "Google OAuth returned invalid JSON."
        );
    }

    if (!tokenData.access_token) {

        throw new Error(
            "Google OAuth did not return an access token."
        );
    }

    return tokenData.access_token;
}


// ============================================================
// FIRESTORE VALUE HELPERS
// ============================================================

function firestoreString(value) {

    return {
        stringValue: String(value ?? "")
    };
}


function firestoreTimestamp(date = new Date()) {

    return {
        timestampValue: date.toISOString()
    };
}


// ============================================================
// UPDATE FIREBASE AUTH USER
// ============================================================

async function updateFirebaseAuthUser({
    projectId,
    accessToken,
    uid,
    name,
    email,
    password,
    photoURL
}) {

    const authUrl =
        `https://identitytoolkit.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/accounts:update`;

    const authPayload = {
        localId: uid,
        displayName: name,
        email: email
    };


    // Only change password if supplied.
    if (
        typeof password === "string" &&
        password.trim() !== ""
    ) {
        authPayload.password =
            password.trim();
    }


    // Only update photo when supplied.
    if (
        typeof photoURL === "string" &&
        photoURL.trim() !== ""
    ) {
        authPayload.photoUrl =
            photoURL.trim();
    }


    const response =
        await fetch(
            authUrl,
            {
                method: "POST",
                headers: {
                    "Authorization":
                        `Bearer ${accessToken}`,

                    "Content-Type":
                        "application/json"
                },
                body: JSON.stringify(authPayload)
            }
        );


    const responseText =
        await response.text();


    if (!response.ok) {

        let errorMessage =
            responseText;

        try {

            const errorData =
                JSON.parse(responseText);

            errorMessage =
                errorData?.error?.message ||
                errorMessage;

        } catch {
            // Keep raw response.
        }

        throw new Error(
            `Firebase Authentication update failed: ${errorMessage}`
        );
    }


    try {

        return JSON.parse(responseText);

    } catch {

        return {};
    }
}


// ============================================================
// UPDATE FIRESTORE USER DOCUMENT
// ============================================================

async function updateFirestoreUser({
    projectId,
    accessToken,
    uid,
    name,
    email,
    role,
    photoURL
}) {

    const firestoreUrl =
        `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents/users/${encodeURIComponent(uid)}`;


    // Keep behavior compatible with the old Node server.
    const fields = {

        name:
            firestoreString(name),

        email:
            firestoreString(email),

        role:
            firestoreString(role),

        updatedAt:
            firestoreTimestamp()
    };


    // Only replace photoURL when a new photo was uploaded.
    if (
        typeof photoURL === "string" &&
        photoURL.trim() !== ""
    ) {

        fields.photoURL =
            firestoreString(photoURL);
    }


    const response =
        await fetch(
            firestoreUrl,
            {
                method: "PATCH",

                headers: {
                    "Authorization":
                        `Bearer ${accessToken}`,

                    "Content-Type":
                        "application/json"
                },

                body:
                    JSON.stringify({
                        fields
                    })
            }
        );


    const responseText =
        await response.text();


    if (!response.ok) {

        let errorMessage =
            responseText;

        try {

            const errorData =
                JSON.parse(responseText);

            errorMessage =
                errorData?.error?.message ||
                errorMessage;

        } catch {
            // Keep raw response.
        }


        throw new Error(
            `Firestore update failed: ${errorMessage}`
        );
    }


    try {

        return JSON.parse(responseText);

    } catch {

        return {};
    }
}


// ============================================================
// PUT /update-user/:uid
// ============================================================

export async function onRequestPut(context) {

    try {

        const {
            request,
            env,
            params
        } = context;


        // ----------------------------------------------------
        // GET UID FROM DYNAMIC ROUTE
        // ----------------------------------------------------

        const uid =
            String(params?.uid || "").trim();


        if (!uid) {

            return jsonResponse(
                {
                    success: false,
                    error: "User ID is required."
                },
                400
            );
        }


        // ----------------------------------------------------
        // READ BODY
        // ----------------------------------------------------

        let body;

        try {

            body =
                await request.json();

        } catch {

            return jsonResponse(
                {
                    success: false,
                    error: "Invalid JSON request body."
                },
                400
            );
        }


        const name =
            String(body?.name || "").trim();

        const email =
            String(body?.email || "").trim();

        const role =
            String(body?.role || "").trim();

        const password =
            typeof body?.password === "string"
                ? body.password
                : "";

        const photoURL =
            typeof body?.photoURL === "string"
                ? body.photoURL.trim()
                : "";


        // ----------------------------------------------------
        // BASIC VALIDATION
        // ----------------------------------------------------

        if (!name) {

            return jsonResponse(
                {
                    success: false,
                    error: "Name is required."
                },
                400
            );
        }


        if (!email) {

            return jsonResponse(
                {
                    success: false,
                    error: "Email is required."
                },
                400
            );
        }


        if (!role) {

            return jsonResponse(
                {
                    success: false,
                    error: "Role is required."
                },
                400
            );
        }


        // ----------------------------------------------------
        // SERVICE ACCOUNT
        // ----------------------------------------------------

        const serviceAccount =
            getServiceAccount(env);


        const projectId =
            serviceAccount.project_id;


        // ----------------------------------------------------
        // GOOGLE ACCESS TOKEN
        // ----------------------------------------------------

        const accessToken =
            await createGoogleAccessToken(
                serviceAccount
            );


        // ----------------------------------------------------
        // UPDATE FIREBASE AUTH
        // ----------------------------------------------------

        await updateFirebaseAuthUser({

            projectId,

            accessToken,

            uid,

            name,

            email,

            password,

            photoURL
        });


        // ----------------------------------------------------
        // UPDATE FIRESTORE
        // ----------------------------------------------------

        await updateFirestoreUser({

            projectId,

            accessToken,

            uid,

            name,

            email,

            role,

            photoURL
        });


        // ----------------------------------------------------
        // SUCCESS
        // ----------------------------------------------------

        return jsonResponse(
            {
                success: true,

                uid,

                message:
                    "User updated successfully."
            },
            200
        );


    } catch (error) {

        console.error(
            "UPDATE USER ERROR:",
            error
        );


        return jsonResponse(
            {
                success: false,

                error:
                    error?.message ||
                    "Unable to update user."
            },
            500
        );
    }
}


// ============================================================
// OPTIONS
// ============================================================

export function onRequestOptions() {

    return new Response(
        null,
        {
            status: 204,
            headers: corsHeaders()
        }
    );
}
