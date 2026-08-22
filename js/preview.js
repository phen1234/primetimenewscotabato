import { db } from "./firebase.js";

import {
    collection,
    addDoc,
    serverTimestamp,
    updateDoc,
    doc
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";


const CLOUD_NAME = "ufx7karu";
const UPLOAD_PRESET = "Primetime-News-Cotabato";



async function uploadBase64(base64Image) {

    const formData = new FormData();

    formData.append("file", base64Image);

    formData.append("upload_preset", UPLOAD_PRESET);

    const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        {
            method: "POST",
            body: formData
        }
    );

    if (!response.ok) {

        throw new Error("Cloudinary upload failed");

    }

    const data = await response.json();

    return data.secure_url;

}

// ======================================
// PRIMETIME NEWS PREVIEW
// ======================================

const article = JSON.parse(sessionStorage.getItem("previewArticle"));
console.log("ARTICLE ID:", article.id);
document.getElementById("authorName").textContent =
    article.author || "Unknown Author";

console.log(article.featuredImage);
console.log(article.images);

if (!article) {
    document.body.innerHTML = `
        <div style="
            text-align:center;
            margin-top:100px;
            font-family:Arial;
        ">
            <h1>No Preview Data Found</h1>
            <p>Please create an article first.</p>
        </div>
    `;
    throw new Error("No preview data");
}

if (article.id) {

    document.getElementById("publishBtn").innerHTML = `
        <i class="fas fa-pen"></i>
        Update News
    `;

}

// ==========================
// BASIC INFO
// ==========================

document.getElementById("headline").textContent =
    article.headline || "Untitled News";

document.getElementById("category").textContent =
    article.category || "";

document.getElementById("summary").textContent =
    article.summary || "";

document.getElementById("content").innerHTML =
    article.content || "";

document.getElementById("publishDate").textContent =
    article.publishDate || "Today";

document.getElementById("readingTime").textContent =
    article.readingTime || "0 min";

document.getElementById("wordCount").textContent =
    article.wordCount || "0";

// ==========================
// FEATURED IMAGE
// ==========================

const featured = document.getElementById("featuredImage");

if (article.featuredImage) {

    featured.src = article.featuredImage;

} else {

    featured.style.display = "none";

}

// ==========================
// YOUTUBE
// ==========================

const youtubeContainer =
    document.getElementById("youtubeContainer");

if (article.youtube) {

    let embed = article.youtube;

    if (embed.includes("watch?v=")) {

        embed = embed.replace("watch?v=", "embed/");

    }

    youtubeContainer.innerHTML = `
        <iframe
            src="${embed}"
            allowfullscreen>
        </iframe>
    `;

}

// ==========================
// GALLERY
// ==========================

const gallery = document.getElementById("gallery");

let images = article.images ? [...article.images] : [];

renderGallery();

function renderGallery() {

    gallery.innerHTML = "";

    images.forEach((image, index) => {

        const card = document.createElement("div");
        card.className = "galleryItem";

        card.innerHTML = `
            <input
                type="checkbox"
                class="imageCheckbox"
                data-index="${index}">

            <button
                class="deleteImageBtn"
                data-index="${index}">

                <i class="fas fa-trash"></i>

            </button>

            <img src="${image}">
        `;

        gallery.appendChild(card);

    });

}

// ==========================
// DELETE SINGLE IMAGE
// ==========================

gallery.addEventListener("click", (e) => {

    const btn = e.target.closest(".deleteImageBtn");

    if (!btn) return;

    const index = Number(btn.dataset.index);

    images.splice(index, 1);

    article.images = images;

    // Kung nabura ang featured image
    if (images.length === 0) {
        article.featuredImage = null;
        featured.style.display = "none";
    } else {
        article.featuredImage = images[0];
        featured.src = images[0];
        featured.style.display = "block";
    }

    sessionStorage.setItem(
        "previewArticle",
        JSON.stringify(article)
    );

    renderGallery();

});

// ==========================
// DELETE SELECTED
// ==========================

document.getElementById("deleteSelectedBtn")
.addEventListener("click", () => {

    const checked = document.querySelectorAll(".imageCheckbox:checked");

    if (checked.length === 0) {
        alert("Please select image(s) first.");
        return;
    }

    const indexes = [...checked]
        .map(c => Number(c.dataset.index))
        .sort((a, b) => b - a);

    indexes.forEach(i => images.splice(i, 1));

    article.images = images;

    if (images.length === 0) {
        article.featuredImage = null;
        featured.style.display = "none";
    } else {
        article.featuredImage = images[0];
        featured.src = images[0];
        featured.style.display = "block";
    }

    sessionStorage.setItem(
        "previewArticle",
        JSON.stringify(article)
    );

    renderGallery();

});

// ==========================
// BACK
// ==========================

document.getElementById("backBtn").addEventListener("click", () => {

    window.close();

});

document.getElementById("publishBtn").addEventListener("click", async () => {

    try {

        const uploadedImages = [];

        for (const image of article.images) {

            if (image.startsWith("data:image")) {

                const url = await uploadBase64(image);

                uploadedImages.push(url);

            } else {

                uploadedImages.push(image);

            }

        }

        const featuredImage = article.featuredImage.startsWith("data:image")
            ? uploadedImages[article.images.indexOf(article.featuredImage)]
            : article.featuredImage;

       const newsData = {

    headline: article.headline,

    summary: article.summary,

    content: article.content,

    category: article.category,

    author: article.author,

    featuredImage: featuredImage,

    gallery: uploadedImages,

    slug: article.headline
        .toLowerCase()
        .replace(/[^\w ]+/g, "")
        .replace(/\s+/g, "-"),

    status: "published"

};

if(article.id){

    newsData.updatedAt = serverTimestamp();

    await updateDoc(
        doc(db,"news",article.id),
        newsData
    );

    alert("✅ News updated successfully!");

}else{

    newsData.views = 0;

    newsData.createdAt = serverTimestamp();

    await addDoc(
        collection(db,"news"),
        newsData
    );

    alert("✅ News published successfully!");

}

sessionStorage.removeItem("previewArticle");

window.close();

    } catch (err) {

    console.error("Publish Error:", err);

    alert(err.message);

}

});