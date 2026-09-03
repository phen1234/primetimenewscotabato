console.log("🔥 HERO.JS LOADED");
import { db } from "./firebase.js";
import { collection, getDocs, query, where, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

const heroSlider = document.getElementById("heroSlider");
const heroDots = document.getElementById("heroDots");
const next = document.querySelector(".next");
const prev = document.querySelector(".prev");
const DEFAULT_IMAGE = "https://res.cloudinary.com/ufx7karu/image/upload/v1787537790/primetime-news/n4eboj0okjvljwwrqloc.png";

let slides = [];
let dots = [];
let currentSlide = 0;

// =========================
// LOAD HERO SLIDER
// =========================
async function loadHeroSlider() {
  if (!heroSlider ||!heroDots) {
    console.error("❌ Hero elements not found.");
    return;
  }
  heroSlider.innerHTML = "";
  heroDots.innerHTML = "";

  try {
    let snapshot;
    try {
      const pinnedQuery = query( collection(db, "news"), where("pinned", "==", true), orderBy("createdAt", "desc"), limit(5) );
      snapshot = await getDocs(pinnedQuery);
    } catch (error) {
      console.warn( "Pinned query failed. Loading latest news.", error );
      const latestQuery = query( collection(db, "news"), orderBy("createdAt", "desc"), limit(5) );
      snapshot = await getDocs(latestQuery);
    }

    let newsList = [];
    snapshot.forEach(docSnap => {
      const news = docSnap.data();
      if ( news.status && news.status!== "published" ) {
        return;
      }
      newsList.push({ id: docSnap.id,...news });
    });

    if (!newsList.length) {
      heroSlider.innerHTML = `
        <div class="slide active">
          <img src="${DEFAULT_IMAGE}" alt="PrimeTime News" >
          <div class="overlay">
            <span>NO NEWS</span>
            <h1> No news available. </h1>
          </div>
        </div>
      `;
      return;
    }

    // =========================
    // CREATE SLIDES - TEXT LANG BINAGO
    // =========================
    newsList.forEach((news, index) => {
      const image = news.featuredImage || DEFAULT_IMAGE;
      const headline = news.headline || news.title || "PrimeTime News";
      const category = news.category || "News";
      const summary = news.summary || "";

      heroSlider.innerHTML += `
        <div class="slide ${index === 0? "active" : ""}">
          <a href="article.html?id=${news.id}">
            <img src="${image}" alt="${headline.replace(/"/g, "&quot;")}" onerror=" this.onerror=null; this.src='${DEFAULT_IMAGE}'; " >
          </a>
          <div class="overlay">
            <span class="hero-category"> ${category} </span>
            <h1 style="font-size:14px;font-weight:800;line-height:1.3;color:#fff;text-transform:uppercase;text-shadow:2px 2px 6px rgba(0,0,0,0.9);margin:0 0 8px 0;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;text-overflow:ellipsis;"> ${headline} </h1>
            <p style="font-size:11px;line-height:1.4;color:#eee;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;margin-bottom:10px;"> ${summary} </p>
            <a href="article.html?id=${news.id}" class="hero-btn" > Read Full Story <i class="fas fa-arrow-right"></i> </a>
          </div>
        </div>
      `;
      heroDots.innerHTML += ` <span class="dot ${index === 0? "active" : ""}" data-index="${index}"> </span> `;
    });

    // =========================
    // REFRESH ELEMENTS - AYAN MAY SPACE
    // =========================
    slides = document.querySelectorAll("#heroSlider.slide");
    dots = document.querySelectorAll("#heroDots.dot");
    currentSlide = 0;

    // DOT CLICK
    dots.forEach((dot, index) => {
      dot.addEventListener("click", () => {
        currentSlide = index;
        showSlide(currentSlide);
      });
    });

    console.log( "✅ HERO NEWS LOADED:", slides.length );
  } catch (err) {
    console.error( "❌ Hero Slider Error:", err );
  }
}

// =========================
// SHOW SLIDE
// =========================
function showSlide(index) {
  if (!slides.length) {
    return;
  }
  slides.forEach(slide => {
    slide.classList.remove("active");
  });
  dots.forEach(dot => {
    dot.classList.remove("active");
  });
  slides[index].classList.add("active");
  if (dots[index]) {
    dots[index].classList.add("active");
  }
}

// =========================
// NEXT
// =========================
function nextSlide() {
  if (slides.length <= 1) {
    return;
  }
  currentSlide++;
  if (currentSlide >= slides.length) {
    currentSlide = 0;
  }
  showSlide(currentSlide);
}

// =========================
// PREVIOUS
// =========================
function prevSlide() {
  if (slides.length <= 1) {
    return;
  }
  currentSlide--;
  if (currentSlide < 0) {
    currentSlide = slides.length - 1;
  }
  showSlide(currentSlide);
}

// =========================
// BUTTONS
// =========================
if (next) {
  next.addEventListener( "click", nextSlide );
}
if (prev) {
  prev.addEventListener( "click", prevSlide );
}

// =========================
// AUTO SLIDE
// =========================
setInterval(() => {
  nextSlide();
}, 5000);

// =========================
// LOAD
// =========================
loadHeroSlider();
