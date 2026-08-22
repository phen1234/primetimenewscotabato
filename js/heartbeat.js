import { auth, db } from "./firebase.js";

import {
    doc,
    updateDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

setInterval(async () => {

    if (auth.currentUser) {

        try {

            await updateDoc(
                doc(db, "users", auth.currentUser.uid),
                {
                    status: "Active",
                    lastSeen: serverTimestamp()
                }
            );

        } catch (e) {
            console.log(e);
        }

    }

}, 20000);