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


// ==========================================
// ELEMENTS
// ==========================================

const loadingOverlay = document.getElementById("loadingOverlay");
const loadingTitle = document.getElementById("loadingTitle");
const loadingText = document.getElementById("loadingText");

const form = document.getElementById("registerForm");
const message = document.getElementById("registerMessage");

let pendingData = null;


// ==========================================
// DETECT EDIT MODE
// ==========================================

const params = new URLSearchParams(window.location.search);

const editId = params.get("id");

let editUserData = null;
let isEditMode = false;


// ==========================================
// INITIAL UI
// ==========================================

if (editId) {

    isEditMode = true;

    document.getElementById("socialLogin").style.display = "none";
    document.getElementById("socialDivider").style.display = "none";
    document.getElementById("passwordBox").style.display = "none";

} else {

    isEditMode = false;

    document.getElementById("socialLogin").style.display = "block";
    document.getElementById("socialDivider").style.display = "flex";
    document.getElementById("passwordBox").style.display = "flex";

}


// ==========================================
// LOAD USER FOR EDIT
// ==========================================

if (isEditMode) {

    document.getElementById("socialLogin").style.display = "none";
    document.getElementById("socialDivider").style.display = "none";
    document.getElementById("passwordBox").style.display = "none";

    document.getElementById("buttonText").textContent =
        "Update Account";

    loadUserForEdit();

}


// ==========================================
// LOAD USER DATA
// ==========================================

async function loadUserForEdit() {

    try {

        const snap =
            await getDoc(
                doc(db, "users", editId)
            );

        if (!snap.exists()) {

            Swal.fire({
                icon: "error",
                title: "User Not Found",
                text: "The selected user account could not be found."
            });

            return;
        }

        editUserData = snap.data();

        document.getElementById("name").value =
            editUserData.name || "";

        document.getElementById("email").value =
            editUserData.email || "";

        document.getElementById("role").value =
            editUserData.role || "User";

        document.getElementById("previewPhoto").src =
            editUserData.photoURL ||
            "../images/default-user.png";

        // Email cannot be changed in edit mode
        document.getElementById("email").readOnly = true;

        // Password is optional during edit
        document.getElementById("password").required = false;

        document.getElementById("password").placeholder =
            "Leave blank to keep current password";

        document.getElementById("buttonText").textContent =
            "Update Account";

    } catch (err) {

        console.error(
            "LOAD USER ERROR:",
            err
        );

        Swal.fire({
            icon: "error",
            title: "Unable to Load User",
            text: err.message || "Something went wrong."
        });

    }

}


// ==========================================
// REGISTER / UPDATE FORM
// ==========================================

form.addEventListener("submit", async (e) => {

    e.preventDefault();

    message.textContent = "";


    const data = {

        name:
            document.getElementById("name")
                .value
                .trim(),

        email:
            document.getElementById("email")
                .value
                .trim(),

        password:
            document.getElementById("password")
                .value,

        role:
            document.getElementById("role")
                .value,

        photoURL: ""

    };


    // ======================================
    // EDIT MODE
    // ======================================

    if (isEditMode) {

        pendingData = data;

        /*
         * If changing the account to Admin,
         * require Super Admin password.
         */

        if (data.role === "Admin") {

            document.getElementById("adminPassword").value = "";

            document.getElementById(
                "adminPasswordModal"
            ).style.display = "flex";

            return;
        }


        await updateAccount(data);

        return;
    }


    // ======================================
    // CREATE MODE
    // ======================================

    /*
     * Creating an Admin requires
     * Super Admin verification.
     */

    if (data.role === "Admin") {

        pendingData = data;

        document.getElementById("adminPassword").value = "";

        document.getElementById(
            "adminPasswordModal"
        ).style.display = "flex";

        return;
    }


    await createAccount(data);

});


// ==========================================
// CREATE ACCOUNT
// ==========================================

async function createAccount(data) {

    try {

        Swal.fire({

            title: "Creating Account",

            html: `
                <div style="margin-top:10px;">
                    <div style="font-size:15px;color:#666;">
                        Please wait while we create the account...
                    </div>
                </div>
            `,

            allowOutsideClick: false,
            allowEscapeKey: false,

            didOpen: () => {

                Swal.showLoading();

            }

        });


        // ==================================
        // UPLOAD PHOTO TO CLOUDINARY
        // ==================================

        const file =
            document.getElementById("photo")
                .files[0];

        let photoURL = "";


        if (file) {

            const formData =
                new FormData();

            formData.append(
                "file",
                file
            );

            formData.append(
                "upload_preset",
                "Primetime-News-Cotabato"
            );


            const upload =
                await fetch(
                    "https://api.cloudinary.com/v1_1/ufx7karu/image/upload",
                    {
                        method: "POST",
                        body: formData
                    }
                );


            const uploaded =
                await upload.json();


            if (!upload.ok) {

                throw new Error(
                    uploaded?.error?.message ||
                    "Cloudinary photo upload failed."
                );
            }


            photoURL =
                uploaded.secure_url;


            console.log(
                "Cloudinary Upload:",
                uploaded
            );

            console.log(
                "Photo URL:",
                photoURL
            );

        }


        data.photoURL =
            photoURL;


        console.log(
            "FINAL CREATE DATA:",
            data
        );


        // ==================================
        // CREATE USER
        // CLOUDFLARE PAGES FUNCTION
        // ==================================

        const res =
            await fetch(
                "/create-user",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify(data)
                }
            );


        const result =
            await res.json();


        console.log(
            "CREATE USER RESPONSE:",
            result
        );


        if (result.success) {

            await Swal.fire({

                icon: "success",

                title: "Account Created!",

                html: `
                    <b>${data.name}</b>
                    <br><br>
                    has been added successfully.
                    <br><br>
                    Redirecting...
                `,

                timer: 1800,

                timerProgressBar: true,

                showConfirmButton: false

            });


            form.reset();

            window.location.href =
                "users.html";


        } else {

            Swal.fire({

                icon: "error",

                title: "Unable to Create Account",

                text:
                    result.error ||
                    "Unable to create account.",

                confirmButtonColor:
                    "#2563eb"

            });

        }


    } catch (err) {

        console.error(
            "CREATE ACCOUNT ERROR:",
            err
        );


        Swal.close();


        Swal.fire({

            icon: "error",

            title: "Connection Error",

            text:
                err.message ||
                "Cannot connect to server.",

            confirmButtonColor:
                "#2563eb"

        });

    }

}


// ==========================================
// UPDATE ACCOUNT
// ==========================================

async function updateAccount(data) {

    try {

        Swal.fire({

            title: "Updating Account",

            html: `
                <div style="margin-top:10px;">
                    <div style="font-size:15px;color:#666;">
                        Please wait while we update the account...
                    </div>
                </div>
            `,

            allowOutsideClick: false,

            allowEscapeKey: false,

            didOpen: () => {

                Swal.showLoading();

            }

        });


        // ==================================
        // UPLOAD NEW PHOTO IF SELECTED
        // ==================================

        const file =
            document.getElementById("photo")
                .files[0];


        if (file) {

            const formData =
                new FormData();

            formData.append(
                "file",
                file
            );

            formData.append(
                "upload_preset",
                "Primetime-News-Cotabato"
            );


            const upload =
                await fetch(
                    "https://api.cloudinary.com/v1_1/ufx7karu/image/upload",
                    {
                        method: "POST",
                        body: formData
                    }
                );


            const uploaded =
                await upload.json();


            if (!upload.ok) {

                throw new Error(
                    uploaded?.error?.message ||
                    "Cloudinary photo upload failed."
                );
            }


            data.photoURL =
                uploaded.secure_url;


            console.log(
                "Updated Cloudinary Photo:",
                data.photoURL
            );

        }


        // ==================================
        // BUILD UPDATE PAYLOAD
        // ==================================

        const payload = {

            name:
                data.name,

            email:
                editUserData.email,

            role:
                data.role,

            photoURL:
                data.photoURL ||
                editUserData.photoURL ||
                "",

            provider:
                editUserData.provider,

            status:
                editUserData.status,

            createdAt:
                editUserData.createdAt,

            lastSeen:
                editUserData.lastSeen

        };


        /*
         * IMPORTANT:
         * Only send password when the user
         * actually entered a new password.
         *
         * Blank password means:
         * KEEP CURRENT PASSWORD.
         */

        if (
            data.password &&
            data.password.trim() !== ""
        ) {

            payload.password =
                data.password;

        }


        console.log(
            "FINAL UPDATE PAYLOAD:",
            payload
        );


        // ==================================
        // UPDATE USER
        // CLOUDFLARE PAGES FUNCTION
        // ==================================

        const res =
            await fetch(
                `/update-user/${encodeURIComponent(editId)}`,
                {
                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify(payload)
                }
            );


        const result =
            await res.json();


        console.log(
            "UPDATE USER RESPONSE:",
            result
        );


        if (result.success) {

            await Swal.fire({

                icon: "success",

                title: "Account Updated",

                text:
                    "User account has been updated successfully.",

                confirmButtonColor:
                    "#2563eb"

            });


            location.href =
                "users.html";


        } else {

            Swal.fire({

                icon: "error",

                title: "Update Failed",

                text:
                    result.error ||
                    "Unable to update account.",

                confirmButtonColor:
                    "#2563eb"

            });

        }


    } catch (err) {

        console.error(
            "UPDATE ACCOUNT ERROR:",
            err
        );


        Swal.close();


        Swal.fire({

            icon: "error",

            title: "Connection Error",

            text:
                err.message ||
                "Cannot connect to update server.",

            confirmButtonColor:
                "#2563eb"

        });

    }

}


// ==========================================
// VERIFY SUPER ADMIN PASSWORD
// ==========================================

document
    .getElementById("verifyAdminPassword")
    .addEventListener(
        "click",
        async () => {

            const password =
                document.getElementById(
                    "adminPassword"
                ).value;


            try {

                const currentUser =
                    auth.currentUser;


                if (!currentUser) {

                    alert(
                        "Please login first."
                    );

                    return;
                }


                // ==================================
                // GET CURRENT USER FIRESTORE DATA
                // ==================================

                const snap =
                    await getDoc(
                        doc(
                            db,
                            "users",
                            currentUser.uid
                        )
                    );


                if (!snap.exists()) {

                    alert(
                        "User record not found."
                    );

                    return;
                }


                const currentUserData =
                    snap.data();


                // ==================================
                // ONLY SUPER ADMIN
                // ==================================

                if (
                    currentUserData.role !==
                    "Super Admin"
                ) {

                    alert(
                        "Only Super Admin can create or modify Admin accounts."
                    );

                    return;
                }


                // ==================================
                // VERIFY PASSWORD
                // ==================================

                const credential =
                    EmailAuthProvider.credential(
                        currentUser.email,
                        password
                    );


                await reauthenticateWithCredential(
                    currentUser,
                    credential
                );


                // ==================================
                // PASSWORD CORRECT
                // ==================================

                document.getElementById(
                    "adminPasswordModal"
                ).style.display = "none";


                if (isEditMode) {

                    await updateAccount(
                        pendingData
                    );

                } else {

                    await createAccount(
                        pendingData
                    );

                }

            } catch (err) {

                console.error(
                    "SUPER ADMIN VERIFICATION ERROR:",
                    err
                );


                alert(
                    "Incorrect Super Admin Password."
                );

            }

        }
    );


// ==========================================
// CANCEL ADMIN PASSWORD
// ==========================================

document
    .getElementById("cancelAdminPassword")
    .addEventListener(
        "click",
        () => {

            document.getElementById(
                "adminPasswordModal"
            ).style.display = "none";

        }
    );


// ==========================================
// SHOW / HIDE PASSWORD
// ==========================================

document
    .querySelectorAll(".toggle-password")
    .forEach(icon => {

        icon.addEventListener(
            "click",
            () => {

                const input =
                    document.getElementById(
                        icon.dataset.target
                    );


                if (!input) {

                    return;

                }


                if (
                    input.type ===
                    "password"
                ) {

                    input.type =
                        "text";

                    icon.classList.replace(
                        "fa-eye",
                        "fa-eye-slash"
                    );

                } else {

                    input.type =
                        "password";

                    icon.classList.replace(
                        "fa-eye-slash",
                        "fa-eye"
                    );

                }

            }
        );

    });


// ==========================================
// PHOTO PREVIEW
// ==========================================

const photoInput =
    document.getElementById("photo");

const choosePhotoBtn =
    document.getElementById(
        "choosePhotoBtn"
    );

const previewPhoto =
    document.getElementById(
        "previewPhoto"
    );


choosePhotoBtn.addEventListener(
    "click",
    () => {

        photoInput.click();

    }
);


photoInput.addEventListener(
    "change",
    () => {

        const file =
            photoInput.files[0];


        if (file) {

            previewPhoto.src =
                URL.createObjectURL(
                    file
                );

        }

    }
);


// ==========================================
// GOOGLE REGISTER
// ==========================================

const googleBtn =
    document.getElementById(
        "googleRegister"
    );


if (googleBtn) {

    googleBtn.addEventListener(
        "click",
        async () => {

            try {

                const result =
                    await signInWithPopup(
                        auth,
                        googleProvider
                    );


                console.log(
                    "GOOGLE USER:",
                    result.user
                );


                const user =
                    result.user;


                // ==================================
                // SAVE GOOGLE USER TO FIRESTORE
                // ==================================

                await setDoc(
                    doc(
                        db,
                        "users",
                        user.uid
                    ),
                    {

                        name:
                            user.displayName ||
                            "",

                        email:
                            user.email ||
                            "",

                        photoURL:
                            user.photoURL ||
                            "",

                        provider:
                            "Google",

                        role:
                            "User",

                        status:
                            "Active",

                        createdAt:
                            serverTimestamp(),

                        lastSeen:
                            serverTimestamp()

                    },
                    {
                        merge: true
                    }
                );


                await updateDoc(
                    doc(
                        db,
                        "users",
                        user.uid
                    ),
                    {
                        lastSeen:
                            serverTimestamp()
                    }
                );


                const check =
                    await getDoc(
                        doc(
                            db,
                            "users",
                            user.uid
                        )
                    );


                console.log(
                    "AFTER SAVE:",
                    check.exists(),
                    check.data()
                );


                console.log(
                    "USER SAVED TO FIRESTORE"
                );


                await Swal.fire({

                    icon: "success",

                    title: "Welcome!",

                    text:
                        "Google account registered successfully."

                });


                window.location.href =
                    `register.html?id=${user.uid}`;


            } catch (err) {

                console.error(
                    "GOOGLE ERROR:",
                    err
                );


                Swal.fire({

                    icon: "error",

                    title: "Google Login Failed",

                    text:
                        err.message

                });

            }

        }
    );

}


// ==========================================
// FACEBOOK REGISTER
// ==========================================

const facebookBtn =
    document.getElementById(
        "facebookRegister"
    );


let facebookLoginRunning =
    false;


if (facebookBtn) {

    facebookBtn.addEventListener(
        "click",
        async () => {

            // ==================================
            // PREVENT DOUBLE CLICK
            // ==================================

            if (facebookLoginRunning) {

                return;

            }


            facebookLoginRunning =
                true;

            facebookBtn.disabled =
                true;


            try {

                console.log(
                    "Starting Facebook Login..."
                );


                const result =
                    await signInWithPopup(
                        auth,
                        facebookProvider
                    );


                const user =
                    result.user;


                console.log(
                    "FACEBOOK USER:",
                    user
                );


                // ==================================
                // SAVE FACEBOOK USER
                // ==================================

                await setDoc(
                    doc(
                        db,
                        "users",
                        user.uid
                    ),
                    {

                        name:
                            user.displayName ||
                            "",

                        email:
                            user.email ||
                            "",

                        photoURL:
                            user.photoURL ||
                            "",

                        provider:
                            "Facebook",

                        role:
                            "User",

                        status:
                            "Active",

                        createdAt:
                            serverTimestamp(),

                        lastSeen:
                            serverTimestamp()

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

                    text:
                        "Facebook account registered successfully."

                });


                window.location.href =
                    `register.html?id=${user.uid}`;


            } catch (err) {

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

                        title:
                            "Login already in progress",

                        text:
                            "Please wait for the Facebook popup to finish."

                    });

                } else {

                    Swal.fire({

                        icon: "error",

                        title:
                            "Facebook Registration Failed",

                        text:
                            err.message

                    });

                }

            } finally {

                facebookLoginRunning =
                    false;

                facebookBtn.disabled =
                    false;

            }

        }
    );

}
