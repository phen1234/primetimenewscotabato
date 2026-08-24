// ======================================
// ADD NEWS - Primetime CMS
// ======================================

import { auth, db } from "./firebase.js";
import { extractCloudinaryPublicId } from "./cloudinary-delete.js";

import {
    doc,
    getDoc,
    getDocs,
    updateDoc,
    collection,
    addDoc,
    query,
    where,
    orderBy,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

import {
    signOut
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";


// ===========================
// LOGOUT
// ===========================

const logoutBtn =
    document.getElementById("logoutBtn");

if (logoutBtn) {

    logoutBtn.addEventListener("click", async (e) => {

        e.preventDefault();

        try {

            await signOut(auth);

            window.location.href = "login.html";

        } catch (error) {

            console.error(
                "Logout Error:",
                error
            );

            alert("Failed to logout.");

        }

    });

}

let selectedImages = [];
let featuredIndex = 0;

// ===============================
// CURRENT ADMIN / AUTHOR
// ===============================

let currentAuthor = "";

function waitForAuthUser() {
    return new Promise((resolve) => {

        const unsubscribe = auth.onAuthStateChanged(async (user) => {

            unsubscribe();

            if (!user) {
                console.warn("No logged-in user.");
                resolve("");
                return;
            }

            try {

                const userRef = doc(db, "users", user.uid);
                const userSnap = await getDoc(userRef);

                if (userSnap.exists()) {

                    const userData = userSnap.data();

                    currentAuthor =
                        userData.name ||
                        user.displayName ||
                        user.email ||
                        "";

                } else {

                    currentAuthor =
                        user.displayName ||
                        user.email ||
                        "";

                }

                console.log("CURRENT AUTHOR:", currentAuthor);

                resolve(currentAuthor);

            } catch (error) {

                console.error(
                    "Failed to load current author:",
                    error
                );

                resolve("");
            }
        });
    });
}


async function loadCategories() {

    const categorySelect =
        document.getElementById("category");

    if (!categorySelect) {
        console.error("Category select not found.");
        return;
    }

    categorySelect.innerHTML =
        `<option value="">Select Category</option>`;

    try {

        const q = query(
            collection(db, "categories"),
            where("status", "==", "Active")
        );

        const snapshot = await getDocs(q);

        console.log(
            "Categories loaded:",
            snapshot.size
        );

        snapshot.forEach((docSnap) => {

            const data = docSnap.data();

            console.log(
                "Category:",
                data.name,
                "Status:",
                data.status
            );

            const option =
                document.createElement("option");

            option.value =
                (data.name || "").trim();

            option.textContent =
                `${data.icon || ""} ${data.name || ""}`;

            categorySelect.appendChild(option);

        });

    } catch (error) {

        console.error(
            "Load Categories Error:",
            error
        );

    }
}

// ===============================
// IMAGE UPLOADER
// ===============================

const params = new URLSearchParams(window.location.search);
const editId = params.get("id");
console.log("EDIT ID:", editId);
console.log("MODE:", editId ? "UPDATE" : "ADD");
const dropZone = document.getElementById("dropZone");
const imageInput = document.getElementById("imageInput");
const uploadBtn = document.getElementById("uploadBtn");

const galleryPreview = document.getElementById("galleryPreview");
const featuredPreview = document.getElementById("featuredPreview");
const headline = document.getElementById("headline");

const publishBtn = document.getElementById("publishNews");
const loadingOverlay = document.getElementById("loadingOverlay");
const loadingText = document.getElementById("loadingText");

const quill = new Quill("#editor", { theme: "snow" });
if (editId) {

    document.querySelector(".topbar h1").textContent = "Edit News Article";

        if (publishBtn) {
        publishBtn.innerHTML = `
            <i class="fas fa-pen"></i>
            Update News
        `;
    }

}

// ===============================
// LOAD AUTHORS
// ===============================

async function loadAuthors(){

    const select = document.getElementById("author");

    if(!select) return;

    select.innerHTML = "<option value=''>Select Author</option>";

    const snapshot = await getDocs(collection(db,"authors"));

    snapshot.forEach(doc=>{

        const author = doc.data();

        select.innerHTML += `
            <option value="${author.name}">
                ${author.name}
            </option>
        `;

    });

}

// ===============================
// LOAD NEWS FOR EDIT
// ===============================

async function loadNewsForEdit() {

    if (!editId) return;

    const snap = await getDoc(doc(db, "news", editId));

    if (!snap.exists()) return;

    const news = snap.data();

    console.log("NEWS DATA:", news);
    console.log("GALLERY:", news.gallery);
    console.log("FEATURED:", news.featuredImage);

    headline.value = news.headline || "";

    const categorySelect =
    document.getElementById("category");

const savedCategory =
    (news.category || "").trim();

console.log(
    "EDIT CATEGORY FROM NEWS:",
    savedCategory
);

if (categorySelect && savedCategory) {

    const matchingOption =
        [...categorySelect.options].find(
            option =>
                option.value.trim().toLowerCase() ===
                savedCategory.toLowerCase()
        );

    if (matchingOption) {

        categorySelect.value =
            matchingOption.value;

        console.log(
            "EDIT CATEGORY SELECTED:",
            matchingOption.value
        );

    } else {

        console.warn(
            "Category not found in active categories:",
            savedCategory
        );

    }

}
    document.getElementById("author").value = news.author || "";
    document.getElementById("summary").value = news.summary || "";
  
    quill.root.innerHTML = news.content || "";

    // Change page to Edit Mode
document.querySelector(".topbar h1").textContent = "Edit News Article";

document.querySelector(".previewBtn").dataset.mode = "edit";
document.querySelector(".previewBtn").dataset.id = editId;

    // existing images
    if (news.gallery && news.gallery.length) {

    selectedImages = [...news.gallery];

    featuredIndex = selectedImages.findIndex(
        img => img === news.featuredImage
    );

    if (featuredIndex < 0) featuredIndex = 0;

    renderGallery();

}

    document.querySelector(".publishBtn").innerHTML = `
    <i class="fas fa-pen"></i>
    Update News
`;

}

// ===============================
// OPEN FILE PICKER
// ===============================

uploadBtn.addEventListener("click", (e)=>{

    e.stopPropagation();

    imageInput.click();

});

dropZone.addEventListener("click",()=>{

    imageInput.click();

});

// ===============================
// DRAG & DROP
// ===============================

dropZone.addEventListener("dragover",(e)=>{

    e.preventDefault();

    dropZone.classList.add("dragover");

});

dropZone.addEventListener("dragleave",()=>{

    dropZone.classList.remove("dragover");

});

dropZone.addEventListener("drop",(e)=>{

    e.preventDefault();

    dropZone.classList.remove("dragover");

    addImages([...e.dataTransfer.files]);

});

// ===============================
// ===============================
// FILE PICKER
// ===============================

imageInput.addEventListener("change", (e) => {

    addImages([...e.target.files]);

    imageInput.value = "";

});

// ===============================
// ADD IMAGES
// ===============================

function addImages(files){

    const images = files.filter(file =>
        file.type.startsWith("image/")
    );

    selectedImages.push(...images);

    renderGallery();

}



// ===============================
// RENDER GALLERY
// ===============================

function renderGallery() {

    galleryPreview.innerHTML = "";

    if (selectedImages.length === 0) {

        galleryPreview.innerHTML = `
            <div class="emptyGallery">
                <i class="fas fa-images"></i>
                <h3>No images selected</h3>
                <p>Select or drag images here</p>
            </div>
        `;

        featuredPreview.innerHTML = `
            <div class="emptyFeatured">
                <i class="fas fa-image"></i>
                <p>No featured image</p>
            </div>
        `;

        return;
    }

  selectedImages.forEach((file, index) => {

    if(index > 5) return;

    const card = document.createElement("div");
    card.className = "galleryItem";

    const img = document.createElement("img");
    img.src =
    typeof file === "string"
        ? file
        : URL.createObjectURL(file);

    card.appendChild(img);

    // Remove button
    if(index < 5){

        const remove = document.createElement("button");

        remove.className = "removeBtn";

        remove.innerHTML = "✕";

        remove.onclick = (e)=>{

            e.stopPropagation();

            selectedImages.splice(index,1);

            if(featuredIndex >= selectedImages.length){

                featuredIndex = 0;

            }

            renderGallery();

        };

        card.appendChild(remove);

    }

    // Featured
    if(index === featuredIndex){

        const badge = document.createElement("div");

        badge.className = "featuredBadge";

        badge.innerHTML = "⭐";

        card.appendChild(badge);

    }

    // Click = Featured
    card.onclick = ()=>{

        featuredIndex = index;

        renderGallery();

    };

    // Pang-anim = +remaining
    if(index === 5){

        const overlay = document.createElement("span");

        overlay.className = "moreCount";

        overlay.innerHTML = "+" + (selectedImages.length - 5);

        card.appendChild(overlay);

    }

    galleryPreview.appendChild(card);

});
    featuredPreview.innerHTML = "";

    const featured = document.createElement("img");

    featured.src =
    typeof selectedImages[featuredIndex] === "string"
        ? selectedImages[featuredIndex]
        : URL.createObjectURL(selectedImages[featuredIndex]);

    featuredPreview.appendChild(featured);

}

function updatePublishDate() {

    const now = new Date();

    const options = {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit"
    };

    document.getElementById("publishDate").textContent =
        now.toLocaleString("en-PH", options);

}

updatePublishDate();

setInterval(updatePublishDate, 1000);

// ===============================
// CLOUDINARY
// ===============================

const CLOUD_NAME = "ufx7karu";
const UPLOAD_PRESET = "Primetime-News-Cotabato";

async function uploadImage(file){

    const formData = new FormData();

    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);

    try {

        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
            {
                method: "POST",
                body: formData
            }
        );

        if (!response.ok) {
            throw new Error("Upload failed");
        }

        const data = await response.json();

        return data.secure_url;

    } catch (error) {

        console.error("Cloudinary Error:", error);

        showError("Image upload failed.");

        return null;

    }

}

// ===============================
// FILE TO BASE64
// ===============================

function fileToBase64(file) {
    return new Promise((resolve, reject) => {

        const reader = new FileReader();

        reader.onload = () => resolve(reader.result);

        reader.onerror = reject;

        reader.readAsDataURL(file);

    });
}

    // ===============================
// PREVIEW NEWS
// ===============================

document.querySelector(".previewBtn").addEventListener("click", async () => {
    

    const images = [];

    for (const file of selectedImages) {

        if (typeof file === "string") {
            images.push(file);
        } else {
            images.push(await fileToBase64(file));
        }

    }

    // Save draft
    sessionStorage.setItem("draftHeadline", headline.value);
    sessionStorage.setItem("draftSummary", document.getElementById("summary").value);
    sessionStorage.setItem("draftCategory", document.getElementById("category").value);
    sessionStorage.setItem("draftContent", quill.root.innerHTML);
   
    const article = {

          id: editId, 

        headline: headline.value,
        
        author: document.getElementById("author").value,

        category: document.getElementById("category").value,

        summary: document.getElementById("summary").value,


        content: quill.root.innerHTML,

               publishDate: document.getElementById("publishDate").innerText,

        readingTime: document.getElementById("readingTime").textContent,

        wordCount: document.getElementById("wordCount").textContent,

        featuredImage: images.length ? images[featuredIndex] : null,

        images: images

    };

    sessionStorage.setItem(
        "previewArticle",
        JSON.stringify(article)
    );

    if(editId){

    window.open(`preview.html?id=${editId}`,"_blank");

}else{

    window.open("preview.html","_blank");

}

});

// ===============================
// RESTORE DRAFT
// ===============================

window.addEventListener("load", () => {

    const headlineDraft =
        sessionStorage.getItem("draftHeadline");

    if(headlineDraft){

        headline.value = headlineDraft;

    }

    const summaryDraft =
        sessionStorage.getItem("draftSummary");

    if(summaryDraft){

        document.getElementById("summary").value =
            summaryDraft;

    }

    const categoryDraft =
        sessionStorage.getItem("draftCategory");

    if(categoryDraft){

        document.getElementById("category").value =
            categoryDraft;

    }

    const contentDraft =
        sessionStorage.getItem("draftContent");

    if(contentDraft){

        quill.root.innerHTML = contentDraft;

    }

      
});

// ======================================
// PUBLISH NEWS
// ======================================

publishBtn.addEventListener("click", async () => {

    if (!headline.value.trim()) {

        return showError("Please enter a headline.");

    }

    showLoading("Preparing article...");

    try {

        // Upload Gallery
        updateLoading("Uploading images...");

        const imageUrls = [];

        for (const file of selectedImages) {

            if (typeof file === "string") {

                imageUrls.push(file);

            } else {

                const url = await uploadImage(file);

                if (url) imageUrls.push(url);

            }

        }

        updateLoading("Saving article...");

        const finalGallery =
            imageUrls.length ? imageUrls : selectedImages;

        const featuredImage =
            finalGallery.length
                ? finalGallery[featuredIndex]
                : "";

        // Keep the Cloudinary public IDs together with the URLs.
        // This makes server-side deletion reliable even when URLs contain
        // delivery transformations or version segments.
        const galleryPublicIds = finalGallery
            .map(url => extractCloudinaryPublicId(url))
            .filter(Boolean);

        const featuredImagePublicId =
            extractCloudinaryPublicId(featuredImage);

        const newsData = {

    author: editId
        ? document.getElementById("author").value
        : currentAuthor,

    category:
        document.getElementById("category").value,

            headline: headline.value,

            summary: document.getElementById("summary").value,

            content: quill.root.innerHTML,

            featuredImage,

            featuredImagePublicId,

            gallery: finalGallery,

            galleryPublicIds,

            readingTime: document.getElementById("readingTime").textContent,

            wordCount: document.getElementById("wordCount").textContent,

            pinned: document.getElementById("pinNews").checked,

            status: "published"

        };

        if(editId){

            newsData.updatedAt = serverTimestamp();

            await updateDoc(doc(db,"news",editId),newsData);

            showSuccess("News Updated Successfully");

        }else{

            newsData.createdAt = serverTimestamp();

            newsData.publishedAt = serverTimestamp();

            await addDoc(collection(db,"news"),newsData);

            showSuccess("News Published Successfully");

        }

        setTimeout(()=>{

            window.location.href="dashboard.html";

        },1500);

    }

    catch(err){

        console.error(err);

        showError(err.message);

    }

});

function showLoading(text){

    loadingOverlay.style.display = "flex";
    publishBtn.disabled = true;
    loadingText.innerHTML = text;

}

function updateLoading(text){

    loadingText.innerHTML = text;

}

function showSuccess(text){

    loadingText.innerHTML = `
        <i class="fas fa-check-circle successIcon"></i>
        <br><br>
        ${text}
    `;

}

function showError(text){

    loadingOverlay.style.display = "none";
    publishBtn.disabled = false;

    alert(text);

}

// ===============================
// INITIALIZE ADD / EDIT NEWS
// ===============================

async function initializePage() {

    try {

        // 1. Current logged-in admin
        await waitForAuthUser();

        // 2. Categories
        await loadCategories();

        // 3. Authors
        await loadAuthors();

        // 4. Existing news
        // IMPORTANT:
        // Preserve original author when editing.
        if (editId) {
            await loadNewsForEdit();
        }

        // 5. Reading time
        updateReadingTime();

    } catch (error) {

        console.error(
            "Initialization Error:",
            error
        );

    }
}

initializePage();

const savedTheme = localStorage.getItem("themeMode");

if(savedTheme === "dark"){
    document.body.classList.add("dark-mode");
}
