import { db } from "./firebase.js"; 
import { collection, getDocs, query, orderBy, limit, doc, updateDoc, increment } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js"; 

const heroVideos = document.getElementById("heroVideos"); 
const modal = document.getElementById("videoModal"); 
const frame = document.getElementById("videoFrame"); 
const videoTitle = document.getElementById("videoTitle"); 
const videoDescription = document.getElementById("videoDescription"); 
const videoCategory = document.getElementById("videoCategory"); 

async function loadVideos() { 
  const q = query( collection(db, "videos"), orderBy("createdAt", "desc"), limit(6) ); 
  const snapshot = await getDocs(q); 
  heroVideos.innerHTML = ""; 
  
  if(snapshot.empty){
    heroVideos.innerHTML = "<p style='color:#888; text-align:center; padding:20px;'>No videos yet.</p>";
    return;
  }

  const videos = []; 
  snapshot.forEach((docSnap) => { 
    videos.push({id: docSnap.id, ...docSnap.data()}); 
  }); 

  const makeVideoHTML = (video, docId) => { 
    let date = ""; 
    if (video.createdAt && video.createdAt.seconds) { 
      date = new Date(video.createdAt.seconds * 1000).toLocaleDateString(); 
    } 
    return ` 
      <div class="video-item" data-video="${video.videoId}" data-docid="${docId}" data-title="${video.title || ""}" data-category="${video.category || ""}" data-description="${video.description || ""}"> 
        <div class="thumb-wrapper"> 
          <img src="${video.thumbnail || 'images/news1.jpg'}" class="video-thumb" alt="${video.title}"> 
          <div class="play-btn"><i class="fas fa-play"></i></div> 
        </div> 
        <div class="video-info"> 
          <span class="video-category">${video.category || ""}</span> 
          <h4>${video.title || ""}</h4> 
          <small><i class="fas fa-calendar"></i> ${date}</small> 
        </div> 
      </div> `; 
  }; 

  // GUMAWA NG 2X PARA SEAMLESS LOOP
  let html = ""; 
  videos.forEach(v => html += makeVideoHTML(v, v.id)); 
  videos.forEach(v => html += makeVideoHTML(v, v.id)); // duplicate 
  heroVideos.innerHTML = html; 
  
  // ================== ITO YUNG DAGDAG PARA LUMABAS ==================
  const allItems = heroVideos.querySelectorAll('.video-item');
  allItems.forEach((item, index) => {
    setTimeout(() => {
      item.classList.add('show-video');
    }, 100 + index * 120); // 120ms delay bawat isa = slide up effect
  });
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
