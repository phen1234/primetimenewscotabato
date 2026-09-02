import { db } from "./firebase.js"; 
import { collection, getDocs, query, orderBy, limit, doc, updateDoc, increment } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js"; 

const heroVideos = document.getElementById("heroVideos"); 
const modal = document.getElementById("videoModal"); 
const frame = document.getElementById("videoFrame"); 
const videoTitle = document.getElementById("videoTitle"); 
const videoDescription = document.getElementById("videoDescription"); 
const videoCategory = document.getElementById("videoCategory"); 

async function loadVideos() { 
  const q = query( collection(db, "videos"), orderBy("createdAt", "desc"), limit(6) ); // GINAWANG 6 para mas marami
  const snapshot = await getDocs(q); 
  heroVideos.innerHTML = ""; 
  
  const videos = [];
  snapshot.forEach((doc) => {
    videos.push({id: doc.id, ...doc.data()});
  });

  // FUNCTION PARA GAWIN YUNG HTML
  const makeVideoHTML = (video, docId) => {
    let date = "";
    if (video.createdAt) {
      date = new Date(video.createdAt.seconds * 1000).toLocaleDateString();
    }
    return `
      <div class="video-item" data-video="${video.videoId}" data-docid="${docId}" data-title="${video.title || ""}" data-category="${video.category || ""}" data-description="${video.description || ""}">
        <div class="thumb-wrapper">
          <img src="${video.thumbnail}" class="video-thumb" alt="${video.title}">
          <div class="play-btn"><i class="fas fa-play"></i></div>
        </div>
        <div class="video-info">
          <span class="video-category">${video.category || ""}</span>
          <h4>${video.title || ""}</h4>
          <small><i class="fas fa-calendar"></i> ${date}</small>
        </div>
      </div>
    `;
  };

  // GUMAWA NG 2X PARA SEAMLESS LOOP
  let html = "";
  videos.forEach(v => html += makeVideoHTML(v, v.id));
  videos.forEach(v => html += makeVideoHTML(v, v.id)); // duplicate
  heroVideos.innerHTML = html;
} 

loadVideos(); 

// ========================= CLICK TO OPEN MODAL =========================
document.addEventListener("click", async (e) => { 
  const item = e.target.closest(".video-item"); 
  if (!item) return; 
  const docId = item.dataset.docid; 
  const viewedKey = `video_view_${docId}`; 
  if (!localStorage.getItem(viewedKey)) { 
    await updateDoc(doc(db, "videos", docId), { views: increment(1) }); 
    localStorage.setItem(viewedKey, "true"); 
  } 
  frame.src = `https://www.youtube.com/embed/${item.dataset.video}?autoplay=1&mute=0`; 
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
