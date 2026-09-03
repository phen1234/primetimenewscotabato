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
let autoSlideInterval;

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
      console.warn("Pinned query failed. Loading latest news.", error );
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
      heroSlider.innerHTML = `<div class="slide active"><img src="${DEFAULT_IMAGE}" alt="PrimeTime News"><div class="overlay"><h1>No news available.</h1></div></div>`;
      return;
    }

    // CREATE SLIDES
    newsList.forEach((news, index) => {
      const image = news.featuredImage || DEFAULT_IMAGE;
      const headline = news.headline || news.title || "PrimeTime News";
      const category = news.category || "News";
      const summary = news.summary || "";

      heroSlider.innerHTML += `
        <div class="slide ${index === 0? "active" : ""}">
          <a href="article.html?id=${news.id}">
            <img src="${image}" alt="${headline.replace(/"/g, "&quot;")}" onerror="this.onerror=null; this.src='${DEFAULT_IMAGE}';" >
          </a>
          <div class="overlay">
            <span class="hero-category">${category}</span>
            <h1 class="hero-title">${headline}</h1>
            <p class="hero-summary">${summary}</p>
            <a href="article.html?id=${news.id}" class="hero-btn">Read Full Story <i class="fas fa-arrow-right"></i></a>
          </div>
        </div>
      `;

      heroDots.innerHTML += `<span class="dot ${index === 0? "active" : ""}" data-index="${index}"></span>`;
    });

    // REFRESH ELEMENTS - DITO YUNG FIX
    slides = document.querySelectorAll("#heroSlider.slide");
    dots = document.querySelectorAll("#heroDots.dot");
    currentSlide = 0;

    // DOT CLICK
    dots.forEach((dot, index) => {
      dot.addEventListener("click", () => {
        currentSlide = index;
        showSlide(currentSlide);
        resetAutoSlide();
      });
    });

    startAutoSlide();
    console.log("✅ HERO NEWS LOADED:", slides.length );

  } catch (err) {
    console.error("❌ Hero Slider Error:", err );
  }
}

// =========================
// SHOW SLIDE
// =========================
function showSlide(index) {
  if (!slides.length) return;
  slides.forEach(slide => slide.classList.remove("active"));
  dots.forEach(dot => dot.classList.remove("active"));
  slides[index].classList.add("active");
  if (dots[index]) dots[index].classList.add("active");
}

// NEXT
function nextSlide() {
  if (slides.length <= 1) return;
  currentSlide++;
  if (currentSlide >= slides.length) currentSlide = 0;
  showSlide(currentSlide);
}

// PREVIOUS
function prevSlide() {
  if (slides.length <= 1) return;
  currentSlide--;
  if (currentSlide < 0) currentSlide = slides.length - 1;
  showSlide(currentSlide);
}

// AUTO SLIDE
function startAutoSlide(){
  autoSlideInterval = setInterval(() => { nextSlide(); }, 5000);
}
function resetAutoSlide(){
  clearInterval(autoSlideInterval);
  startAutoSlide();
}

// BUTTONS
if (next) next.addEventListener("click", () => { nextSlide(); resetAutoSlide(); });
if (prev) prev.addEventListener("click", () => { prevSlide(); resetAutoSlide(); });

// LOAD
loadHeroSlider();
