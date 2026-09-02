import { db } from "./firebase.js"; 
import { collection, getDocs, query, orderBy, limit, doc, updateDoc, increment } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js"; 

const heroVideos = document.getElementById("heroVideos"); 
const modal = document.getElementById("videoModal"); 
const frame = document.getElementById("videoFrame"); 
const videoTitle = document.getElementById("videoTitle"); 
const videoDescription = document.getElementById("videoDescription"); 
const videoCategory = document.getElementById("videoCategory"); 

let tickerInterval; 
let autoScroll = true; 

// I-STOP ANG AUTO SCROLL PAG NAG HOVER
heroVideos.parentElement.addEventListener('mouseenter', () => autoScroll = false); 
heroVideos.parentElement.addEventListener('mouseleave', () => autoScroll = true); 

async function loadVideos() { 
  const q = query( collection(db, "videos"), orderBy("createdAt", "desc"), limit(3) ); 
  const snapshot = await getDocs(q); 
  heroVideos.innerHTML = ""; 
  clearInterval(tickerInterval); // STOP LUMANG TICKER
  
  if(snapshot.empty){
    heroVideos.innerHTML = "<p style='color:#888; text-align:center; padding:20px;'>No videos yet.</p>"; 
    return; 
  } 
  
  const videos = []; 
  snapshot.forEach((docSnap) => { videos.push({id: docSnap.id, ...docSnap.data()}); }); 
  
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
    
    // ITO NA YUNG TOTOONG HTML
    div.innerHTML = `
      <div class="thumb-wrapper"> 
        <img src="${video.thumbnail || 'images/news1.jpg'}" class="video-thumb" alt="${video.title}"> 
        <div class="play-btn"> <i class="fas fa-play"></i> </div> 
      </div> 
      <div class="video-info"> 
        <span class="video-category"> ${video.category || "Video"} </span> 
        <h4>${video.title || "No Title"}</h4> 
        <small> <i class="fas fa-calendar"></i> ${date} </small> 
      </div> 
    `;
    
    heroVideos.appendChild(div); 
    
    setTimeout(() => { div.classList.add('show-video'); }, 200 * index); 
  }); 
  
  // AUTO SCROLL
  let currentScroll = 0; 
  const itemHeight = 110; 
  const totalHeight = videos.length * itemHeight; 
  const containerHeight = heroVideos.parentElement.clientHeight; 
  
  tickerInterval = setInterval(() => { 
  if(!autoScroll || videos.length <= 3) return; // DATING <= 1, GINAWA KONG <= 3
  currentScroll += itemHeight; 
  if(currentScroll >= totalHeight - containerHeight + itemHeight){ currentScroll = 0; } 
  heroVideos.parentElement.scrollTo({ top: currentScroll, behavior: 'smooth' }); 
}, 4000);
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
