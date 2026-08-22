import { db } from "./firebase.js";

import {
    collection,
    getDocs,
    query,
    orderBy,
    where
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";


// ===============================
// ELEMENTS
// ===============================

const featuredContent =
document.getElementById("featuredContent");

const contentList =
document.getElementById("contentList");

const sidebarContent =
document.getElementById("sidebarContent");

const sectionTitle =
document.getElementById("sectionTitle");

const newsTab =
document.getElementById("newsTab");

const videoTab =
document.getElementById("videoTab");

const searchInput =
document.getElementById("searchInput");

const categoryButtons =
document.querySelectorAll(".category-menu button");


// ===============================
// GLOBAL DATA
// ===============================

let newsData = [];
let videoData = [];

let currentCategory = "All";

let currentSearch = "";

// ===============================
// LOAD NEWS
// ===============================

async function loadNews(){

    newsTab.classList.add("active");
    videoTab.classList.remove("active");

    sectionTitle.innerHTML="Latest News";

    featuredContent.innerHTML="Loading...";
    contentList.innerHTML="";
    sidebarContent.innerHTML="";

    try{

        const q = query(

            collection(db,"news"),

            where("status","==","published"),

            orderBy("publishedAt","desc")

        );

        const snapshot = await getDocs(q);

        newsData=[];

        snapshot.forEach(doc=>{

            newsData.push({

                id:doc.id,

                ...doc.data()

            });

        });

        renderFeaturedNews(newsData[0]);

renderNewsList(newsData.slice(1));

renderMostRead(newsData);

    }

    catch(err){

        console.error(err);

    }

}

// ===============================
// LATEST NEWS LIST
// ===============================

function renderNewsList(newsList){

    let html = "";

    newsList.forEach(news=>{

        html += `

<div class="news-card" data-id="${news.id}">

    <img
        src="${news.featuredImage}"
        alt="${news.headline}">

    <div class="news-info">

        <span class="badge">

            ${news.category}

        </span>

        <h3>

            ${news.headline}

        </h3>

        <div class="news-meta">

    <span>
        <i class="fas fa-user"></i>
        ${news.author || "Primetime News Cotabato"}
    </span>

    <span>
        <i class="fas fa-calendar-alt"></i>
        ${
            news.publishedAt?.seconds
            ? new Date(
                news.publishedAt.seconds * 1000
            ).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric"
            })
            : ""
        }
    </span>

    <span>
        <i class="fas fa-eye"></i>
        ${news.views || 0} Views
    </span>

</div>

        <p>

            ${news.summary || ""}

        </p>

    </div>

</div>

`;

    });

    contentList.innerHTML = html;

}

// ===============================
// EVENTS
// ===============================

newsTab.onclick = loadNews;

videoTab.onclick = loadVideos;


// ===============================
// DEFAULT
// ===============================

loadNews();

// ===============================
// LOAD VIDEOS
// ===============================

async function loadVideos(){

    videoTab.classList.add("active");
    newsTab.classList.remove("active");

    sectionTitle.innerHTML = "Latest Videos";

    featuredContent.innerHTML = "Loading...";
    contentList.innerHTML = "";
    sidebarContent.innerHTML = "";

    try{

        const q = query(

            collection(db,"videos"),

            orderBy("createdAt","desc")

        );

        const snapshot = await getDocs(q);

        videoData=[];

        snapshot.forEach(doc=>{

            videoData.push({

                id:doc.id,

                ...doc.data()

            });

        });

        if(videoData.length===0){

            featuredContent.innerHTML = "<h2>No Videos</h2>";

            return;

        }

        renderFeaturedVideo(videoData[0]);

        renderRelatedVideos(videoData.slice(1));

    }

    catch(err){

        console.error(err);

    }

}

// ===============================
// RELATED VIDEOS
// ===============================

function renderRelatedVideos(videoList){

    let html = `

<div class="widget">

<h2>

📺 Related Videos

</h2>

`;

    videoList.slice(0,5).forEach(video=>{

        html += `

<div
class="related-video"

data-video="${video.videoId}"

data-id="${video.id}">

<div class="video-thumb-wrapper">

    <img
        src="${video.thumbnail}"
        alt="${video.title}"
        class="related-thumb">

    <span class="video-duration">

        ${video.duration || ""}

    </span>

    <div class="play-overlay">

        <i class="fas fa-play"></i>

    </div>

</div>

<div class="related-info">

    <span class="badge">

        ${video.category || "Video"}

    </span>

    <h4>

        ${video.title}

    </h4>

    <small>

        <i class="fas fa-calendar-alt"></i>

        ${new Date(video.createdAt?.seconds*1000).toLocaleDateString("en-US",{

            year:"numeric",

            month:"long",

            day:"numeric"

        })}

    </small>

</div>

</div>
`;

    });

    html += `

</div>

`;

    sidebarContent.innerHTML = html;

}

// ===============================
// FEATURED VIDEO
// ===============================

function renderFeaturedVideo(video){

featuredContent.innerHTML = `

<div class="featured-video">

    <div class="video-player">

        <iframe
            src="https://www.youtube.com/embed/${video.videoId}"
            allowfullscreen>
        </iframe>

    </div>

    <div class="video-content">

        <span class="badge">

            ${video.category}

        </span>

        <h1>

            ${video.title}

        </h1>

       <div class="video-meta">

<i class="fas fa-calendar-alt"></i>

Published

${new Date(video.createdAt?.seconds*1000).toLocaleDateString("en-US",{

year:"numeric",

month:"long",

day:"numeric"

})}

</div>

        <p>

            ${video.description || ""}

        </p>

    </div>

</div>

`;

}

// ===============================
// FEATURED NEWS
// ===============================

function renderFeaturedNews(news){

    featuredContent.innerHTML = `

<div class="featured-news">

    <img
        src="${news.featuredImage}"
        class="featured-image"
        alt="${news.headline}">

    <div class="featured-overlay">

        <span class="badge">

            ${news.category}

        </span>

        <div class="news-meta">

        <h2>

            ${news.headline}

        </h2>

        <p>

            ${news.summary || ""}

        </p>

        <button class="read-btn"
            data-id="${news.id}">

            Read Full Story

        </button>

    </div>

</div>

`;

}

// ===============================
// MOST READ
// ===============================

function renderMostRead(newsList){

    let html = `

<div class="widget">

    <h2>🔥 Most Read</h2>

`;

    newsList.slice(0,5).forEach(news=>{

        html += `

<div class="most-read-item" data-id="${news.id}">

    <img
        src="${news.featuredImage}"
        alt="${news.headline}">

    <div>

        <span class="badge">
            ${news.category}
        </span>

        <h4>
            ${news.headline}
        </h4>

       <div class="news-meta">

    <span>
        <i class="fas fa-user"></i>
        ${news.author || "Primetime News Cotabato"}
    </span>

    <span>
        <i class="fas fa-calendar-alt"></i>
        ${
            news.publishedAt?.seconds
            ? new Date(
                news.publishedAt.seconds * 1000
            ).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric"
            })
            : news.createdAt?.seconds
            ? new Date(
                news.createdAt.seconds * 1000
            ).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric"
            })
            : ""
        }
    </span>

    <span>
        <i class="fas fa-eye"></i>
        ${news.views || 0} Views
    </span>

</div>

    </div>

</div>

`;

    });

    html += `

</div>

`;

    sidebarContent.innerHTML = html;

}

document.addEventListener("click",(e)=>{

    const item = e.target.closest(".related-video");

    if(!item) return;

    const id = item.dataset.video;

    const selectedVideo = videoData.find(v => v.videoId === id);

    if(selectedVideo){

        renderFeaturedVideo(selectedVideo);

    }

});

// ===============================
// SEARCH
// ===============================

searchInput.addEventListener("input", () => {

    const keyword = searchInput.value.toLowerCase();

    if(newsTab.classList.contains("active")){

        const filtered = newsData.filter(news =>

            (news.headline || "").toLowerCase().includes(keyword) ||

            (news.summary || "").toLowerCase().includes(keyword) ||

            (news.category || "").toLowerCase().includes(keyword)

        );

        if(filtered.length){

            renderFeaturedNews(filtered[0]);

            renderNewsList(filtered.slice(1));

            renderMostRead(filtered);

        }else{

            featuredContent.innerHTML = "<h2>No Result Found</h2>";

            contentList.innerHTML = "";

            sidebarContent.innerHTML = "";

        }

    }

    else{

        const filtered = videoData.filter(video =>

            (video.title || "").toLowerCase().includes(keyword) ||

            (video.description || "").toLowerCase().includes(keyword) ||

            (video.category || "").toLowerCase().includes(keyword)

        );

        if(filtered.length){

            renderFeaturedVideo(filtered[0]);

            renderRelatedVideos(filtered.slice(1));

        }else{

            featuredContent.innerHTML = "<h2>No Videos Found</h2>";

            sidebarContent.innerHTML = "";

        }

    }

});

// ===============================
// CATEGORY FILTER
// ===============================

categoryButtons.forEach(btn=>{

    btn.addEventListener("click",()=>{

        categoryButtons.forEach(b=>b.classList.remove("active"));

        btn.classList.add("active");

        const category = btn.dataset.category;

        if(newsTab.classList.contains("active")){

            filterNews(category);

        }else{

            filterVideos(category);

        }

    });

});

function filterNews(category){

    if(category==="All"){

        renderFeaturedNews(newsData[0]);

        renderNewsList(newsData.slice(1));

        renderMostRead(newsData);

        return;

    }

    const filtered = newsData.filter(item=>

        item.category===category

    );

    if(filtered.length){

        renderFeaturedNews(filtered[0]);

        renderNewsList(filtered.slice(1));

        renderMostRead(filtered);

    }else{

        featuredContent.innerHTML="<h2>No News Found</h2>";

        contentList.innerHTML="";

        sidebarContent.innerHTML="";

    }

}

function filterVideos(category){

    if(category==="All"){

        renderFeaturedVideo(videoData[0]);

        renderRelatedVideos(videoData.slice(1));

        return;

    }

    const filtered = videoData.filter(item=>

        item.category===category

    );

    if(filtered.length){

        renderFeaturedVideo(filtered[0]);

        renderRelatedVideos(filtered.slice(1));

    }else{

        featuredContent.innerHTML="<h2>No Videos Found</h2>";

        sidebarContent.innerHTML="";

    }

}

// ===============================
// OPEN ARTICLE
// ===============================

document.addEventListener("click", (e) => {

    // Read Full Story button
    const readBtn = e.target.closest(".read-btn");
    if (readBtn) {
        const id = readBtn.dataset.id;
        window.location.href = `article.html?id=${id}`;
        return;
    }

    // News Card
    const newsCard = e.target.closest(".news-card");
    if (newsCard) {
        const id = newsCard.dataset.id;
        window.location.href = `article.html?id=${id}`;
        return;
    }

    // Most Read
    const mostRead = e.target.closest(".most-read-item");
    if (mostRead) {
        const id = mostRead.dataset.id;
        window.location.href = `article.html?id=${id}`;
        return;
    }

});