import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

let credential;

if (process.env.FIREBASE_PROJECT_ID) {

    credential = cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
    });

} else {

    const { default: serviceAccount } =
        await import("./serviceAccountKey.json", {
            with: { type: "json" }
        });

    credential = cert(serviceAccount);
}

initializeApp({
    credential
});

export const adminAuth = getAuth();
export const adminDb = getFirestore();
