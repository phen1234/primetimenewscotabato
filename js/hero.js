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
    // PINNED NEWS FIRST
    try {
      const pinnedQuery = query( collection(db, "news"), where("pinned", "==", true), orderBy("createdAt", "desc"), limit(5) );
      snapshot = await getDocs(pinnedQuery);
    } catch (error) {
      console.warn( "Pinned query failed. Loading latest news.", error );
      // FALLBACK
      const latestQuery = query( collection(db, "news"), orderBy("createdAt", "desc"), limit(5) );
      snapshot = await getDocs(latestQuery);
    }

    // CONVERT TO ARRAY
    let newsList = [];
    snapshot.forEach(docSnap => {
      const news = docSnap.data();
      // Only published news
      if ( news.status && news.status!== "published" ) {
        return;
      }
      newsList.push({ id: docSnap.id,...news });
    });

    // NO NEWS
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
    // CREATE SLIDES - DITO LANG BINAGO
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
            <h1 class="hero-title" style="font-size:14px!important; font-weight:800!important; line-height:1.3!important; color:#fff!important; text-transform:uppercase!important; text-shadow:2px 2px 6px rgba(0,0,0,0.9)!important; margin:0 0 8px 0!important; display:-webkit-box!important; -webkit-line-clamp:3!important; -webkit-box-orient:vertical!important; overflow:hidden!important; text-overflow:ellipsis!important;"> ${headline} </h1>
            <p class="hero-summary" style="font-size:11px!important; line-height:1.4!important; color:#eee!important; display:-webkit-box!important; -webkit-line-clamp:2!important; -webkit-box-orient:vertical!important; overflow:hidden!important; margin-bottom:10px!important;"> ${summary} </p>
            <a href="article.html?id=${news.id}" class="hero-btn" > Read Full Story <i class="fas fa-arrow-right"></i> </a>
          </div>
        </div>
      `;

      heroDots.innerHTML += ` <span class="dot ${index === 0? "active" : ""}" data-index="${index}"> </span> `;
    });

    // REFRESH ELEMENTS
    slides = document.querySelectorAll( "#heroSlider.slide" );
    dots = document.querySelectorAll( "#heroDots.dot" );
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
