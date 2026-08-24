import { db } from "./firebase.js";

import {
    collection,
    getDocs,
    query,
    where,
    orderBy,
    limit
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

const heroSlider = document.getElementById("heroSlider");
const heroDots = document.getElementById("heroDots");

const next = document.querySelector(".next");
const prev = document.querySelector(".prev");

let slides = [];
let dots = [];
let currentSlide = 0;

async function loadHeroSlider() {

    heroSlider.innerHTML = "";
    heroDots.innerHTML = "";

    try {

        const q = query(
            collection(db, "news"),
            where("pinned", "==", true),
            orderBy("createdAt", "desc")
        );

        const snapshot = await getDocs(q);

        if (snapshot.empty) {

            heroSlider.innerHTML = `
                <div class="slide active">
                    <img src="images/default-news.jpg" alt="">
                    <div class="overlay">
                        <span>NO NEWS</span>
                        <h1>No pinned news available.</h1>
                    </div>
                </div>
            `;

            return;
        }

        snapshot.forEach((doc, index) => {

            const news = doc.data();

            heroSlider.innerHTML += `
                <div class="slide ${index === 0 ? "active" : ""}">

                    <a href="article.html?id=${doc.id}">
                        <img src="${news.featuredImage}" alt="${news.headline}">
                    </a>

                    <div class="overlay">

    <span class="hero-category">${news.category}</span>

    <h1>${news.headline}</h1>

    <p>${news.summary}</p>

    <a href="article.html?id=${doc.id}" class="hero-btn">

        Read Full Story

        <i class="fas fa-arrow-right"></i>

    </a>

</div>

                </div>
            `;

            heroDots.innerHTML += `
                <span class="dot ${index === 0 ? "active" : ""}"></span>
            `;

        });

        slides = document.querySelectorAll("#heroSlider .slide");
        dots = document.querySelectorAll("#heroDots .dot");

        currentSlide = 0;

        dots.forEach((dot, index) => {

            dot.addEventListener("click", () => {

                currentSlide = index;
                showSlide(currentSlide);

            });

        });

    } catch (err) {

        console.error("Hero Slider Error:", err);

    }

}

function showSlide(index) {

    if (slides.length === 0) return;

    slides.forEach(slide => slide.classList.remove("active"));
    dots.forEach(dot => dot.classList.remove("active"));

    slides[index].classList.add("active");

    if (dots[index]) {
        dots[index].classList.add("active");
    }

}

function nextSlide() {

    if (slides.length <= 1) return;

    currentSlide++;

    if (currentSlide >= slides.length) {
        currentSlide = 0;
    }

    showSlide(currentSlide);

}

function prevSlide() {

    if (slides.length <= 1) return;

    currentSlide--;

    if (currentSlide < 0) {
        currentSlide = slides.length - 1;
    }

    showSlide(currentSlide);

}

document.querySelector(".next").addEventListener("click", nextSlide);
document.querySelector(".prev").addEventListener("click", prevSlide);

setInterval(() => {

    nextSlide();

}, 5000);

loadHeroSlider();

// =============================
// HERO VIDEOS
// =============================

async function loadHeroVideos(){

    const container = document.getElementById("heroVideos");

    if(!container) return;

    const q = query(
        collection(db,"news"),
        where("youtube","!=", ""),
        orderBy("youtube"),
        orderBy("createdAt","desc"),
        limit(3)
    );

    const snapshot = await getDocs(q);

    container.innerHTML = "";

    snapshot.forEach((doc, index) => {

    const news = doc.data();

    let thumb = "";

    if(news.youtube){

        const id = news.youtube.split("v=")[1]?.split("&")[0];

        thumb = `https://img.youtube.com/vi/${id}/mqdefault.jpg`;

    }

    const div = document.createElement("div");

    div.className = "video-item hero-video";

    div.style.transitionDelay = `${index * 0.15}s`;

    div.innerHTML = `
        <img src="${thumb}" alt="">

        <div>

            <h4>${news.headline}</h4>

            <p>▶ Watch Video</p>

        </div>
    `;

    div.onclick = () => {
        window.location = `article.html?id=${doc.id}`;
    };

    container.appendChild(div);

    observer.observe(div);

});

}

loadHeroVideos();

const observer = new IntersectionObserver((entries) => {

    entries.forEach(entry => {

        if(entry.isIntersecting){

            entry.target.classList.add("show-video");

            observer.unobserve(entry.target);

        }

    });

},{
    threshold:0.15
});
