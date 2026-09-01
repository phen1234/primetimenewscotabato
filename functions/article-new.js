export async function onRequest(context) {
    const { request, env } = context;

    try {
        // ==========================================
        // GET ARTICLE ID
        // ==========================================
        const requestUrl = new URL(request.url);
        const articleId = requestUrl.searchParams.get("id");

        // ==========================================
        // NO ARTICLE ID
        // SERVE NORMAL ARTICLE PAGE
        // ==========================================
        if (!articleId) {
            return context.next();
        }

        // ==========================================
        // FIREBASE CONFIG
        // ==========================================
        const projectId = env.FIREBASE_PROJECT_ID;
        const clientEmail = env.FIREBASE_CLIENT_EMAIL;
        const privateKey = env.FIREBASE_PRIVATE_KEY;

        if (!projectId || !clientEmail || !privateKey) {
            console.error("Firebase configuration is missing.");
            return context.next();
        }

        // ==========================================
        // CREATE FIREBASE ACCESS TOKEN
        // ==========================================
        const accessToken = await createFirebaseAccessToken(
            clientEmail,
            privateKey
        );

        // ==========================================
        // GET ARTICLE FROM FIRESTORE
        // ==========================================
        const firestoreUrl =
            `https://firestore.googleapis.com/v1/projects/` +
            `${encodeURIComponent(projectId)}` +
            `/databases/(default)/documents/news/` +
            `${encodeURIComponent(articleId)}`;

        const firebaseResponse = await fetch(firestoreUrl, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        });

        // ==========================================
        // FIRESTORE ERROR
        // ==========================================
        if (!firebaseResponse.ok) {
            const errorText = await firebaseResponse.text();

            console.error(
                "Firestore request failed:",
                firebaseResponse.status,
                errorText
            );

            return context.next();
        }

        const firestoreData = await firebaseResponse.json();

        // ==========================================
        // FIRESTORE FIELDS
        // ==========================================
        const fields = firestoreData.fields || {};

        const headline =
            getFirestoreValue(fields.headline) ||
            "Primetime News Cotabato";

        const summary =
            getFirestoreValue(fields.summary) ||
            "Read the latest news from Primetime News Cotabato.";

        let featuredImage =
            getFirestoreValue(fields.featuredImage) || "";

        // ==========================================
        // CONVERT IMAGE TO ABSOLUTE URL
        // ==========================================
        if (featuredImage) {
            try {
                featuredImage = new URL(
                    featuredImage,
                    requestUrl.origin
                ).toString();
            } catch (error) {
                console.error(
                    "Invalid featured image URL:",
                    featuredImage
                );

                featuredImage = "";
            }
        }

        // ==========================================
        // GET NORMAL ARTICLE.HTML
        // ==========================================
        const response = await context.next();

        if (!response) {
            return new Response(
                "Article page could not be loaded.",
                {
                    status: 500,
                    headers: {
                        "Content-Type": "text/plain; charset=UTF-8"
                    }
                }
            );
        }

        if (!response.ok) {
            return response;
        }

        // ==========================================
        // READ HTML
        // ==========================================
        let html = await response.text();

        // ==========================================
        // ARTICLE URL
        // ==========================================
        const articleUrl = requestUrl.toString();

        // ==========================================
        // ESCAPE VALUES
        // ==========================================
        const safeTitle = escapeHtml(headline);
        const safeDescription = escapeHtml(summary);
        const safeUrl = escapeHtml(articleUrl);
        const safeImage = escapeHtml(featuredImage);

        // ==========================================
        // OPEN GRAPH TAGS
        // ==========================================
        const ogTags = `
<meta property="og:url" content="${safeUrl}">
<meta property="og:type" content="article">
<meta property="og:title" content="${safeTitle}">
<meta property="og:description" content="${safeDescription}">
<meta property="og:site_name" content="Primetime News Cotabato">
${featuredImage ? `
<meta property="og:image" content="${safeImage}">
<meta property="og:image:secure_url" content="${safeImage}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${safeTitle}">
` : ""}
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${safeTitle}">
<meta name="twitter:description" content="${safeDescription}">
${featuredImage ? `
<meta name="twitter:image" content="${safeImage}">
` : ""}
`;

        // ==========================================
        // CHANGE HTML TITLE
        // ==========================================
        html = html.replace(
            /<title>[\s\S]*?<\/title>/i,
            `<title>${safeTitle} | Primetime News Cotabato</title>`
        );

        // ==========================================
        // INSERT OG TAGS BEFORE </head>
        // ==========================================
        if (/<\/head>/i.test(html)) {
            html = html.replace(
                /<\/head>/i,
                `${ogTags}\n</head>`
            );
        } else {
            console.error("Could not find </head> in article.html");
        }

        // ==========================================
        // RETURN MODIFIED HTML
        // ==========================================
        const headers = new Headers(response.headers);

        headers.set(
            "Content-Type",
            "text/html; charset=UTF-8"
        );

        // Temporary cache while testing
        headers.set(
            "Cache-Control",
            "no-cache, no-store, must-revalidate"
        );

        return new Response(html, {
            status: response.status,
            headers
        });

    } catch (error) {
        console.error(
            "Cloudflare Article Function Error:",
            error
        );

        // ==========================================
        // FALLBACK
        // ==========================================
        try {
            return await context.next();
        } catch (fallbackError) {
            console.error(
                "Article fallback error:",
                fallbackError
            );

            return new Response(
                "Unable to load article.",
                {
                    status: 500,
                    headers: {
                        "Content-Type":
                            "text/plain; charset=UTF-8"
                    }
                }
            );
        }
    }
}


// ==================================================
// FIRESTORE VALUE
// ==================================================

function getFirestoreValue(field) {
    if (!field) {
        return "";
    }

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

    if (field.timestampValue !== undefined) {
        return field.timestampValue;
    }

    return "";
}


// ==================================================
// ESCAPE HTML
// ==================================================

function escapeHtml(value = "") {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


// ==================================================
// FIREBASE ACCESS TOKEN
// ==================================================

async function createFirebaseAccessToken(
    clientEmail,
    privateKey
) {
    const now = Math.floor(Date.now() / 1000);

    const header = {
        alg: "RS256",
        typ: "JWT"
    };

    const payload = {
        iss: clientEmail,
        scope: "https://www.googleapis.com/auth/datastore",
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

    // ==========================================
    // NORMALIZE PRIVATE KEY
    // ==========================================
    const normalizedPrivateKey =
        privateKey.replace(/\\n/g, "\n");

    const pemContents =
        normalizedPrivateKey
            .replace(
                "-----BEGIN PRIVATE KEY-----",
                ""
            )
            .replace(
                "-----END PRIVATE KEY-----",
                ""
            )
            .replace(/\s/g, "");

    const binaryKey = Uint8Array.from(
        atob(pemContents),
        character => character.charCodeAt(0)
    );

    // ==========================================
    // IMPORT PRIVATE KEY
    // ==========================================
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

    // ==========================================
    // SIGN JWT
    // ==========================================
    const signature =
        await crypto.subtle.sign(
            "RSASSA-PKCS1-v1_5",
            cryptoKey,
            new TextEncoder().encode(unsignedToken)
        );

    const jwt =
        `${unsignedToken}.${base64UrlEncodeBytes(signature)}`;

    // ==========================================
    // GET GOOGLE ACCESS TOKEN
    // ==========================================
    const tokenResponse = await fetch(
        "https://oauth2.googleapis.com/token",
        {
            method: "POST",
            headers: {
                "Content-Type":
                    "application/x-www-form-urlencoded"
            },
            body: new URLSearchParams({
                grant_type:
                    "urn:ietf:params:oauth:grant-type:jwt-bearer",
                assertion: jwt
            })
        }
    );

    if (!tokenResponse.ok) {
        const errorText =
            await tokenResponse.text();

        console.error(
            "Firebase token error:",
            errorText
        );

        throw new Error(
            "Unable to authenticate with Firebase."
        );
    }

    const tokenData =
        await tokenResponse.json();

    return tokenData.access_token;
}


// ==================================================
// BASE64 URL ENCODE
// ==================================================

function base64UrlEncode(value) {
    return base64UrlEncodeBytes(
        new TextEncoder().encode(value)
    );
}


// ==================================================
// BASE64 URL ENCODE BYTES
// ==================================================

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
