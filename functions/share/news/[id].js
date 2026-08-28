export async function onRequest(context) {

    const { request, env, params } = context;

    try {

        const newsId = String(params.id || "").trim();

        if (!newsId) {
            return new Response("Invalid news ID.", {
                status: 400
            });
        }

        /*
        ==========================================
        FIREBASE CONFIGURATION
        ==========================================
        These must be added as Cloudflare secrets.
        ==========================================
        */

        const projectId = env.FIREBASE_PROJECT_ID;
        const clientEmail = env.FIREBASE_CLIENT_EMAIL;
        const privateKey = env.FIREBASE_PRIVATE_KEY;

        if (!projectId || !clientEmail || !privateKey) {

            console.error(
                "Firebase Admin environment variables are missing."
            );

            return new Response(
                "Firebase configuration is missing.",
                { status: 500 }
            );
        }

        /*
        ==========================================
        FIREBASE ACCESS TOKEN
        ==========================================
        */

        const accessToken =
            await createFirebaseAccessToken(
                projectId,
                clientEmail,
                privateKey
            );

        /*
        ==========================================
        GET NEWS FROM FIRESTORE
        ==========================================
        */

        const firestoreUrl =
            `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/news/${encodeURIComponent(newsId)}`;

        const firebaseResponse =
            await fetch(firestoreUrl, {

                headers: {
                    Authorization:
                        `Bearer ${accessToken}`
                }

            });

        if (!firebaseResponse.ok) {

            console.error(
                "Firestore error:",
                await firebaseResponse.text()
            );

            return new Response(
                "News article not found.",
                { status: 404 }
            );
        }

        const firestoreData =
            await firebaseResponse.json();

        /*
        ==========================================
        FIRESTORE DATA
        ==========================================
        */

        const fields =
            firestoreData.fields || {};

        const headline =
            getFirestoreValue(fields.headline) ||
            "Primetime News Cotabato";

        const summary =
            getFirestoreValue(fields.summary) ||
            "Read the latest news from Primetime News Cotabato.";

        const featuredImage =
            getFirestoreValue(fields.featuredImage) ||
            "";

        /*
        ==========================================
        ACTUAL WEBSITE URL
        ==========================================
        */

        const url =
            new URL(
                `/article.html?id=${encodeURIComponent(newsId)}`,
                request.url
            ).toString();

        /*
        ==========================================
        OPEN GRAPH
        ==========================================
        */

        const html = `<!DOCTYPE html>

<html lang="en">

<head>

<meta charset="UTF-8">

<meta name="viewport"
      content="width=device-width, initial-scale=1.0">

<title>${escapeHtml(headline)} | Primetime News Cotabato</title>

<meta name="description"
      content="${escapeHtml(summary)}">

<meta property="og:type"
      content="article">

<meta property="og:site_name"
      content="Primetime News Cotabato">

<meta property="og:title"
      content="${escapeHtml(headline)}">

<meta property="og:description"
      content="${escapeHtml(summary)}">

<meta property="og:url"
      content="${escapeHtml(url)}">

${
    featuredImage
        ? `
<meta property="og:image"
      content="${escapeHtml(featuredImage)}">

<meta property="og:image:secure_url"
      content="${escapeHtml(featuredImage)}">

<meta property="og:image:alt"
      content="${escapeHtml(headline)}">

<meta property="og:image:type"
      content="image/jpeg">

<meta name="twitter:card"
      content="summary_large_image">

<meta name="twitter:title"
      content="${escapeHtml(headline)}">

<meta name="twitter:description"
      content="${escapeHtml(summary)}">

<meta name="twitter:image"
      content="${escapeHtml(featuredImage)}">
`
        : ""
}

</head>

<body>

<p>Opening Primetime News Cotabato...</p>

<script>

window.location.replace(
    ${JSON.stringify(url)}
);

</script>

<noscript>

<a href="${escapeHtml(url)}">
    Continue to the news article
</a>

</noscript>

</body>

</html>`;

        return new Response(html, {

            status: 200,

            headers: {

                "Content-Type":
                    "text/html; charset=UTF-8",

                "Cache-Control":
                    "public, max-age=300"

            }

        });

    }

    catch (error) {

        console.error(
            "Cloudflare Facebook Preview Error:",
            error
        );

        return new Response(
            "Unable to generate news preview.",
            {
                status: 500
            }
        );

    }

}


/* ==========================================
   FIRESTORE VALUE HELPER
   ========================================== */

function getFirestoreValue(field) {

    if (!field) return "";

    if (field.stringValue !== undefined) {
        return field.stringValue;
    }

    if (field.integerValue !== undefined) {
        return field.integerValue;
    }

    if (field.doubleValue !== undefined) {
        return field.doubleValue;
    }

    if (field.booleanValue !== undefined) {
        return field.booleanValue;
    }

    return "";

}


/* ==========================================
   HTML ESCAPE
   ========================================== */

function escapeHtml(value = "") {

    return String(value)

        .replace(/&/g, "&amp;")

        .replace(/</g, "&lt;")

        .replace(/>/g, "&gt;")

        .replace(/"/g, "&quot;")

        .replace(/'/g, "&#039;");

}


/* ==========================================
   FIREBASE ACCESS TOKEN
   ========================================== */

async function createFirebaseAccessToken(
    projectId,
    clientEmail,
    privateKey
) {

    const now =
        Math.floor(Date.now() / 1000);

    const header = {
        alg: "RS256",
        typ: "JWT"
    };

    const payload = {

        iss: clientEmail,

        scope:
            "https://www.googleapis.com/auth/datastore",

        aud:
            "https://oauth2.googleapis.com/token",

        iat: now,

        exp: now + 3600

    };

    const encodedHeader =
        base64UrlEncode(
            JSON.stringify(header)
        );

    const encodedPayload =
        base64UrlEncode(
            JSON.stringify(payload)
        );

    const unsignedToken =
        `${encodedHeader}.${encodedPayload}`;

    const normalizedKey =
        privateKey.replace(
            /\\n/g,
            "\n"
        );

    const pemContents =
        normalizedKey
            .replace(
                "-----BEGIN PRIVATE KEY-----",
                ""
            )
            .replace(
                "-----END PRIVATE KEY-----",
                ""
            )
            .replace(
                /\s/g,
                ""
            );

    const binaryKey =
        Uint8Array.from(
            atob(pemContents),
            c => c.charCodeAt(0)
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

            new TextEncoder().encode(
                unsignedToken
            )

        );

    const jwt =
        `${unsignedToken}.${base64UrlEncodeBytes(signature)}`;

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

                        assertion:
                            jwt

                    })

            }
        );

    if (!tokenResponse.ok) {

        throw new Error(
            "Unable to authenticate with Firebase."
        );

    }

    const tokenData =
        await tokenResponse.json();

    return tokenData.access_token;

}


/* ==========================================
   BASE64 URL HELPERS
   ========================================== */

function base64UrlEncode(value) {

    return base64UrlEncodeBytes(
        new TextEncoder().encode(value)
    );

}


function base64UrlEncodeBytes(bytes) {

    let binary = "";

    const chunkSize = 0x8000;

    for (
        let i = 0;
        i < bytes.length;
        i += chunkSize
    ) {

        binary += String.fromCharCode(
            ...bytes.subarray(
                i,
                i + chunkSize
            )
        );

    }

    return btoa(binary)

        .replace(/\+/g, "-")

        .replace(/\//g, "_")

        .replace(/=+$/, "");

}