import {
    auth,
    db,
    googleProvider,
    facebookProvider
} from "./firebase.js";

import {
    signInWithPopup,
    EmailAuthProvider,
    reauthenticateWithCredential
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";

import {
    doc,
    getDoc,
    setDoc,
    updateDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

const loadingOverlay = document.getElementById("loadingOverlay");
const loadingTitle = document.getElementById("loadingTitle");
const loadingText = document.getElementById("loadingText");

const form = document.getElementById("registerForm");
const message = document.getElementById("registerMessage");

let pendingData = null;

// ===============================
// Detect Edit Mode
// ===============================

const params = new URLSearchParams(window.location.search);
const editId = params.get("id");
let editUserData = null;
let isEditMode = false;

if (editId) {

    isEditMode = true;

    document.getElementById("socialLogin").style.display = "none";
    document.getElementById("socialDivider").style.display = "none";
    document.getElementById("passwordBox").style.display = "none";

} else {

    document.getElementById("socialLogin").style.display = "block";
    document.getElementById("socialDivider").style.display = "flex";
    document.getElementById("passwordBox").style.display = "flex";

}
// =======================
// LOAD USER IF EDIT MODE
// =======================

if (isEditMode) {

    if (isEditMode) {

    document.getElementById("socialLogin").style.display = "none";
    document.getElementById("socialDivider").style.display = "none";
    document.getElementById("passwordBox").style.display = "none";

    document.getElementById("buttonText").textContent = "Update Account";

} else {

    document.getElementById("socialLogin").style.display = "flex";
    document.getElementById("socialDivider").style.display = "flex";
    document.getElementById("passwordBox").style.display = "flex";

    document.getElementById("buttonText").textContent = "Create Account";

}
    loadUserForEdit();
}

async function loadUserForEdit() {

    const snap = await getDoc(doc(db, "users", editId));

    if (!snap.exists()) return;

    editUserData = snap.data();

    document.getElementById("name").value = editUserData.name || "";

    document.getElementById("email").value = editUserData.email || "";

    document.getElementById("role").value = editUserData.role || "User";

    document.getElementById("previewPhoto").src =
        editUserData.photoURL || "../images/default-user.png";

    document.getElementById("email").readOnly = true;

    document.getElementById("password").required = false;

    document.getElementById("password").placeholder =
        "Leave blank to keep current password";

    document.getElementById("buttonText").textContent =
        "Update Account";

}


// =======================
// REGISTER FORM
// =======================

form.addEventListener("submit", async (e) => {

    e.preventDefault();

    message.textContent = "";

    const data = {

    name: document.getElementById("name").value.trim(),
    email: document.getElementById("email").value.trim(),
    password: document.getElementById("password").value,
    role: document.getElementById("role").value,
    photoURL: ""

};

    // If Admin → ask password first
  if (isEditMode) {

    pendingData = data;

    const userSnap = await getDoc(doc(db, "users", editId));

    const userData = userSnap.data();

    if (data.role === "Admin") {

        document.getElementById("adminPassword").value = "";
        document.getElementById("adminPasswordModal").style.display = "flex";
        return;

    }

    await updateAccount(data);
    return;

}


// Create Mode

if (data.role === "Admin") {

    pendingData = data;

    document.getElementById("adminPassword").value = "";

    document.getElementById("adminPasswordModal").style.display = "flex";

    return;

}

await createAccount(data);

});

// =======================
// CREATE ACCOUNT
// =======================

async function createAccount(data){

    try{

 
        Swal.fire({

            title:"Creating Account",

            html:`
                <div style="margin-top:10px;">
                    <div style="font-size:15px;color:#666;">
                        Please wait while we create the account...
                    </div>
                </div>
            `,

            allowOutsideClick:false,
            allowEscapeKey:false,

            didOpen:()=>{

    Swal.showLoading();

}

});

// ======================
// Upload Photo
// ======================

const file = document.getElementById("photo").files[0];

let photoURL = "";

if (file) {

    const formData = new FormData();

    formData.append("file", file);

    formData.append("upload_preset", "Primetime-News-Cotabato");

    const upload = await fetch(
        "https://api.cloudinary.com/v1_1/ufx7karu/image/upload",
        {
            method: "POST",
            body: formData
        }
    );

    const uploaded = await upload.json();

    photoURL = uploaded.secure_url;
    console.log(uploaded);
    console.log(photoURL);
}

data.photoURL = photoURL;

console.log("FINAL DATA:", data);

// ======================
// Create User
// ======================

const res = await fetch("http://localhost:3000/create-user", {

    method:"POST",

    headers:{
        "Content-Type":"application/json"
    },

    body:JSON.stringify(data)

});


        const result = await res.json();

        if(result.success){

            await Swal.fire({

                icon:"success",

                title:"Account Created!",

                html:`
                    <b>${data.name}</b>
                    <br><br>
                    has been added successfully.
                    <br><br>
                    Redirecting...

                `,

                timer:1800,

                timerProgressBar:true,

                showConfirmButton:false

            });

            form.reset();

            window.location.href="users.html";

        }else{

            Swal.fire({

                icon:"error",

                title:"Unable to Create Account",

                text:result.error,

                confirmButtonColor:"#2563eb"

            });

        }

    }catch(err){

        console.error(err);

        Swal.fire({

            icon:"error",

            title:"Connection Error",

            text:"Cannot connect to server.",

            confirmButtonColor:"#2563eb"

        });

    }

}

// =======================
// UPDATE ACCOUNT
// =======================

async function updateAccount(data) {

    try {

        // Upload new photo if user selected one
        const file = document.getElementById("photo").files[0];

        if (file) {

            const formData = new FormData();

            formData.append("file", file);
            formData.append("upload_preset", "Primetime-News-Cotabato"); 

            const upload = await fetch(
                "https://api.cloudinary.com/v1_1/ufx7karu/image/upload",
                {
                    method: "POST",
                    body: formData
                }
            );

            const uploaded = await upload.json();

            data.photoURL = uploaded.secure_url;
        }

        const payload = {

    name: data.name,
    role: data.role,

    photoURL: data.photoURL || editUserData.photoURL,

    provider: editUserData.provider,

    email: editUserData.email,

    status: editUserData.status,

    createdAt: editUserData.createdAt,

    lastSeen: editUserData.lastSeen

};

        const res = await fetch(`http://localhost:3000/update-user/${editId}`, {

            method: "PUT",

            headers: {
                "Content-Type": "application/json"
            },
            

            body: JSON.stringify(payload)

        });

        const result = await res.json();

        if (result.success) {

            await Swal.fire({
                icon: "success",
                title: "Account Updated"
            });

            location.href = "users.html";

        } else {

            Swal.fire({
                icon: "error",
                title: "Update Failed",
                text: result.error
            });

        }

    } catch (err) {

        console.error(err);

    }

}

// =======================
// VERIFY SUPER ADMIN PASSWORD
// =======================

document.getElementById("verifyAdminPassword").addEventListener("click", async () => {

    const password = document.getElementById("adminPassword").value;

    try {

        const currentUser = auth.currentUser;

        if (!currentUser) {

            alert("Please login first.");
            return;

        }

        // Check role from Firestore
        const snap = await getDoc(doc(db, "users", currentUser.uid));

        if (!snap.exists()) {

            alert("User record not found.");
            return;

        }

        const data = snap.data();

               if (data.role !== "Super Admin") {

            alert("Only Super Admin can create Admin accounts.");
            return;

        }

        // Verify current user's password
        const credential = EmailAuthProvider.credential(
            currentUser.email,
            password
        );

        await reauthenticateWithCredential(
            currentUser,
            credential
        );

        document.getElementById("adminPasswordModal").style.display = "none";

        if (isEditMode) {

    await updateAccount(pendingData);

} else {

    await createAccount(pendingData);

}

    } catch (err) {

        console.error(err);

        alert("Incorrect Super Admin Password.");

    }

});

// =======================
// CANCEL ADMIN PASSWORD
// =======================

document.getElementById("cancelAdminPassword").addEventListener("click", () => {

    document.getElementById("adminPasswordModal").style.display = "none";

});

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

const photoInput = document.getElementById("photo");
const choosePhotoBtn = document.getElementById("choosePhotoBtn");
const previewPhoto = document.getElementById("previewPhoto");

choosePhotoBtn.addEventListener("click", () => {
    photoInput.click();
});

photoInput.addEventListener("change", () => {

    const file = photoInput.files[0];

    if(file){
        previewPhoto.src = URL.createObjectURL(file);
    }

});

// ===============================
// GOOGLE REGISTER
// ===============================

const googleBtn = document.getElementById("googleRegister");

if (googleBtn) {

    googleBtn.addEventListener("click", async () => {

        try {

            const result = await signInWithPopup(auth, googleProvider);

console.log("GOOGLE USER:", result.user);

const user = result.user;

await setDoc(doc(db, "users", user.uid), {

    name: user.displayName || "",
    email: user.email || "",
    photoURL: user.photoURL || "",
    provider: "Google",
    role: "User",
    status: "Active",
    createdAt: serverTimestamp(),
    lastSeen: serverTimestamp()

}, { merge: true });

await updateDoc(doc(db, "users", user.uid), {
    lastSeen: serverTimestamp()
});

const check = await getDoc(doc(db, "users", user.uid));

console.log("AFTER SAVE:", check.exists(), check.data());

console.log("USER SAVED TO FIRESTORE");


            Swal.fire({
                icon: "success",
                title: "Welcome!",
                text: "Google account registered successfully."
            });

            window.location.href = `register.html?id=${user.uid}`;

        } catch (err) {

            console.error(err);

            Swal.fire({
                icon: "error",
                title: "Google Login Failed",
                text: err.message
            });

        }

    });

}


// ===============================
// FACEBOOK REGISTER
// ===============================

const facebookBtn =
    document.getElementById("facebookRegister");

let facebookLoginRunning = false;

if (facebookBtn) {

    facebookBtn.addEventListener("click", async () => {

        // Prevent double click
        if (facebookLoginRunning) {
            return;
        }

        facebookLoginRunning = true;

        facebookBtn.disabled = true;

        try {

            console.log("Starting Facebook Login...");

            const result =
                await signInWithPopup(
                    auth,
                    facebookProvider
                );

            const user = result.user;

            console.log("FACEBOOK USER:", user);

            await setDoc(
                doc(db, "users", user.uid),
                {
                    name: user.displayName || "",
                    email: user.email || "",
                    photoURL: user.photoURL || "",

                    provider: "Facebook",

                    role: "User",

                    status: "Active",

                    createdAt: serverTimestamp(),

                    lastSeen: serverTimestamp()
                },
                {
                    merge: true
                }
            );

            console.log(
                "FACEBOOK USER SAVED:",
                user.uid
            );

            await Swal.fire({
                icon: "success",
                title: "Welcome!",
                text: "Facebook account registered successfully."
            });

            window.location.href =
                `register.html?id=${user.uid}`;

        }

        catch (err) {

            console.error(
                "FACEBOOK ERROR:",
                err
            );

            if (
                err.code ===
                "auth/cancelled-popup-request"
            ) {

                Swal.fire({
                    icon: "warning",
                    title: "Login already in progress",
                    text: "Please wait for the Facebook popup to finish."
                });

            }

            else {

                Swal.fire({
                    icon: "error",
                    title: "Facebook Registration Failed",
                    text: err.message
                });

            }

        }

        finally {

            facebookLoginRunning = false;

            facebookBtn.disabled = false;

        }

    });

}