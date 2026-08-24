import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const { default: serviceAccount } =
    await import("./serviceAccountKey.json", {
        with: { type: "json" }
    });

initializeApp({
    credential: cert(serviceAccount)
});

export const adminAuth = getAuth();
export const adminDb = getFirestore();