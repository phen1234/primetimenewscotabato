import { db } from "./firebase.js"; 
import { getVideoId } from "./youtube.js"; 
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js"; 

const videosGrid = document.getElementById("videosGrid"); 
const videoFilters = document.getElementById("videoFilters"); 
let allVideos = []; 
let activeCategory = "All"; 

/* ========================================= HELPERS ========================================= */ 
function normalize(value) { 
  return String(value || "") .trim() .toLowerCase() .replace(/\s+/g, " "); 
} 

function getId(video) { 
  if (video.videoId) { return String(video.videoId).trim(); } 
  const url = video.youtube || video.youtubeUrl || video.videoUrl || video.url || ""; 
  if (!url) return null; 
  try { return getVideoId(url); } 
  catch (error) { console.error("Unable to get YouTube ID:", error); return null; } 
} 

function getCategory(video) { 
  return ( video.category || video.categoryName || video.newsCategory || video.type || "" ); 
} 

function getTitle(video) { 
  return ( video.title || video.headline || video.name || "Latest Video" ); 
} 

function getDescription(video) {
  return ( video.description || video.content || video.script || "" );
}

function getDate(video) { 
  if (video.date) { return video.date; } 
  if (video.createdAt?.toDate) { return video.createdAt.toDate().toLocaleDateString(); } 
  if (video.createdAt?.seconds) { return new Date( video.createdAt.seconds * 1000 ).toLocaleDateString(); } 
  return ""; 
} 

function escapeHtml(value) { 
  const div = document.createElement("div"); 
  div.textContent = String(value ?? ""); 
  return div.innerHTML; 
} 

/* ========================================= YOUTUBE PLAYER MODAL ========================================= */ 
function createVideoPlayer(id, title, description) { 
  const existing = document.getElementById("youtubeVideoModal"); 
  if (existing) { existing.remove(); } 

  // ITAGO YUNG CATEGORY MENU
  const categoryBar = document.querySelector('.video-category-bar');
  const categoryToggle = document.getElementById('videoCategoryToggle');
  if(categoryBar) categoryBar.style.display = 'none';
  if(categoryToggle) categoryToggle.style.display = 'none';
  
  const modal = document.createElement("div"); 
  modal.id = "youtubeVideoModal"; 
  modal.innerHTML = ` 
    <div class="youtube-modal-overlay"> 
      <div class="youtube-modal" role="dialog" aria-modal="true" aria-label="${escapeHtml(title)}" > 
        <button type="button" class="youtube-modal-close" id="youtubeModalClose" aria-label="Close video" > 
          <i class="fas fa-xmark"></i> 
        </button> 
        <div class="youtube-player-wrapper"> 
          <iframe src="https://www.youtube.com/embed/${encodeURIComponent(id)}?autoplay=1&rel=0" title="${escapeHtml(title)}" frameborder="0" allow=" accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share " allowfullscreen> </iframe> 
        </div> 
        <div class="youtube-modal-content"> 
          <div class="youtube-modal-title"> ${escapeHtml(title)} </div> 
          <div class="youtube-modal-description"> ${description ? escapeHtml(description) : 'Walang description na available.'} </div>
        </div>
      </div> 
    </div> 
  `; 
  
  document.body.appendChild(modal); 

  const closeButton = document.getElementById("youtubeModalClose"); 
  function closePlayer() { 
    modal.remove(); 
    if(categoryBar) categoryBar.style.display = '';
    if(categoryToggle) categoryToggle.style.display = '';
    document.removeEventListener( "keydown", handleKeydown ); 
  } 
  
  function handleKeydown(event) { 
    if (event.key === "Escape") { closePlayer(); } 
  } 
  
  if (closeButton) { closeButton.addEventListener( "click", closePlayer ); } 
  
  const overlay = modal.querySelector(".youtube-modal-overlay"); 
  if (overlay) { 
    overlay.addEventListener( "click", function (event) { 
      if (event.target === overlay) { closePlayer(); } 
    } ); 
  } 
  document.addEventListener( "keydown", handleKeydown ); 
} 

/* ========================================= VIDEO PLAYER + GRID CSS ========================================= */ 
function addVideoPlayerStyles() { 
  if ( document.getElementById( "youtubeVideoModalStyles" ) ) { return; } 
  
  const style = document.createElement("style"); 
  style.id = "youtubeVideoModalStyles"; 
  style.textContent = ` 
    /* VIDEO GRID */
    #videosGrid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 20px;
      padding: 20px;
    }
    .video-card {
      background: #1f2937;
      border-radius: 8px;
      overflow: hidden;
      cursor: pointer;
      transition: transform 0.2s;
    }
    .video-card:hover { transform: translateY(-4px); }
    .video-thumbnail { position: relative; aspect-ratio: 16/9; }
    .video-thumbnail img { width: 100%; height: 100%; object-fit: cover; }
    .video-play { 
      position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
      width: 60px; height: 60px; background: rgba(224, 0, 0, .9); border-radius: 50%;
      display: flex; align-items: center; justify-content: center; color: #fff; font-size: 24px;
    }
    .video-content { padding: 12px; }
    .video-category { 
      display: inline-block; background: #e00000; color: #fff; padding: 3px 8px;
      border-radius: 4px; font-size: 11px; margin-bottom: 8px;
    }
    .video-content h3 { color: #fff; font-size: 14px; margin: 0 0 8px 0; line-height: 1.4; }
    .video-meta { color: #9ca3af; font-size: 12px; }
    .no-videos { text-align: center; color: #9ca3af; padding: 40px 20px; grid-column: 1/-1; }

    /* YOUTUBE MODAL */
    #youtubeVideoModal { position: fixed; inset: 0; z-index: 999; }
    .youtube-modal-overlay { 
      position: fixed; inset: 0; display: flex; flex-direction: column;
      align-items: stretch; justify-content: flex-start; background: rgba(0, 0, 0, .95); padding: 0; 
    }
    .youtube-modal { 
      position: relative; width: 100%; height: auto; max-height: 100%;
      background: #000; display: flex; flex-direction: column; overflow: hidden; margin: 0; 
    }
    .youtube-modal-close { 
      position: absolute; top: 15px; right: 15px; z-index: 20; 
      width: 40px; height: 40px; border: none; border-radius: 50%; 
      background: rgba(0, 0, 0, .7); color: #fff; font-size: 18px; cursor: pointer; 
    }
    .youtube-player-wrapper { position: relative; width: 100%; aspect-ratio: 16 / 9; background: #000; flex-shrink: 0; }
    .youtube-player-wrapper iframe { position: absolute; inset: 0; width: 100%; height: 100%; border: 0; }
    .youtube-modal-content { max-height: 60vh; overflow-y: auto; background: #111827; }
    .youtube-modal-title { padding: 15px; color: #fff; font-family: "Poppins", sans-serif; font-size: 16px; font-weight: 600; border-bottom: 1px solid #1f2937; }
    .youtube-modal-description { padding: 15px; color: #d1d5db; font-size: 14px; line-height: 1.7; white-space: pre-line; }
    
    
    @media (max-width: 768px) { 
    #videosGrid { 
    grid-template-columns: 1fr; 
    padding: 15px; 
  } 
  
  .youtube-modal-content { 
    max-height: 55vh; /* DATING 35vh, GINAWANG 55vh */
    padding-bottom: 100px; /* PARA DI PUTOL YUNG HULING LINYA */
  } 
  
  .youtube-modal-close { 
    width: 35px; 
    height: 35px; 
    top: 10px; 
    right: 10px; 
  } 
}
  `; 
  document.head.appendChild(style); 
} 

/* ========================================= RENDER VIDEOS ========================================= */ 
function renderVideos() { 
  if (!videosGrid) return; 
  const filtered = activeCategory === "All" ? allVideos : allVideos.filter(video => normalize(getCategory(video)) === normalize(activeCategory) ); 
  videosGrid.innerHTML = ""; 
  if (!filtered.length) { 
    videosGrid.innerHTML = `<div class="no-videos"><i class="fas fa-video-slash"></i><p>No videos available</p></div>`; 
    return; 
  } 
  filtered.forEach(video => { 
    const id = getId(video); 
    if (!id) return; 
    const title = getTitle(video); 
    const category = getCategory(video); 
    const date = getDate(video); 
    const description = getDescription(video);
    const card = document.createElement("div"); 
    card.className = "video-card"; 
    card.innerHTML = ` 
      <div class="video-thumbnail"> 
        <img src="https://img.youtube.com/vi/${encodeURIComponent(id)}/hqdefault.jpg" alt="${escapeHtml(title)}" loading="lazy" > 
        <span class="video-play"><i class="fas fa-play"></i></span> 
      </div> 
      <div class="video-content"> 
        ${ category ? `<span class="video-category">${escapeHtml(category)}</span>` : "" } 
        <h3>${escapeHtml(title)}</h3> 
        ${ date ? `<div class="video-meta"><i class="far fa-calendar"></i> ${escapeHtml(date)}</div>` : "" } 
      </div> 
    `; 
    card.addEventListener( "click", function () { createVideoPlayer( id, title, description ); } ); 
    videosGrid.appendChild(card); 
  }); 
} 

/* ========================================= LOAD VIDEOS ========================================= */ 
async function loadVideos() { 
  if (!videosGrid) return; 
  videosGrid.innerHTML = `<p style="text-align:center; color:#9ca3af; padding:40px;">Loading videos...</p>`; 
  try { 
    const snapshot = await getDocs( collection( db, "videos" ) ); 
    allVideos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })); 
    allVideos.sort( (a, b) => { 
      const time = video => { 
        if ( video.createdAt?.seconds ) { return ( video.createdAt.seconds * 1000 ); } 
        if ( video.createdAt?.toDate ) { return ( video.createdAt.toDate().getTime() ); } 
        if (video.date) { const parsed = new Date( video.date ).getTime(); return Number.isNaN( parsed ) ? 0 : parsed; } 
        return 0; 
      }; 
      return time(b) - time(a); 
    } ); 
    renderVideos(); 
  } catch (error) { 
    console.error( "Videos page error:", error ); 
    videosGrid.innerHTML = `<div class="no-videos"><i class="fas fa-circle-exclamation"></i><p>Unable to load videos</p></div>`; 
  } 
} 

/* ========================================= CATEGORY FILTER ========================================= */ 
if (videoFilters) { 
  videoFilters.addEventListener( "click", function (event) { 
    const button = event.target.closest( ".video-filter" ); 
    if (!button) return; 
    activeCategory = button.dataset.category || "All"; 
    videoFilters.querySelectorAll( ".video-filter" ).forEach( item => item.classList.remove("active") ); 
    button.classList.add( "active" ); 
    if (selectedVideoCategory) { selectedVideoCategory.textContent = activeCategory; } 
    renderVideos(); 
  } ); 
} 

/* ========================================= INITIALIZE ========================================= */ 
addVideoPlayerStyles(); 
loadVideos();
