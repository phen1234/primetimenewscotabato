import express from "express";
import cors from "cors";
import "dotenv/config";

import { adminAuth, adminDb } from "./firebase-admin.js";

const app = express();

app.use(cors());
app.use(express.json());


// ==========================
// UPDATE USER
// ==========================

app.put("/update-user/:uid", async (req, res) => {

    const uid = req.params.uid;

    const {
        name,
        email,
        role,
        password,
        photoURL
    } = req.body;

    try {

        const updateAuth = {
            displayName: name,
            email: email
        };

        if (password && password.trim() !== "") {
            updateAuth.password = password;
        }

        await adminAuth.updateUser(uid, updateAuth);

        const updateData = {
            name,
            email,
            role,
            updatedAt: new Date()
        };

        if (photoURL) {
            updateData.photoURL = photoURL;
        }

        await adminDb
            .collection("users")
            .doc(uid)
            .update(updateData);

        res.json({
            success: true
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            success: false,
            error: err.message
        });

    }

});


// ==========================
// DELETE USER
// ==========================

app.delete("/delete-user/:uid", async (req, res) => {

    const uid = req.params.uid;

    try {

        await adminAuth.deleteUser(uid);

        await adminDb
            .collection("users")
            .doc(uid)
            .delete();

        res.json({
            success: true,
            message: "User deleted successfully."
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            success: false,
            error: err.message
        });

    }

});


// ==========================
// CREATE USER
// ==========================

app.post("/create-user", async (req, res) => {

    const {
        name,
        email,
        password,
        role,
        photoURL
    } = req.body;

    try {

        const userRecord = await adminAuth.createUser({
            email,
            password,
            displayName: name
        });

        await adminDb
            .collection("users")
            .doc(userRecord.uid)
            .set({
                name,
                email,
                role,
                status: "Active",
                photoURL: photoURL || "",
                createdAt: new Date()
            });

        res.json({
            success: true,
            uid: userRecord.uid
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            success: false,
            error: err.message
        });

    }

});


// ==========================
// VERIFY ADMIN PASSWORD
// ==========================

const MASTER_ADMIN_PASSWORD = process.env.MASTER_ADMIN_PASSWORD;

app.post("/verify-admin-password", (req, res) => {

    const { password } = req.body;

    if (password === MASTER_ADMIN_PASSWORD) {

        return res.json({
            success: true
        });

    }

    res.json({
        success: false
    });

});


// ==========================
// DELETE CLOUDINARY IMAGES
// ==========================

import crypto from "crypto";

async function verifyFirebaseUser(req) {

    const header = req.headers.authorization || "";

    if (!header.startsWith("Bearer ")) {
        throw new Error("Missing authorization token.");
    }

    const token = header.slice(7);
    return await adminAuth.verifyIdToken(token);
}

function cloudinarySignature(params, apiSecret) {

    const toSign = Object.keys(params)
        .filter(key => params[key] !== undefined && params[key] !== null && params[key] !== "")
        .sort()
        .map(key => `${key}=${params[key]}`)
        .join("&");

    return crypto
        .createHash("sha1")
        .update(toSign + apiSecret)
        .digest("hex");
}

app.post("/delete-cloudinary-assets", async (req, res) => {

    try {

        const decoded = await verifyFirebaseUser(req);

       const userSnap = await adminDb
    .collection("users")
    .doc(decoded.uid)
    .get();

if (!userSnap.exists) {
    return res.status(403).json({
        success: false,
        error: "User account was not found."
    });
}

        const userData = userSnap.data() || {};
        const role = userData.role;

        if (role !== "Admin" && role !== "Super Admin") {
            return res.status(403).json({
                success: false,
                error: "Only Admin or Super Admin can delete Cloudinary images."
            });
        }

        const publicIds = Array.isArray(req.body.publicIds)
            ? [...new Set(req.body.publicIds.filter(Boolean))]
            : [];

        if (!publicIds.length) {
            return res.json({ success: true, deleted: 0 });
        }

        const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
        const apiKey = process.env.CLOUDINARY_API_KEY;
        const apiSecret = process.env.CLOUDINARY_API_SECRET;

        if (!cloudName || !apiKey || !apiSecret) {
            return res.status(500).json({
                success: false,
                error: "Cloudinary server credentials are not configured."
            });
        }

        const timestamp = Math.floor(Date.now() / 1000);
        const results = [];

        for (const publicId of publicIds) {

            const params = {
                invalidate: true,
                public_id: publicId,
                timestamp
            };

            const signature = cloudinarySignature(params, apiSecret);
            const form = new URLSearchParams();

            form.append("public_id", publicId);
            form.append("timestamp", String(timestamp));
            form.append("api_key", apiKey);
            form.append("signature", signature);
            form.append("invalidate", "true");

            const response = await fetch(
                `https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded"
                    },
                    body: form
                }
            );

            const data = await response.json();

            results.push({
                publicId,
                result: data.result || null,
                success: response.ok && ["ok", "not found"].includes(data.result)
            });

            if (!response.ok || !["ok", "not found"].includes(data.result)) {
                console.error("Cloudinary delete failed:", publicId, data);
            }
        }

        const failed = results.filter(item => !item.success);

        if (failed.length) {
            return res.status(502).json({
                success: false,
                error: "One or more Cloudinary images could not be deleted.",
                results
            });
        }

        return res.json({
            success: true,
            deleted: publicIds.length,
            results
        });

    } catch (err) {

        console.error("Cloudinary Delete Error:", err);

        return res.status(401).json({
            success: false,
            error: err.message
        });

    }

});

// ==========================
// FACEBOOK NEWS SHARE PREVIEW
// ==========================
// Facebook's crawler does not reliably execute the page JavaScript,
// so the Open Graph tags must be generated by the server.

function escapeHtml(value = "") {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

app.get("/share/news/:id", async (req, res) => {

    try {

        const newsId = String(req.params.id || "").trim();

        if (!newsId) {
            return res.status(400).send("Invalid news ID.");
        }

        const snap = await adminDb
            .collection("news")
            .doc(newsId)
            .get();

        if (!snap.exists) {
            return res.status(404).send("News article not found.");
        }

        const news = snap.data() || {};

        const headline = news.headline || "Primetime News Cotabato";
        const description =
            news.summary ||
            "Read the latest news from Primetime News Cotabato.";
        const image = news.featuredImage || "";

        // The normal article URL is supplied by the share button.
        // Keep it only as the destination; OG metadata stays on this endpoint.
        const targetUrl = String(req.query.url || "").trim();

        // Allow only normal web URLs as the redirect destination.
        let safeTarget = "";
        try {
            const parsed = new URL(targetUrl);
            if (parsed.protocol === "https:" || parsed.protocol === "http:") {
                safeTarget = parsed.toString();
            }
        } catch (_) {
            safeTarget = "";
        }

        const shareUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;

        res.set("Cache-Control", "public, max-age=300");
        res.type("html");

        const redirectTag = safeTarget
            ? `<meta http-equiv="refresh" content="0;url=${escapeHtml(safeTarget)}">`
            : "";

        res.send(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(headline)} | Primetime News Cotabato</title>
<meta name="description" content="${escapeHtml(description)}">
<meta property="og:type" content="article">
<meta property="og:site_name" content="Primetime News Cotabato">
<meta property="og:title" content="${escapeHtml(headline)}">
<meta property="og:description" content="${escapeHtml(description)}">
<meta property="og:url" content="${escapeHtml(shareUrl)}">
${image ? `<meta property="og:image" content="${escapeHtml(image)}">
<meta property="og:image:secure_url" content="${escapeHtml(image)}">
<meta property="og:image:alt" content="${escapeHtml(headline)}">` : ""}
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escapeHtml(headline)}">
<meta name="twitter:description" content="${escapeHtml(description)}">
${image ? `<meta name="twitter:image" content="${escapeHtml(image)}">` : ""}
${redirectTag}
</head>
<body>
<p>Opening Primetime News Cotabato...</p>
${safeTarget ? `<p><a href="${escapeHtml(safeTarget)}">Continue to the news article</a></p>` : ""}
</body>
</html>`);

    } catch (err) {

        console.error("Facebook Share Preview Error:", err);
        res.status(500).send("Unable to load the news preview.");

    }

});


// ==========================
// SERVER HEALTH CHECK
// ==========================

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "PrimeTime News server is running."
    });
});


// ==========================
// SERVER
// ==========================

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {

    console.log(`✅ Server running on port ${PORT}`);

});
