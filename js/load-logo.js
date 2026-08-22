import { db } from "./firebase.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

async function loadLogo() {

    try {

        const snap = await getDoc(
            doc(db, "settings", "website")
        );

        if (!snap.exists()) return;

        const data = snap.data();

        if (data.websiteLogo) {

            document
                .querySelectorAll("#siteLogo")
                .forEach(img => {

                    img.src = data.websiteLogo;

                });

        }

    }

    catch (err) {

        console.error(err);

    }

}

loadLogo();