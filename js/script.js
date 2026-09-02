import { db } from "./firebase.js"; 
import { getVideoId } from "./youtube.js"; 
import { collection, doc, getDoc, getDocs, query, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js"; 
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js"; 

// TANGGALIN MO NA TO. NASA HTML NA YUNG LOADER
// const status = document.getElementById("loaderStatus");
// const bar = document.getElementById("loaderBar");
// const pageLoader = document.getElementById("pageLoader");
// const loadingSiteName = document.getElementById("loadingSiteName");
// startLoader(); 

async function loadNews() { 
  const container = document.getElementById("newsContainer"); 
  if(!container) return;
  container.innerHTML = "<p>Loading...</p>"; 
  const q = query( collection(db, "news"), orderBy("createdAt", "desc"), limit(8) ); 
  const snapshot = await getDocs(q); 
  container.innerHTML = ""; 
  snapshot.forEach(doc => { 
    const news = doc.data(); 
    container.innerHTML += ` 
      <a href="article.html?id=${doc.id}" class="news-link"> 
        <article class="news-card"> 
          <img src="${news.featuredImage}" alt=""> 
          <div class="news-card-content"> 
            <span>${news.category}</span> 
            <h3>${news.headline}</h3> 
            <p>${news.summary}</p> 
          </div> 
        </article> 
      </a> `; 
  }); 
} 
loadNews(); 

async function loadMostRead() { 
  const container = document.getElementById("mostReadList"); 
  if (!container) return; 
  try { 
    const q = query( collection(db, "news"), orderBy("views", "desc"), limit(5) ); 
    const snapshot = await getDocs(q); 
    container.innerHTML = ""; 
    snapshot.forEach(doc => { 
      const news = doc.data(); 
      container.innerHTML += ` 
        <li> 
          <a href="article.html?id=${doc.id}"> 
            <img src="${news.featuredImage || 'images/news1.jpg'}" alt="${news.headline || 'News'}" loading="lazy"> 
            <div class="most-read-content"> 
              <span class="category">${news.category || ""}</span> 
              <h4>${news.headline || ""}</h4> 
              <small><i class="fas fa-eye"></i> ${news.views || 0} Views</small> 
            </div> 
          </a> 
        </li> `; 
    }); 
    if (snapshot.empty) { container.innerHTML = "<li>No most-read news yet.</li>"; } 
  } catch (error) { 
    console.error("Failed to load Most Read:", error); 
    container.innerHTML = "<li>Unable to load Most Read.</li>"; 
  } 
} 
loadMostRead(); 

// ========================== // VIDEO MODAL FUNCTION // ==========================
function openActivityVideoModal(youtubeId, title) {
  const modal = document.createElement("div");
  modal.id = "activityVideoModal";
  modal.innerHTML = `
    <div class="activity-video-overlay">
      <button class="activity-video-close" aria-label="Close video">&times;</button>
      <div class="activity-video-container">
        <iframe 
          src="https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0" 
          title="${escapeHtml(title)}" 
          frameborder="0" 
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowfullscreen 
          referrerpolicy="strict-origin-when-cross-origin">
        </iframe>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  modal.querySelector(".activity-video-close").addEventListener("click", () => {
    modal.remove();
    removeVideoParameter();
  });

  modal.querySelector(".activity-video-overlay").addEventListener("click", (e) => {
    if (e.target.classList.contains("activity-video-overlay")) {
      modal.remove();
      removeVideoParameter();
    }
  });

  document.addEventListener("keydown", function closeWithEscape(e) {
    if (e.key === "Escape") {
      modal.remove();
      removeVideoParameter();
      document.removeEventListener("keydown", closeWithEscape);
    }
  });
}

// ========================== // OPEN VIDEO FROM RECENT ACTIVITY // ==========================
async function openVideoFromActivity() { 
  const params = new URLSearchParams(window.location.search); 
  const videoDocId = params.get("video"); 
  if (!videoDocId) { return; } 
  try { 
    const videoRef = doc(db, "videos", videoDocId); 
    const videoSnap = await getDoc(videoRef); 
    if (!videoSnap.exists()) { console.error("Video document not found:", videoDocId); return; } 
    const video = videoSnap.data(); 
    const youtubeId = video.videoId || getVideoId(video.youtube); 
    if (!youtubeId) { console.error("YouTube Video ID not found:", video); return; } 
    openActivityVideoModal(youtubeId, video.title || video.headline || "Video"); 
  } catch (error) { 
    console.error("Open Activity Video Error:", error); 
  } 
} 
openVideoFromActivity(); 

function removeVideoParameter() { 
  const url = new URL(window.location.href); 
  url.searchParams.delete("video"); 
  window.history.replaceState({}, document.title, url.pathname + url.search); 
} 

function escapeHtml(value) { 
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;"); 
}

// MOBILE MENU + CLOCK + AUTH CODE MO DITO... OKAY NA YAN
