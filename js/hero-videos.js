import { db } from "./firebase.js";

import {
    collection,
    getDocs,
    query,
    orderBy,
    limit,
    doc,
    updateDoc,
    increment
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

const heroVideos = document.getElementById("heroVideos");

const modal = document.getElementById("videoModal");
const frame = document.getElementById("videoFrame");

const videoTitle = document.getElementById("videoTitle");
const videoDescription = document.getElementById("videoDescription");
const videoCategory = document.getElementById("videoCategory");

async function loadVideos() {

    const q = query(
        collection(db, "videos"),
        orderBy("createdAt", "desc"),
        limit(3)
    );

    const snapshot = await getDocs(q);

    heroVideos.innerHTML = "";

    snapshot.forEach((doc) => {

        const video = doc.data();

        let date = "";

        if (video.createdAt) {
            date = new Date(video.createdAt.seconds * 1000).toLocaleDateString();
        }

        const div = document.createElement("div");

div.className = "video-item";

div.style.animationDelay = `${heroVideos.children.length * 0.2}s`;
const index = heroVideos.children.length;

div.dataset.video = video.videoId;
div.dataset.docid = doc.id;
div.dataset.title = video.title || "";
div.dataset.category = video.category || "";
div.dataset.description = video.description || "";

div.innerHTML = `

<div class="thumb-wrapper">

    <img
        src="${video.thumbnail}"
        class="video-thumb"
        alt="${video.title}">

    <div class="play-btn">
        <i class="fas fa-play"></i>
    </div>

</div>

<div class="video-info">

    <span class="video-category">
        ${video.category || ""}
    </span>

    <h4>${video.title || ""}</h4>

    <small>
        <i class="fas fa-calendar"></i>
        ${date}
    </small>

</div>
`;

heroVideos.appendChild(div);

observer.observe(div);

    });

}

loadVideos();



const allItems = heroVideos.querySelectorAll('.video-item');
allItems.forEach((item, index) => {
  setTimeout(() => {
    item.classList.add('show-video');
  }, 150 * index); // 150ms delay bawat isa
});






document.addEventListener("click", async (e) => {

    const item = e.target.closest(".video-item");

    if (!item) return;

    const docId = item.dataset.docid;

    const viewedKey = `video_view_${docId}`;

    if (!localStorage.getItem(viewedKey)) {

        await updateDoc(doc(db, "videos", docId), {
            views: increment(1)
        });

        localStorage.setItem(viewedKey, "true");

    }

    frame.src = `https://www.youtube.com/embed/${item.dataset.video}?autoplay=1`;

    videoTitle.textContent = item.dataset.title;
    videoCategory.textContent = item.dataset.category;
    videoDescription.textContent = item.dataset.description;

    modal.style.display = "flex";

});

document.getElementById("closeVideo").onclick = () => {

    modal.style.display = "none";
    frame.src = "";

};

modal.onclick = (e) => {

    if (e.target === modal) {

        modal.style.display = "none";
        frame.src = "";

    }

};

const observer = new IntersectionObserver((entries) => {

    entries.forEach(entry => {

        if(entry.isIntersecting){

            entry.target.classList.add("show-video");

            observer.unobserve(entry.target);

        }

    });

},{
    threshold:0.15
});
