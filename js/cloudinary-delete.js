import { auth } from "./firebase.js";

// Local default. When the server is deployed, set window.PRIMETIME_SERVER_URL
// before this module runs, or replace the value below with the deployed API URL.
const API_BASE_URL =
    window.PRIMETIME_SERVER_URL ||
    "https://primetimenewscotabato-1.onrender.com";

export async function deleteCloudinaryAssets(publicIds = []) {

    const ids = [...new Set((publicIds || []).filter(Boolean))];

    if (!ids.length) {
        return { success: true, deleted: 0 };
    }

    const user = auth.currentUser;

    if (!user) {
        throw new Error("You must be logged in to delete images.");
    }

    const token = await user.getIdToken();

    const response = await fetch(`${API_BASE_URL}/delete-cloudinary-assets`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ publicIds: ids })
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok || !data.success) {
        throw new Error(data.error || "Cloudinary image deletion failed.");
    }

    return data;
}


export function extractCloudinaryPublicId(url = "") {

    if (!url || typeof url !== "string" || !url.includes("res.cloudinary.com")) {
        return "";
    }

    try {
        const parsed = new URL(url);
        const marker = "/image/upload/";
        const index = parsed.pathname.indexOf(marker);

        if (index < 0) return "";

        let path = parsed.pathname.slice(index + marker.length);
        const parts = path.split("/").filter(Boolean);

        // Remove delivery transformations, if present. Cloudinary may use
        // comma-separated transformation flags such as c_fill,w_1200,q_auto.
        while (parts.length && /^(?:w_|h_|c_|f_|q_|ar_|g_|dpr_|fl_|e_|t_|so_|du_|pg_|vc_|q_auto|f_auto)/i.test(parts[0])) {
            parts.shift();
        }

        // Remove the version segment.
        if (parts.length && /^v\d+$/.test(parts[0])) {
            parts.shift();
        }

        if (!parts.length) return "";

        const last = parts.pop();
        const withoutExtension = last.replace(/\.[^.]+$/, "");

        return [...parts, withoutExtension].join("/");

    } catch (_) {
        return "";
    }
}
