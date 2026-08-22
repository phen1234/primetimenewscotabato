import { db } from "./firebase.js";

import {
    collection,
    addDoc,
    getDoc,
    getDocs,
    deleteDoc,
    updateDoc,
    doc,
    serverTimestamp,
    query,
    where
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

import { loadTheme } from "./theme.js";

loadTheme();


// ======================================
// LOAD WEBSITE SETTINGS
// ======================================

async function loadWebsiteSettings() {

    try {

        const ref =
            doc(db, "settings", "website");

        const snap =
            await getDoc(ref);

        if (!snap.exists()) {

            console.log(
                "Website settings not found."
            );

            return;
        }

        const data = snap.data();


        // ==================================
        // WEBSITE NAME
        // ==================================

        const siteName =
            document.getElementById("siteName");

        if (siteName) {

            siteName.textContent =
                data.websiteName ||
                "Primetime News Cotabato";

        }


        // ==================================
        // WEBSITE LOGO
        // ==================================

        const websiteLogo =
            document.getElementById("websiteLogo");

        if (
            websiteLogo &&
            data.websiteLogo
        ) {

            websiteLogo.src =
                data.websiteLogo;

        }


        // ==================================
        // BROWSER TITLE
        // ==================================

        document.title =
            data.websiteName ||
            "Primetime News Cotabato";


    } catch (error) {

        console.error(
            "Failed to load website settings:",
            error
        );

    }

}


loadWebsiteSettings();


// ===========================
// ELEMENTS
// ===========================

const table = document.getElementById("categoryTable");

const modal = document.getElementById("categoryModal");

const addBtn = document.getElementById("addCategoryBtn");

const closeBtn = document.getElementById("closeModal");

const saveBtn = document.getElementById("saveCategory");

const updateBtn = document.getElementById("updateCategory");

const searchInput = document.getElementById("searchCategory");

const nameInput = document.getElementById("categoryName");

const slugInput = document.getElementById("categorySlug");

const iconInput = document.getElementById("categoryIcon");

const colorInput = document.getElementById("categoryColor");

const statusInput = document.getElementById("categoryStatus");

let editingId = null;

// ===========================
// OPEN / CLOSE MODAL
// ===========================

addBtn.onclick = () => {

    modal.style.display = "flex";

};

closeBtn.onclick = () => {

    closeModal();

};

window.onclick = (e) => {

    if (e.target === modal) {

        closeModal();

    }

};

function closeModal() {

    modal.style.display = "none";

    editingId = null;

    saveBtn.style.display = "inline-block";

    updateBtn.style.display = "none";

    nameInput.value = "";
    slugInput.value = "";

}

// ===========================
// AUTO SLUG
// ===========================

nameInput.addEventListener("input", () => {

    slugInput.value = nameInput.value
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "-")
        .replace(/[^\w-]/g, "");

});

// ===========================
// SAVE CATEGORY
// ===========================

saveBtn.onclick = async () => {

    try {

        if (!nameInput.value.trim()) {

            Swal.fire(
                "Warning",
                "Category name is required.",
                "warning"
            );

            return;

        }

        await addDoc(collection(db, "categories"), {

            name: nameInput.value.trim(),

            slug: slugInput.value,

            icon: iconInput.value,

            color: colorInput.value,

            status: statusInput.value,

            createdAt: serverTimestamp()

        });

        Swal.fire(
            "Success",
            "Category Added Successfully",
            "success"
        );

        closeModal();

        loadCategories();

    }

    catch(err){

        console.error(err);

        Swal.fire(
            "Error",
            err.message,
            "error"
        );

    }

};

// ===========================
// UPDATE CATEGORY
// ===========================

updateBtn.onclick = async () => {

    try {

        await updateDoc(doc(db,"categories",editingId),{

            name:nameInput.value.trim(),

            slug:slugInput.value,

            icon:iconInput.value,

            color:colorInput.value,

            status:statusInput.value

        });

        Swal.fire(
            "Success",
            "Category Updated",
            "success"
        );

        closeModal();

        loadCategories();

    }

    catch(err){

        console.error(err);

    }

};

// ===========================
// LOAD CATEGORY
// ===========================

async function loadCategories(){

    table.innerHTML = "";

    const snapshot = await getDocs(collection(db,"categories"));

    let no = 1;

    for(const item of snapshot.docs){

        const data = item.data();

        let created = "-";

        if(data.createdAt){

            created = new Date(
                data.createdAt.seconds * 1000
            ).toLocaleDateString();

        }

        const newsQuery = query(

            collection(db,"news"),

            where("category","==",data.name)

        );

        const newsSnap = await getDocs(newsQuery);

        const articleCount = newsSnap.size;

        table.innerHTML += `

<tr>

<td>${no++}</td>

<td style="font-size:22px;">
${data.icon}
</td>

<td>${data.name}</td>

<td>${data.slug}</td>

<td>${articleCount}</td>

<td>${created}</td>

<td>

<span class="${
data.status=="Active"
? "status-active"
: "status-hidden"
}">
${data.status}
</span>

</td>

<td>

<button
class="action-btn edit-btn"
data-id="${item.id}">

<i class="fas fa-edit"></i>

</button>

<button
class="action-btn delete-btn"
data-id="${item.id}">

<i class="fas fa-trash"></i>

</button>

</td>

</tr>

`;

    }

    bindEdit();

    bindDelete();

}

// ===========================
// EDIT
// ===========================

function bindEdit() {

    document.querySelectorAll(".edit-btn").forEach(btn => {

        btn.onclick = async () => {

            editingId = btn.dataset.id;

            const categoryRef = doc(db, "categories", editingId);

            const snapshot = await getDocs(collection(db, "categories"));

            snapshot.forEach(item => {

                if (item.id === editingId) {

                    const data = item.data();

                    nameInput.value = data.name;
                    slugInput.value = data.slug;
                    iconInput.value = data.icon;
                    colorInput.value = data.color;
                    statusInput.value = data.status;

                }

            });

            saveBtn.style.display = "none";
            updateBtn.style.display = "inline-block";

            modal.style.display = "flex";

        };

    });

}

// ===========================
// DELETE
// ===========================

function bindDelete() {

    document.querySelectorAll(".delete-btn").forEach(btn => {

        btn.onclick = async () => {

            const id = btn.dataset.id;

            const result = await Swal.fire({

                title: "Delete Category?",

                text: "This action cannot be undone.",

                icon: "warning",

                showCancelButton: true,

                confirmButtonText: "Delete"

            });

            if (!result.isConfirmed) return;

            await deleteDoc(doc(db, "categories", id));

            Swal.fire(
                "Deleted!",
                "Category deleted successfully.",
                "success"
            );

            loadCategories();

        };

    });

}

// ===========================
// SEARCH
// ===========================

searchInput.addEventListener("keyup", () => {

    const keyword = searchInput.value.toLowerCase();

    document.querySelectorAll("#categoryTable tr").forEach(row => {

        row.style.display =
            row.innerText.toLowerCase().includes(keyword)
                ? ""
                : "none";

    });

});

// ===========================
// START
// ===========================

loadCategories();

// ==========================
// SIDEBAR NAVIGATION
// ==========================

document.getElementById("dashboardBtn")?.addEventListener("click", () => {
    window.location.href = "dashboard.html";
});

document.getElementById("usersBtn")?.addEventListener("click", () => {
    window.location.href = "users.html";
});

document.getElementById("settingsBtn")?.addEventListener("click", () => {
    window.location.href = "settings.html";
});

document.getElementById("logoutBtn")?.addEventListener("click", () => {

    Swal.fire({
        title: "Logout?",
        text: "Are you sure you want to logout?",
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Logout"
    }).then((result) => {

        if (result.isConfirmed) {

            localStorage.removeItem("admin");

            window.location.href = "../index.html";

        }

    });

});

const savedTheme = localStorage.getItem("themeMode");

if(savedTheme === "dark"){
    document.body.classList.add("dark-mode");
}