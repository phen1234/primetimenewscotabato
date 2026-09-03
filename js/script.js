import { db } from "./firebase.js"; 
import { getVideoId } from "./youtube.js"; 
import { collection, doc, getDoc, getDocs, query, where, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js"; 
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js"; 

async function loadNews() { 
  const container = document.getElementById("newsContainer"); 
  if(!container) return; 
  container.innerHTML = "<p style='color:#fff; text-align:center;'>Loading...</p>"; 
  try {
    const q = query( collection(db, "news"), orderBy("createdAt", "desc"), limit(8) ); 
    const snapshot = await getDocs(q); 
    container.innerHTML = ""; 
    
    if(snapshot.empty){
      container.innerHTML = "<p style='color:#fff;'>No news yet.</p>";
      return;
    }

    snapshot.forEach(doc => { 
      const news = doc.data(); 
      const catClass = news.category ? news.category.toLowerCase().replace(/\s+/g, '-') : 'general';
      container.innerHTML += ` 
        <a href="article.html?id=${doc.id}" class="news-card">
          <img src="${news.featuredImage || 'images/news1.jpg'}" alt="${news.headline}">
          <div class="news-content">
            <span class="news-badge ${catClass}">${news.category || 'News'}</span>
            <h3>${news.headline}</h3>
            <p class="news-time"><i class="far fa-clock"></i> ${timeAgo(news.createdAt)}</p>
          </div>
        </a> 
      `; 
    }); 
  } catch(err){
    console.error("Load News Error:", err);
    container.innerHTML = "<p style='color:red;'>Error loading news.</p>";
  }
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
      const catClass = news.category ? news.category.toLowerCase().replace(/\s+/g, '-') : 'general';
      container.innerHTML += ` 
        <li> 
          <a href="article.html?id=${doc.id}">
            <img src="${news.featuredImage || 'images/news1.jpg'}" alt="${news.headline}" loading="lazy">
            <div class="most-read-content"> 
              <span class="news-badge ${catClass}">${news.category || "News"}</span> 
              <h4>${news.headline || ""}</h4> 
              <p class="most-read-views"><i class="fas fa-eye"></i> ${news.views || 0} VIEWS</p>
            </div>
          </a>
          <button class="bookmark-btn"><i class="far fa-bookmark"></i></button>
        </li> 
      `; 
    }); 
    if (snapshot.empty) { 
      container.innerHTML = "<li>No most-read news yet.</li>"; 
    } 
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
        <iframe src="https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0" title="${escapeHtml(title)}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"> 
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
  if (!videoDocId) { 
    return; 
  } 
  try { 
    const videoRef = doc(db, "videos", videoDocId); 
    const videoSnap = await getDoc(videoRef); 
    if (!videoSnap.exists()) { 
      console.error("Video document not found:", videoDocId); 
      return; 
    } 
    const video = videoSnap.data(); 
    const youtubeId = video.videoId || getVideoId(video.youtube); 
    if (!youtubeId) { 
      console.error("YouTube Video ID not found:", video); 
      return; 
    } 
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

// ===================== // TIME AGO FUNCTION // =====================
function timeAgo(timestamp) {
  if(!timestamp) return "Just now";
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const seconds = Math.floor((new Date() - date) / 1000);
  
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " years ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " months ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " days ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " hours ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " minutes ago";
  return "Just now";
}

// ===================== // MOBILE MENU // =====================
const menu = document.querySelector(".menu-toggle"); 
const links = document.querySelector(".nav-links"); 
if (menu && links) { 
  menu.addEventListener("click", (e) => { 
    e.stopPropagation(); 
    links.classList.toggle("active"); 
  }); 
  links.querySelectorAll("a").forEach(link => { 
    link.addEventListener("click", () => { 
      links.classList.remove("active"); 
    }); 
  }); 
  document.addEventListener("click", (e) => { 
    if (links.classList.contains("active") && !links.contains(e.target) && !menu.contains(e.target)) { 
      links.classList.remove("active"); 
    } 
  }); 
} 

// ===================== // CLOCK // =====================
function updateClock(){ 
  const now = new Date(); 
  const clock = document.getElementById("clock"); 
  const today = document.getElementById("today"); 
  if(clock) clock.innerHTML = now.toLocaleTimeString(); 
  if(today) today.innerHTML = now.toDateString(); 
} 
setInterval(updateClock,1000); 
updateClock(); 

// ========================== // LOGIN / LOG OUT STATE // ==========================
const auth = getAuth(); 
function updateLoginButton(user) { 
  const desktopAuthLink = document.getElementById("desktopAuthLink"); 
  const desktopAuthText = document.getElementById("desktopAuthText"); 
  const mobileAuthLink = document.getElementById("mobileAuthLink"); 
  const mobileAuthText = document.getElementById("mobileAuthText"); 
  const mobileAuthIcon = document.getElementById("mobileAuthIcon"); 
  if (user) { 
    if (desktopAuthLink) { 
      desktopAuthLink.href = "#"; 
      desktopAuthText.textContent = "Log Out"; 
      desktopAuthLink.onclick = async (e) => { 
        e.preventDefault(); 
        await signOut(auth); 
        window.location.href = "index.html"; 
      }; 
    } 
    if (mobileAuthLink) { 
      mobileAuthLink.href = "#"; 
      mobileAuthText.textContent = "Log Out"; 
      mobileAuthIcon.textContent = "↪"; 
      mobileAuthLink.onclick = async (e) => { 
        e.preventDefault(); 
        await signOut(auth); 
        window.location.href = "index.html"; 
      }; 
    } 
  } else { 
    if (desktopAuthLink) { 
      desktopAuthLink.href = "admin/login.html"; 
      desktopAuthText.textContent = "Login"; 
      desktopAuthLink.onclick = null; 
    } 
    if (mobileAuthLink) { 
      mobileAuthLink.href = "admin/login.html"; 
      mobileAuthText.textContent = "Login"; 
      mobileAuthIcon.textContent = "🔐"; 
      mobileAuthLink.onclick = null; 
    } 
  } 
} 

onAuthStateChanged(auth, (user) => { 
  console.log("Current Firebase User:", user ? user.uid : "NOT LOGGED IN"); 
  updateLoginButton(user); 
});










// ========================= LOAD LOCAL NEWS SLIDER =========================
async function loadLocalNews() {
  const track = document.getElementById("localNewsTrack");
  if(!track) return;

  try {
    const q = query(
      collection(db, "news"),
      where("category", "==", "Local News"),
      where("status", "==", "published"),
      orderBy("createdAt", "desc"),
      limit(8)
    );
    const snapshot = await getDocs(q);
    
    if(snapshot.empty){
      track.innerHTML = "<p style='color:#888; text-align:center; width:100%;'>No local news yet</p>";
      return;
    }

    track.innerHTML = "";
    snapshot.forEach(docSnap => {
      const news = docSnap.data();
      const image = news.featuredImage || DEFAULT_IMAGE;
      const headline = news.headline || news.title || "Local News";
      
      track.innerHTML += `
        <a href="article.html?id=${docSnap.id}" class="local-card">
          <img src="${image}" alt="${headline}" onerror="this.src='${DEFAULT_IMAGE}'">
          <h4>${headline}</h4>
        </a>
      `;
    });

    // SLIDER LOGIC
    const prev = document.querySelector(".local-prev");
    const next = document.querySelector(".local-next");

    if(next && prev){
      next.addEventListener("click", () => {
        track.scrollBy({left: 280, behavior: "smooth"});
      });
      prev.addEventListener("click", () => {
        track.scrollBy({left: -280, behavior: "smooth"});
      });
    }

    console.log("✅ LOCAL NEWS LOADED:", snapshot.size);

  } catch(err){
    console.error("Local News Error:", err);
    track.innerHTML = `<p style='color:red; text-align:center; width:100%;'>Error: ${err.message}</p>`;
  }
}

// TAWAGIN MO TO PAG LOAD
document.addEventListener("DOMContentLoaded", loadLocalNews);
