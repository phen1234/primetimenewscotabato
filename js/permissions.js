import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

onAuthStateChanged(auth, async (user) => {

    if (!user) {

        location.href = "login.html";
        return;

    }

    // Basahin ang user document
    const snap = await getDoc(doc(db, "users", user.uid));

    console.log("Logged User UID:", user.uid);
    console.log("Document Exists:", snap.exists());

    if (!snap.exists()) {

        alert("Account not found in Firestore.");
        location.href = "login.html";
        return;

    }

    const account = snap.data();

    console.log("Firestore Data:", account);

    const role = account.role;

    // Super Admin or Admin
    const adminRoles = ["Super Admin", "Admin"];

if (adminRoles.includes(role)) {
    return;
}

    // Editor
    if (role === "Editor") {

        hide([
            "accountsCard",
            "usersCard",
            "settingsBtn"
        ]);

        return;

    }

    // Reporter
    if (role === "Reporter") {

        hide([
            "accountsCard",
            "usersCard",
            "settingsBtn",
            "categorySidebarBtn"
        ]);

        return;

    }

    // User
if (role === "User") {

    alert(
        "Your account is waiting for administrator approval.\n\nPlease contact the Super Admin."
    );

    location.href = "login.html";
    return;

}

// Unknown role
alert("Invalid account role.");

location.href = "login.html";

});

function hide(ids){

    ids.forEach(id=>{

        const el = document.getElementById(id);

        if(el){

            el.style.display = "none";

        }

    });

}