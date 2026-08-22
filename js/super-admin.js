import { auth, db } from "./firebase.js";

import {
    createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";

import {
    collection,
    query,
    where,
    getDocs,
    doc,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

const form = document.getElementById("adminForm");
const msg = document.getElementById("msg");
const btn = form.querySelector("button");

// =========================
// SHOW / HIDE PASSWORD
// =========================

document.querySelector(".toggle-password").addEventListener("click", () => {

    const input = document.getElementById("password");
    const icon = document.querySelector(".toggle-password");

    if (input.type === "password") {

        input.type = "text";
        icon.classList.replace("fa-eye", "fa-eye-slash");

    } else {

        input.type = "password";
        icon.classList.replace("fa-eye-slash", "fa-eye");

    }

});

// =========================
// CHECK EXISTING ADMIN
// =========================

window.addEventListener("DOMContentLoaded", async () => {

    const q = query(
        collection(db, "users"),
        where("role", "==", "Admin")
    );

    const snap = await getDocs(q);

    if (!snap.empty) {

        form.innerHTML = `
            <div style="text-align:center;">
                <i class="fas fa-lock"
                   style="font-size:60px;color:#dc3545;margin-bottom:20px;"></i>

                <h2>Super Admin Already Exists</h2>

                <p style="margin-top:15px;">
                    This page has been disabled for security.
                </p>

                <a href="login.html"
                   style="
                        display:inline-block;
                        margin-top:25px;
                        padding:12px 25px;
                        background:#0d6efd;
                        color:#fff;
                        text-decoration:none;
                        border-radius:10px;">
                    Go to Login
                </a>
            </div>
        `;

    }

});

// =========================
// CREATE ADMIN
// =========================

form.addEventListener("submit", async (e) => {

    e.preventDefault();

    btn.disabled = true;
    btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Creating...`;

    msg.textContent = "";

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    try {

        const cred = await createUserWithEmailAndPassword(
            auth,
            email,
            password
        );

        await setDoc(doc(db, "users", cred.user.uid), {

            name,
            email,
            role: "Admin",
            status: "Active",
            photoURL: "",
            createdAt: serverTimestamp()

        });

        msg.style.color = "#198754";
        msg.textContent = "✔ Super Admin created successfully.";

        setTimeout(() => {

            location.href = "login.html";

        }, 1500);

    } catch (err) {

        msg.style.color = "#dc3545";
        msg.textContent = err.message;

        btn.disabled = false;
        btn.innerHTML = `
            <i class="fas fa-user-shield"></i>
            Create Super Admin
        `;

    }

});