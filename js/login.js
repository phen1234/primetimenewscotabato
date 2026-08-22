import { auth, db } from "./firebase.js";

import {
    signOut,
    GoogleAuthProvider,
    signInWithPopup,
    signInWithEmailAndPassword,
    EmailAuthProvider,
    reauthenticateWithCredential
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";

import {
    doc,
    getDoc,
    updateDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

const provider = new GoogleAuthProvider();

document.getElementById("googleLogin").addEventListener("click", async () => {

    try {

       const result = await signInWithPopup(auth, provider);

const user = result.user;

const snap = await getDoc(doc(db, "users", user.uid));

if (!snap.exists()) {

    await signOut(auth);

    alert("This account is not registered.");

    return;

}

const data = snap.data();

if (data.accountStatus === "Disabled") {

    await signOut(auth);

    loginMessage.style.color = "red";
    loginMessage.textContent = "This account has been disabled.";

    return;

}

const allowedRoles = [
    "Super Admin",
    "Admin",
    "Editor",
    "Reporter"
];

if (!allowedRoles.includes(data.role)) {

    await signOut(auth);

    loginMessage.style.color = "red";
    loginMessage.textContent =
        "Your account has no permission to access the CMS.";

    return;

}
await updateDoc(doc(db, "users", user.uid), {

    status: "Active",
    lastSeen: serverTimestamp()

});

Swal.fire({
    title: "Login Successful",
    html: `
        <div style="padding:15px;">
            <div class="spinner"></div>
            <p style="margin-top:15px;font-size:15px;">
                Loading Dashboard...
            </p>
        </div>
    `,
    showConfirmButton: false,
    allowOutsideClick: false,
    allowEscapeKey: false,
    didOpen: () => {

        const style = document.createElement("style");
        style.innerHTML = `
        .spinner{
            width:55px;
            height:55px;
            border:5px solid #e5e7eb;
            border-top:5px solid #2563eb;
            border-radius:50%;
            margin:auto;
            animation:spin .8s linear infinite;
        }

        @keyframes spin{
            100%{
                transform:rotate(360deg);
            }
        }
        `;
        document.head.appendChild(style);

    }
});

setTimeout(() => {

    window.location.href = "dashboard.html";

}, 1800);

   } catch (error) {

    console.error("GOOGLE LOGIN ERROR:", error);

    Swal.fire({
        icon: "error",
        title: "Google Login Failed",
        text: error.message
    });

}
});


const loginForm = document.getElementById("loginForm");
const loginMessage = document.getElementById("loginMessage");

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  loginMessage.textContent = "";

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);

const user = cred.user;

const snap = await getDoc(doc(db, "users", user.uid));

if (!snap.exists()) {

    await signOut(auth);

    loginMessage.style.color = "red";
    loginMessage.textContent = "This account is not registered.";

    return;

}

const data = snap.data();

if (data.accountStatus === "Disabled") {

    await signOut(auth);

    alert("Your account has been disabled.");

    return;

}

const allowedRoles = [
    "Super Admin",
    "Admin",
    "Editor",
    "Reporter"
];

if (!allowedRoles.includes(data.role)) {

    await signOut(auth);

    alert("Your account has no permission to access the CMS.");

    return;

}

await updateDoc(doc(db, "users", user.uid), {

    status: "Active",
    lastSeen: serverTimestamp()

});


Swal.fire({
    title: "Login Successful",
    html: `
        <div style="padding:15px;">
            <div class="spinner"></div>
            <p style="margin-top:15px;font-size:15px;">
                Loading Dashboard...
            </p>
        </div>
    `,
    showConfirmButton: false,
    allowOutsideClick: false,
    allowEscapeKey: false,
    didOpen: () => {

        const style = document.createElement("style");
        style.innerHTML = `
        .spinner{
            width:55px;
            height:55px;
            border:5px solid #e5e7eb;
            border-top:5px solid #2563eb;
            border-radius:50%;
            margin:auto;
            animation:spin .8s linear infinite;
        }

        @keyframes spin{
            100%{
                transform:rotate(360deg);
            }
        }
        `;
        document.head.appendChild(style);

    }
});

setTimeout(() => {

    window.location.href = "dashboard.html";

}, 1800);
    

  } catch (error) {

    console.error("EMAIL LOGIN ERROR:", error);

    loginMessage.style.color = "red";
    loginMessage.textContent = `${error.code} : ${error.message}`;

}
});


async function loadLoginWebsiteSettings() {

    try {

        const ref =
            doc(db, "settings", "website");

        const snap =
            await getDoc(ref);

        if (!snap.exists()) {
            return;
        }

        const data = snap.data();

        const websiteName =
            data.websiteName ||
            "Primetime News Cotabato";

        const websiteLogo =
            data.websiteLogo ||
            "../images/PRIMETIME NEWS LOGO.png";

        const websiteDescription =
            data.websiteDescription ||
            "Empowering journalists and media organizations with a secure, intelligent, and efficient platform to create, manage, and publish accurate, timely, and trusted news for every audience.";


        // ==========================
        // WEBSITE TITLE
        // ==========================

        document.title =
            websiteName + " - Login";


        // ==========================
        // BRAND NAME
        // ==========================

        const brandName =
            document.getElementById("brandName");

        if (brandName) {

            brandName.textContent =
                websiteName;

        }


        // ==========================
        // BRAND LOGO
        // ==========================

        const brandLogo =
            document.getElementById("brandLogo");

        if (brandLogo) {

            brandLogo.src =
                websiteLogo;

        }


        // ==========================
        // LOGIN LOGO
        // ==========================

        const loginLogo =
            document.getElementById("loginLogo");

        if (loginLogo) {

            loginLogo.src =
                websiteLogo;

        }


        // ==========================
        // DESCRIPTION
        // ==========================

        const brandDescription =
            document.getElementById("brandDescription");

        if (brandDescription) {

            brandDescription.textContent =
                websiteDescription;

        }


        console.log(
            "Login Website Settings Loaded:",
            data
        );

    } catch (error) {

        console.error(
            "Failed to load login website settings:",
            error
        );

    }

}

loadLoginWebsiteSettings();



// =======================
// SHOW / HIDE PASSWORD
// =======================

document.querySelectorAll(".toggle-password").forEach(icon => {

    icon.addEventListener("click", () => {

        const input = document.getElementById(icon.dataset.target);

        if (!input) return;

        if (input.type === "password") {

            input.type = "text";
            icon.classList.replace("fa-eye", "fa-eye-slash");

        } else {

            input.type = "password";
            icon.classList.replace("fa-eye-slash", "fa-eye");

        }

    });

});