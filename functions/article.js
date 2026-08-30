export async function onRequest(context) {
    const { request, env } = context;

    try {
        const requestUrl = new URL(request.url);
        const articleId = requestUrl.searchParams.get("id");

        if (!articleId) {
            return context.next();
        }

        const projectId = env.FIREBASE_PROJECT_ID;
        const clientEmail = env.FIREBASE_CLIENT_EMAIL;
        const privateKey = env.FIREBASE_PRIVATE_KEY;

        if (!projectId || !clientEmail || !privateKey) {
            return new Response(
                "Firebase configuration is missing.",
                { status: 500 }
            );
        }

        const accessToken =
            await createFirebaseAccessToken(
                clientEmail,
                privateKey
            );

        const firestoreUrl =
            `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents/news/${encodeURIComponent(articleId)}`;

        const firebaseResponse = await fetch(firestoreUrl, {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        });

        if (!firebaseResponse.ok) {
            return context.next();
        }

        const firestoreData =
            await firebaseResponse.json();

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

        // Kunin muna ang normal static article response
        const response = await context.next();

        if (!response.ok) {
            return response;
        }

        let html = await response.text();

        const articleUrl =
            requestUrl.toString();

        const ogTags = `
<meta property="og:type" content="article">
<meta property="og:site_name" content="Primetime News Cotabato">
<meta property="og:title" content="${escapeHtml(headline)}">
<meta property="og:description" content="${escapeHtml(summary)}">
<meta property="og:url" content="${escapeHtml(articleUrl)}">

${featuredImage ? `
<meta property="og:image" content="${escapeHtml(featuredImage)}">
<meta property="og:image:secure_url" content="${escapeHtml(featuredImage)}">
<meta property="og:image:alt" content="${escapeHtml(headline)}">

<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escapeHtml(headline)}">
<meta name="twitter:description" content="${escapeHtml(summary)}">
<meta name="twitter:image" content="${escapeHtml(featuredImage)}">
` : ""}

<meta name="description" content="${escapeHtml(summary)}">
`;

        html = html.replace(
            /<title>[\s\S]*?<\/title>/i,
            `<title>${escapeHtml(headline)} | Primetime News Cotabato</title>`
        );

        html = html.replace(
            /<\/head>/i,
            `${ogTags}</head>`
        );

        return new Response(html, {
            status: 200,
            headers: {
                "Content-Type":
                    "text/html; charset=UTF-8",
                "Cache-Control":
                    "public, max-age=300"
            }
        });

    } catch (error) {
        console.error(
            "Cloudflare Article Function Error:",
            error
        );

        return context.next();
    }
}

function getFirestoreValue(field) {
    if (!field) return "";

    if (field.stringValue !== undefined)
        return field.stringValue;

    if (field.integerValue !== undefined)
        return field.integerValue;

    if (field.doubleValue !== undefined)
        return field.doubleValue;

    if (field.booleanValue !== undefined)
        return field.booleanValue;

    return "";
}

function escapeHtml(value = "") {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

async function createFirebaseAccessToken(
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

    const unsignedToken =
        `${base64UrlEncode(JSON.stringify(header))}.${base64UrlEncode(JSON.stringify(payload))}`;

    const normalizedKey =
        privateKey.replace(/\\n/g, "\n");

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
            .replace(/\s/g, "");

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
                name:
                    "RSASSA-PKCS1-v1_5",
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
                        assertion: jwt
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

function base64UrlEncode(value) {
    return base64UrlEncodeBytes(
        new TextEncoder().encode(value)
    );
}

function base64UrlEncodeBytes(bytes) {
    let binary = "";

    for (
        let i = 0;
        i < bytes.length;
        i += 0x8000
    ) {
        binary += String.fromCharCode(
            ...bytes.subarray(
                i,
                i + 0x8000
            )
        );
    }

    return btoa(binary)
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
}
