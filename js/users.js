import { auth, db } from "./firebase.js";

import {
    collection,
    getDoc,
    doc,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

import {
EmailAuthProvider,
reauthenticateWithCredential,
 onAuthStateChanged
}
from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";

import { loadTheme } from "./theme.js";

loadTheme();

const usersTable = document.getElementById("usersTable");

let allUsers = [];

let currentUserRole = "";

async function verifySuperAdmin() {

    const { value: password } = await Swal.fire({

        title: "Super Admin Verification",

        text: "Enter your current password to continue.",

        input: "password",

        inputPlaceholder: "Current Password",

        inputAttributes: {

            autocapitalize: "off",
            autocomplete: "current-password"

        },

        showCancelButton: true,

        confirmButtonText: "Verify",

        confirmButtonColor: "#2563eb",

        cancelButtonText: "Cancel"

    });

    if (!password) return false;

    try {

        const currentUser = auth.currentUser;

        if (!currentUser) {

            Swal.fire({
                icon: "error",
                title: "Not Logged In"
            });

            return false;

        }

        const snap = await getDoc(doc(db, "users", currentUser.uid));

        if (!snap.exists()) {

            Swal.fire({
                icon: "error",
                title: "Account not found"
            });

            return false;

        }

    
const account = snap.data();

console.log("Current User:", currentUser.email);
console.log("Firestore Role:", account.role);

if (account.role !== "Super Admin") {

    Swal.fire({
        icon: "error",
        title: "Access Denied",
        text: "Only Super Admin can perform this action."
    });

    return false;

}

const credential = EmailAuthProvider.credential(
    currentUser.email,
    password
);

await reauthenticateWithCredential(
    currentUser,
    credential
);

return true;

    } catch (err) {

        Swal.fire({

            icon: "error",

            title: "Incorrect Password",

            text: "Super Admin password is incorrect."

        });

        return false;

    }

}


// =============================
// LOAD USERS
// =============================

let usersUnsubscribe = null;

async function loadUsers() {

    usersTable.innerHTML = `
        <tr>
            <td colspan="6" style="text-align:center;padding:30px;">
                Loading users...
            </td>
        </tr>
    `;

    try {

        const currentUser = auth.currentUser;

        if (!currentUser) {
            console.error("No logged-in user.");
            return;
        }

        // Get current user's role ONCE
        const currentUserSnap = await getDoc(
            doc(db, "users", currentUser.uid)
        );

        if (!currentUserSnap.exists()) {
            console.error("Current user document not found.");
            return;
        }

        const currentUserData = currentUserSnap.data();

        currentUserRole =
            currentUserData.role || "";

        console.log(
            "CURRENT USER:",
            currentUser.email
        );

        console.log(
            "CURRENT USER ROLE:",
            currentUserRole
        );

        // Prevent duplicate listener
        if (usersUnsubscribe) {
            usersUnsubscribe();
        }

        // ONE REALTIME LISTENER ONLY
        usersUnsubscribe = onSnapshot(
            collection(db, "users"),
            (snapshot) => {

                const users = [];

                snapshot.forEach((docSnap) => {

                    const user = {
                        id: docSnap.id,
                        ...docSnap.data()
                    };

                    // Hide Super Admin from non-Super Admin
                    if (
                        user.role === "Super Admin" &&
                        currentUserRole !== "Super Admin"
                    ) {
                        return;
                    }

                    users.push(user);

                });

                allUsers = users;

                console.log(
                    "VISIBLE USERS:",
                    allUsers.length
                );

                renderUsers(allUsers);

            },
            (error) => {

                console.error(
                    "Users realtime listener error:",
                    error
                );

                usersTable.innerHTML = `
                    <tr>
                        <td colspan="6"
                            style="
                                text-align:center;
                                padding:30px;
                                color:red;
                            ">
                            Failed to load users.
                        </td>
                    </tr>
                `;

            }
        );

    } catch (error) {

        console.error(
            "Load Users Error:",
            error
        );

        usersTable.innerHTML = `
            <tr>
                <td colspan="6"
                    style="
                        text-align:center;
                        padding:30px;
                        color:red;
                    ">
                    Failed to load users.
                </td>
            </tr>
        `;

    }

}

let renderTimer = null;
let lastUsersHash = "";

function renderUsers(list) {

    // Prevent unnecessary re-render
    const usersHash = list.map(user => [
        user.id,
        user.name,
        user.email,
        user.role,
        user.status,
        user.lastSeen?.toMillis?.() || "",
        user.photoURL || "",
        user.profileImage || ""
    ].join("|")).join("||");

    if (usersHash === lastUsersHash) {
        return;
    }

    lastUsersHash = usersHash;

    // Prevent rapid multiple renders
    clearTimeout(renderTimer);

    renderTimer = setTimeout(() => {

        if (!list.length) {

            usersTable.innerHTML = `
                <tr>
                    <td colspan="6"
                        style="
                            text-align:center;
                            padding:30px;
                        ">
                        No users found.
                    </td>
                </tr>
            `;

            return;
        }

        let html = "";

        list.forEach(user => {

            const isOnline =
                user.status === "Active" &&
                user.lastSeen &&
                typeof user.lastSeen.toMillis === "function" &&
                (Date.now() - user.lastSeen.toMillis() < 30000);

            // =============================
            // PROFILE IMAGE
            // =============================

            const rawImage =
                user.photoURL ||
                user.profileImage ||
                "../images/default-user.png";

            // =============================
            // CLOUDINARY THUMBNAIL
            // =============================

            const image =
                rawImage.includes("res.cloudinary.com")
                    ? rawImage.replace(
                        "/upload/",
                        "/upload/w_100,h_100,c_fill,q_auto,f_auto/"
                    )
                    : rawImage;

            html += `
                <tr>

                    <td>
                        <img
                            src="${image}"
                            class="userPhoto"
                            width="34"
                            height="34"
                            loading="lazy"
                            decoding="async"
                            onerror="this.src='../images/default-user.png'"
                            alt="Profile">
                    </td>

                    <td>
                        ${user.name || "-"}
                    </td>

                    <td>
                        ${user.email || "-"}
                    </td>

                    <td>
                        <span class="roleBadge">
                            ${user.role || "User"}
                        </span>
                    </td>

                    <td>

                        ${
                            isOnline
                            ? `
                                <span class="activeBadge">
                                    <span class="statusDot"></span>
                                    Active
                                </span>
                            `
                            : `
                                <span class="inactiveBadge">
                                    <span class="statusDot offline"></span>
                                    Offline
                                </span>
                            `
                        }

                    </td>

                    <td>

                        <button
                            class="editBtn"
                            onclick="editUser('${user.id}')"
                            title="Edit">

                            <i class="fas fa-edit"></i>

                        </button>

                        <button
                            class="deleteBtn"
                            onclick="deleteUser('${user.id}')"
                            title="Delete">

                            <i class="fas fa-trash"></i>

                        </button>

                    </td>

                </tr>
            `;
        });

        usersTable.innerHTML = html;

    }, 50);

}

    async function deleteUser(uid) {

    const result = await Swal.fire({

        title: "Delete Account?",

        text: "This action cannot be undone.",

        icon: "warning",

        showCancelButton: true,

        confirmButtonText: "Delete",

        cancelButtonText: "Cancel",

        confirmButtonColor: "#dc2626"

    });

    if (!result.isConfirmed) return;

    const user = allUsers.find(u => u.id === uid);

    // Protect Super Admin
    if (user?.role === "Super Admin") {

        Swal.fire({
            icon: "warning",
            title: "Protected Account",
            text: "Super Admin account cannot be deleted."
        });

        return;

    }

    // Verify current Super Admin password
    

const verified = await verifySuperAdmin();

if (!verified) return;


    try {

        const res = await fetch(
            `http://localhost:3000/delete-user/${uid}`,
            {
                method: "DELETE"
            }
        );

        const data = await res.json();

        if (data.success) {

            Swal.fire({

                icon: "success",

                title: "Deleted",

                text: "Account deleted successfully."

            });


        } else {

            Swal.fire({

                icon: "error",

                title: "Delete Failed",

                text: data.error

            });

        }

    } catch (err) {

        console.error(err);

        Swal.fire({

            icon: "error",

            title: "Error",

            text: err.message

        });

    }

};


async function editUser(id) {

    const user = allUsers.find(u => u.id === id);

    if (!user) {
        Swal.fire({
            icon: "error",
            title: "User Not Found"
        });
        return;
    }

    // Protect Super Admin accounts
    if (user.role === "Super Admin") {

        Swal.fire({
            icon: "warning",
            title: "Protected Account",
            text: "Super Admin account cannot be edited."
        });

        return;
    }

    // Verify currently logged-in Super Admin
    const verified = await verifySuperAdmin();

    if (!verified) {
        return;
    }

    window.location.href =
        `register.html?id=${encodeURIComponent(id)}`;
}

// =============================
// WAIT FOR FIREBASE AUTH
// =============================

onAuthStateChanged(auth, (user) => {

    if (!user) {

        console.log("No logged-in user.");

        window.location.href = "login.html";

        return;
    }

    console.log(
        "Authenticated User:",
        user.email
    );

    loadUsers();

});

const savedTheme = localStorage.getItem("themeMode");

if(savedTheme === "dark"){
    document.body.classList.add("dark-mode");
}

window.editUser = editUser;
window.deleteUser = deleteUser;