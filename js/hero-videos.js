let currentIndex = 0;
let videoArray = [];
let tickerInterval;

async function loadVideos() {
  const q = query( collection(db, "videos"), orderBy("createdAt", "desc"), limit(6) );
  const snapshot = await getDocs(q);
  heroVideos.innerHTML = "";

  if(snapshot.empty){
    heroVideos.innerHTML = "<p style='color:#888; text-align:center; padding:20px;'>No videos yet.</p>";
    return;
  }

  videoArray = [];
  snapshot.forEach((docSnap) => {
    videoArray.push({id: docSnap.id,...docSnap.data()});
  });

  // HINDI NA DUDUPLICATE. ISA-ISA LANG
  videoArray.forEach((video, index) => {
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
        <div class="play-btn"><i class="fas fa-play"></i></div>
      </div>
      <div class="video-info">
        <span class="video-category">${video.category || ""}</span>
        <h4>${video.title || ""}</h4>
        <small><i class="fas fa-calendar"></i> ${date}</small>
      </div> `;

    heroVideos.appendChild(div);
  });

  // START TICKER
  showVideo(0);
  tickerInterval = setInterval(nextVideo, 4000); // 4s bawat video
}

function showVideo(index){
  const items = heroVideos.querySelectorAll('.video-item');
  items.forEach(item => item.classList.remove('active', 'exit'));
  items[index].classList.add('active');
}

function nextVideo(){
  const items = heroVideos.querySelectorAll('.video-item');
  if(items.length <= 1) return;

  items[currentIndex].classList.add('exit'); // Paalis yung luma pataas

  currentIndex = (currentIndex + 1) % items.length; // Next

  setTimeout(() => {
    showVideo(currentIndex); // Pasok yung bago galing ilalim
  }, 800);
}
