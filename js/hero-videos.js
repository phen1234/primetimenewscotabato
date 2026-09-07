import { db } from "./firebase.js";
import { collection, getDocs, query, orderBy, doc, updateDoc, increment } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

const heroVideos = document.getElementById("heroVideos");
const modal = document.getElementById("videoModal");
const frame = document.getElementById("videoFrame");
const videoTitle = document.getElementById("videoTitle");
const videoDescription = document.getElementById("videoDescription");
const videoCategory = document.getElementById("videoCategory");

let tickerInterval;
let autoScroll = true;

// PAUSE PAG HOVER
heroVideos.parentElement.addEventListener('mouseenter', () => autoScroll = false);
heroVideos.parentElement.addEventListener('mouseleave', () => autoScroll = true);

async function loadVideos() {
    const q = query( collection(db, "videos"), orderBy("createdAt", "desc") );
    const snapshot = await getDocs(q);
    heroVideos.innerHTML = "";
    clearInterval(tickerInterval);

    if(snapshot.empty){
        heroVideos.innerHTML = "<p style='color:#888; text-align:center; padding:20px;'>No videos yet.</p>";
        return;
    }

    const videos = [];
    snapshot.forEach((docSnap) => {
        videos.push({id: docSnap.id, ...docSnap.data()});
    });

    videos.forEach((video, index) => {
        let date = "";
        if (video.createdAt && video.createdAt.seconds) {
            date = new Date(video.createdAt.seconds * 1000).toLocaleDateString();
        }

        const div = document.createElement("div");
        div.className = "video-item";
        div.dataset.video = video.videoId;
        div.dataset.docid = video.id;
        div.dataset.title = video.title || "";
        div.dataset.category = video.category || "";
        div.dataset.description = video.description || "";

        div.innerHTML = `
            <div class="thumb-wrapper">
                <img src="${video.thumbnail || 'images/news1.jpg'}" class="video-thumb" alt="${video.title}">
                <div class="play-btn">
                    <i class="fas fa-play"></i>
                </div>
            </div>
            <div class="video-info">
                <span class="video-category"> ${video.category || "Video"} </span>
                <h4>${video.title || "No Title"}</h4>
                <small> <i class="fas fa-calendar"></i> ${date} </small>
            </div>
        `;
        heroVideos.appendChild(div);

        setTimeout(() => {
            div.classList.add('show-video');
        }, 200 * index);
    });

    // MAGHINTAY MUNA BAGO MAG SCROLL
    setTimeout(() => {
        startTicker();
    }, 500);
}

function startTicker() {
    const container = document.getElementById('heroVideos');
    const itemHeight = 126; // 114px height + 12px margin
    const containerHeight = 504; // 126 x 4 = 4 VIDEOS KITA
    const scrollHeight = container.scrollHeight;

    if(scrollHeight <= containerHeight) return;

    let currentScroll = 0;
    clearInterval(tickerInterval); // para di mag doble

    tickerInterval = setInterval(() => {
        if(!autoScroll) return;
        currentScroll += itemHeight; // aakyat ng 1 video

        if(currentScroll >= scrollHeight - containerHeight){
            currentScroll = 0; // pag dulo na, balik sa taas
        }

        container.scrollTo({
            top: currentScroll,
            behavior: 'smooth'
        });
    }, 3500); // 3.5 SECONDS BAGO MAG SLIDE
}

loadVideos();

document.addEventListener("click", async (e) => {
    const item = e.target.closest(".video-item");
    if (!item) return;

    const docId = item.dataset.docid;
    const viewedKey = `video_view_${docId}`;

    if (!localStorage.getItem(viewedKey)) {
        await updateDoc(doc(db, "videos", docId), { views: increment(1) });
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

// TOGGLE DARK / LIGHT MODE
const themeToggle = document.querySelector('.theme-toggle');
if(themeToggle){
    if(localStorage.getItem('theme') === 'light'){
        document.body.classList.add('light-mode');
        themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    }
    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('light-mode');
        if(document.body.classList.contains('light-mode')){
            localStorage.setItem('theme', 'light');
            themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        } else {
            localStorage.setItem('theme', 'dark');
            themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
        }
    });
}
