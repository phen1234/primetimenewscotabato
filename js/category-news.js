import { db } from "./firebase.js";
import { collection, getDocs, query, where, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js"; // DAGDAG NATIN SI QUERY

// ===============================
// PAGE INFO
// ===============================
const page = document.body.dataset.page;
const pageTitle = document.getElementById("pageTitle");
const pageSubtitle = document.getElementById("pageSubtitle");
const pageInfo = {
  local: { title: "Local News", subtitle: "Primetime News Cotabato", category: "Local News" },
  police: { title: "Police Report", subtitle: "Primetime News Cotabato", category: "Police Report" },
  political: { title: "Political News", subtitle: "Primetime News Cotabato", category: "Political News" },
  weather: { title: "Weather Update", subtitle: "Primetime News Cotabato", category: "Weather" },
  national: { title: "National News", subtitle: "Primetime News Cotabato", category: "National News" },
  international: { title: "International News", subtitle: "Primetime News Cotabato", category: "International News" }
};

// ===============================
// CHECK PAGE
// ===============================
const currentPage = pageInfo[page];
if (!currentPage) { console.error("❌ Unknown category page:", page); }

// ===============================
// PAGE TITLE
// ===============================
if (pageTitle && currentPage) { pageTitle.textContent = currentPage.title; }
if (pageSubtitle && currentPage) { pageSubtitle.textContent = currentPage.subtitle; }
if (currentPage) { document.title = `${currentPage.title} | Primetime News Cotabato`; }

// ===============================
// CURRENT CATEGORY
// ===============================
const CURRENT_CATEGORY = currentPage?.category || "";

// ===============================
// ELEMENTS
// ===============================
const featuredContent = document.getElementById("featuredContent");
const contentList = document.getElementById("contentList");
const sidebarContent = document.getElementById("sidebarContent");
const searchInput = document.getElementById("searchInput") || document.querySelector(".search-box input");

// IMPORTANT: DAGDAG NATIN TO PARA SA ARTICLE PAGE
const relatedNewsList = document.getElementById("relatedNewsList");

let newsData = [];

// ===============================
// NORMALIZE TEXT
// ===============================
function normalizeCategory(value) {
  return String(value || "").trim().toLowerCase().replace(/\s+/g, " ");
}

// ===============================
// FORMAT DATE
// ===============================
function formatDate(timestamp) {
  if (!timestamp?.seconds) return "";
  return new Date(timestamp.seconds * 1000).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric"
  });
}

// ===============================
// LOAD NEWS - CATEGORY PAGE
// ===============================
async function loadNews() {
  console.log("🔥 CATEGORY NEWS LOADING");
  if (featuredContent) { featuredContent.innerHTML = `<p>Loading...</p>`; }
  if (contentList) { contentList.innerHTML = ""; }
  if (sidebarContent) { sidebarContent.innerHTML = ""; }

  try {
    const snapshot = await getDocs(collection(db, "news"));
    newsData = [];

    snapshot.forEach(docSnap => {
      const news = docSnap.data();
      const status = String(news.status || "").trim().toLowerCase();
      const savedCategory = normalizeCategory(news.category);
      const targetCategory = normalizeCategory(CURRENT_CATEGORY);

      if (status!== "published") return;
      if (savedCategory!== targetCategory) return;

      newsData.push({ id: docSnap.id,...news });
    });

    newsData.sort((a, b) => {
      const A = a.publishedAt?.seconds || a.createdAt?.seconds || 0;
      const B = b.publishedAt?.seconds || b.createdAt?.seconds || 0;
      return B - A;
    });

    if (newsData.length === 0) {
      if (featuredContent) {
        featuredContent.innerHTML = `<div class="no-news"><h2>No ${currentPage.title} Found</h2></div>`;
      }
      return;
    }

    renderFeaturedNews(newsData[0]);
    renderNewsList(newsData.slice(1));
    renderMostRead(newsData);

  } catch (err) {
    console.error("❌ CATEGORY NEWS ERROR:", err);
  }
}

// ===============================
// LOAD RELATED NEWS - PARA SA ARTICLE PAGE
// ===============================
async function loadRelatedNews(currentId, category) {
  if(!relatedNewsList) return; // WALA TO SA CATEGORY PAGE

  try {
    const q = query(
      collection(db, "news"),
      where("category", "==", category),
      where("status", "==", "published"),
      orderBy("publishedAt", "desc"),
      limit(4)
    );
    const snap = await getDocs(q);

    const related = snap.docs
     .map(doc => ({id: doc.id,...doc.data()}))
     .filter(item => item.id!== currentId) // TANGGALIN YUNG CURRENT
     .slice(0, 3);

    if(related.length === 0){
      relatedNewsList.innerHTML = '<p>No related news found.</p>';
      return;
    }

    relatedNewsList.innerHTML = related.map(item => `
      <a href="article.html?id=${item.id}" style="text-decoration:none; color:inherit;">
        <div class="related-news-card">
          <img src="${item.featuredImage || 'images/news1.jpg'}" alt="${item.headline}">
          <div class="related-news-content">
            <h4>${item.headline}</h4>
            <small><i class="fas fa-calendar"></i> ${formatDate(item.publishedAt)}</small>
          </div>
        </div>
      </a>
    `).join('');

  } catch(error) {
    console.error("Error loading related news:", error);
  }
}

// ===============================
// FEATURED NEWS
// ===============================
function renderFeaturedNews(news) {
  if (!featuredContent) { return; }
  const image = news.featuredImage || "images/news1.jpg";
  const headline = news.headline || "Primetime News";
  const category = news.category || CURRENT_CATEGORY;
  const summary = news.summary || "";
  const publishedDate = formatDate(news.publishedAt);
  const author = news.author || "Primetime News Cotabato";
  const views = news.views || 0;

  featuredContent.innerHTML = `
    <div class="featured-news" data-id="${news.id}">
      <img src="${image}" class="featured-image" alt="${headline}">
      <div class="featured-overlay">
        <span class="badge">${category}</span>
        <div class="news-meta">
          <span><i class="fas fa-calendar-alt"></i> ${publishedDate}</span>
          <span><i class="fas fa-user"></i> ${author}</span>
          <span><i class="fas fa-eye"></i> ${views} Views</span>
        </div>
        <h2>${headline}</h2>
        <p>${summary}</p>
        <button class="read-btn" data-id="${news.id}" type="button">Read Full Story</button>
      </div>
    </div>
  `;
}

// ===============================
// NEWS LIST
// ===============================
function renderNewsList(newsList) {
  if (!contentList) { return; }
  if (!newsList.length) { contentList.innerHTML = ""; return; }

  let html = "";
  newsList.forEach(news => {
    const image = news.featuredImage || "images/news1.jpg";
    const headline = news.headline || "Primetime News";
    const summary = news.summary || "";
    const category = news.category || CURRENT_CATEGORY;
    const views = news.views || 0;
    html += `
      <div class="news-card" data-id="${news.id}">
        <img src="${image}" alt="${headline}" loading="lazy">
        <div class="news-info">
          <span class="badge">${category}</span>
          <h3>${headline}</h3>
          <p>${summary}</p>
          <div class="news-meta"><span><i class="fas fa-eye"></i> ${views} Views</span></div>
        </div>
      </div>
    `;
  });
  contentList.innerHTML = html;
}

// ===============================
// MOST READ
// ===============================
function renderMostRead(newsList) {
  if (!sidebarContent) { return; }
  let html = `<div class="most-read-title">🔥 Most Read</div>`;
  newsList.slice(0, 5).forEach(news => {
    const image = news.featuredImage || "images/news1.jpg";
    const headline = news.headline || "News";
    const category = news.category || "";
    const views = news.views || 0;
    html += `
      <a href="article.html?id=${news.id}" class="most-read-item" data-id="${news.id}">
        <img src="${image}" alt="${headline}" loading="lazy">
        <div class="most-read-content">
          <span class="badge">${category}</span>
          <h4>${headline}</h4>
          <small><i class="fas fa-eye"></i> ${views} Views</small>
        </div>
      </a>
    `;
  });
  sidebarContent.innerHTML = html;
}

// ===============================
// NEWS CLICK HANDLER
// ===============================
document.addEventListener("click", (e) => {
  const btn = e.target.closest(".read-btn");
  const card = e.target.closest(".news-card");
  const mostRead = e.target.closest(".most-read-item");
  const target = btn || card || mostRead;
  if (!target) { return; }
  const id = target.dataset.id;
  if (!id) { return; }
  window.location.href = `article.html?id=${id}`;
});

// ===============================
// SEARCH
// ===============================
if (searchInput) {
  searchInput.addEventListener("input", () => {
    const keyword = searchInput.value.toLowerCase().trim();
    if (!keyword) {
      renderFeaturedNews(newsData[0]);
      renderNewsList(newsData.slice(1));
      renderMostRead(newsData);
      return;
    }
    const filtered = newsData.filter(news => {
      const headline = String(news.headline || "").toLowerCase();
      const summary = String(news.summary || "").toLowerCase();
      return (headline.includes(keyword) || summary.includes(keyword));
    });
    if (filtered.length > 0) {
      renderFeaturedNews(filtered[0]);
      renderNewsList(filtered.slice(1));
      renderMostRead(filtered);
    }
  });
}

// ===============================
// START
// ===============================
console.log("🔥 CATEGORY-NEWS.JS LOADED");
if(page){ // KUNG CATEGORY PAGE
  loadNews();
}

// IMPORTANT: ITO ANG TATAWAGIN MO SA article.js MO
// Pag nasa article.html ka, tawagin mo to after mo maload yung article
// Example: loadRelatedNews(articleId, articleData.category);
window.loadRelatedNews = loadRelatedNews; // GINAWANG GLOBAL PARA MATAWAG SA ARTICLE.JS
