// ==========================================
// PRIMETIME NEWS COTABATO
// CLOUDFLARE PAGES FUNCTION
// CREATE USER
// ==========================================

// Gumagawa ng Google OAuth access token gamit ang
// Firebase Service Account + Web Crypto API.
// Walang firebase-admin package na kailangan.

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
        .replace(/=+$/, "");
}


// ==========================================
// CREATE GOOGLE ACCESS TOKEN
// ==========================================

async function createAccessToken(serviceAccount) {

    const now = Math.floor(Date.now() / 1000);

    const header = {
        alg: "RS256",
        typ: "JWT"
    };

    const claimSet = {
        iss: serviceAccount.client_email,
        scope: "https://www.googleapis.com/auth/cloud-platform",
        aud: "https://oauth2.googleapis.com/token",
        iat: now,
        exp: now + 3600
    };

    const encodedHeader =
        base64UrlEncode(JSON.stringify(header));

    const encodedClaim =
        base64UrlEncode(JSON.stringify(claimSet));

    const unsignedToken =
        `${encodedHeader}.${encodedClaim}`;

    // ------------------------------------------
    // Convert PEM private key to CryptoKey
    // ------------------------------------------

    const privateKeyPem =
        serviceAccount.private_key
            .replace("-----BEGIN PRIVATE KEY-----", "")
            .replace("-----END PRIVATE KEY-----", "")
            .replace(/\s/g, "");

    const binaryKey = Uint8Array.from(
        atob(privateKeyPem),
        c => c.charCodeAt(0)
    );

    const cryptoKey = await crypto.subtle.importKey(
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

    // ------------------------------------------
    // Exchange JWT for Google access token
    // ------------------------------------------

    const response = await fetch(
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
                )}` +
                `&assertion=${encodeURIComponent(jwt)}`
        }
    );

    const data = await response.json();

    if (!response.ok || !data.access_token) {
        console.error(
            "Google OAuth Error:",
            data
        );

        throw new Error(
            data.error_description ||
            data.error ||
            "Unable to obtain Google access token."
        );
    }

    return data.access_token;
}


// ==========================================
// CREATE FIREBASE AUTH USER
// ==========================================

async function createFirebaseUser(
    accessToken,
    projectId,
    email,
    password,
    displayName
) {

    const url =
        `https://identitytoolkit.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/accounts`;

    const response = await fetch(url, {
        method: "POST",

        headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json"
        },

        body: JSON.stringify({
            email,
            password,
            displayName
        })
    });

    const data = await response.json();

    if (!response.ok) {

        console.error(
            "Firebase Auth Create Error:",
            data
        );

        throw new Error(
            data?.error?.message ||
            "Unable to create Firebase user."
        );
    }

    return data;
}


// ==========================================
// CREATE FIRESTORE USER DOCUMENT
// ==========================================

async function createFirestoreUser(
    accessToken,
    projectId,
    uid,
    userData
) {

    const documentUrl =
        `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents/users/${encodeURIComponent(uid)}`;

    const fields = {};

    fields.name = {
        stringValue: userData.name
    };

    fields.email = {
        stringValue: userData.email
    };

    fields.role = {
        stringValue: userData.role
    };

    fields.status = {
        stringValue: "Active"
    };

    fields.photoURL = {
        stringValue: userData.photoURL || ""
    };

    fields.createdAt = {
        timestampValue: new Date().toISOString()
    };

    const response = await fetch(
        documentUrl,
        {
            method: "PATCH",

            headers: {
                "Authorization":
                    `Bearer ${accessToken}`,

                "Content-Type":
                    "application/json"
            },

            body: JSON.stringify({
                fields
            })
        }
    );

    const data = await response.json();

    if (!response.ok) {

        console.error(
            "Firestore Create Error:",
            data
        );

        throw new Error(
            data?.error?.message ||
            "Unable to create Firestore user document."
        );
    }

    return data;
}


// ==========================================
// POST /create-user
// ==========================================

export async function onRequestPost(context) {

    const headers = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
    };

    try {

        // --------------------------------------
        // CHECK SERVICE ACCOUNT
        // --------------------------------------

        if (!context.env.FIREBASE_SERVICE_ACCOUNT) {

            throw new Error(
                "FIREBASE_SERVICE_ACCOUNT is not configured in Cloudflare."
            );
        }

        // --------------------------------------
        // GET FIREBASE SERVICE ACCOUNT
        // --------------------------------------

        let serviceAccount;

        try {

            serviceAccount =
                JSON.parse(
                    context.env.FIREBASE_SERVICE_ACCOUNT
                );

        } catch (error) {

            throw new Error(
                "FIREBASE_SERVICE_ACCOUNT contains invalid JSON."
            );
        }

        // --------------------------------------
        // FIREBASE PROJECT ID
        // --------------------------------------

        const projectId =
            serviceAccount.project_id;

        if (!projectId) {

            throw new Error(
                "Firebase project_id is missing from service account."
            );
        }

        // --------------------------------------
        // READ REQUEST
        // --------------------------------------

        const body =
            await context.request.json();

        const name =
            String(body.name || "").trim();

        const email =
            String(body.email || "").trim();

        const password =
            String(body.password || "");

        const role =
            String(body.role || "User").trim();

        const photoURL =
            String(body.photoURL || "").trim();


        // --------------------------------------
        // VALIDATION
        // --------------------------------------

        if (!name) {

            return new Response(
                JSON.stringify({
                    success: false,
                    error: "Name is required."
                }),
                {
                    status: 400,
                    headers
                }
            );
        }

        if (!email) {

            return new Response(
                JSON.stringify({
                    success: false,
                    error: "Email is required."
                }),
                {
                    status: 400,
                    headers
                }
            );
        }

        if (!password) {

            return new Response(
                JSON.stringify({
                    success: false,
                    error: "Password is required."
                }),
                {
                    status: 400,
                    headers
                }
            );
        }

        if (password.length < 6) {

            return new Response(
                JSON.stringify({
                    success: false,
                    error:
                        "Password must be at least 6 characters."
                }),
                {
                    status: 400,
                    headers
                }
            );
        }


        // --------------------------------------
        // GOOGLE ACCESS TOKEN
        // --------------------------------------

        const accessToken =
            await createAccessToken(
                serviceAccount
            );


        // --------------------------------------
        // CREATE FIREBASE AUTH USER
        // --------------------------------------

        const userRecord =
            await createFirebaseUser(
                accessToken,
                projectId,
                email,
                password,
                name
            );

        const uid =
            userRecord.localId;


        // --------------------------------------
        // CREATE FIRESTORE USER DOCUMENT
        // --------------------------------------

        await createFirestoreUser(
            accessToken,
            projectId,
            uid,
            {
                name,
                email,
                role,
                photoURL
            }
        );


        // --------------------------------------
        // SUCCESS
        // --------------------------------------

        return new Response(
            JSON.stringify({
                success: true,
                uid,
                message: "User created successfully."
            }),
            {
                status: 200,
                headers
            }
        );

    } catch (error) {

        console.error(
            "CREATE USER ERROR:",
            error
        );

        return new Response(
            JSON.stringify({
                success: false,
                error: error.message ||
                    "Unable to create user."
            }),
            {
                status: 500,
                headers
            }
        );
    }
}


// ==========================================
// OPTIONS / CORS
// ==========================================

export async function onRequestOptions() {

    return new Response(
        null,
        {
            status: 204,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods":
                    "POST, OPTIONS",
                "Access-Control-Allow-Headers":
                    "Content-Type, Authorization"
            }
        }
    );
}