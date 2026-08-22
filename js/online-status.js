import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";

import {
    doc,
    updateDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

let timer = null;

onAuthStateChanged(auth, (user) => {

    if (!user) return;

    async function heartbeat() {

        try {

            await updateDoc(doc(db, "users", user.uid), {
                status: "Active",
                lastSeen: serverTimestamp()
            });

        } catch (e) {
            console.log(e);
        }

    }

    heartbeat();

    timer = setInterval(heartbeat, 20000);

});