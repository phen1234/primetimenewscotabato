import { db } from "./firebase.js";

import {
    collection,
    getDocs,
    query,
    where,
    orderBy
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

// ===============================
// PAGE INFO
// ===============================

const page = document.body.dataset.page;

const pageTitle = document.getElementById("pageTitle");
const pageSubtitle = document.getElementById("pageSubtitle");


const pageInfo = {

    local: {
        title: "Local News",
        subtitle: "Primetime News Cotabato",
        category: "Local News"
    },

    police: {
        title: "Police Report",
        subtitle: "Primetime News Cotabato",
        category: "Police Report"
    },

    political: {
        title: "Political News",
        subtitle: "Primetime News Cotabato",
        category: "Political News"
    },

    weather: {
        title: "Weather Update",
        subtitle: "Primetime News Cotabato",
        category: "Weather"
    },

    national: {
        title: "National News",
        subtitle: "Primetime News Cotabato",
        category: "National News"
    },

    international: {
        title: "International News",
        subtitle: "Primetime News Cotabato",
        category: "International News"
    }

};

const currentPage = pageInfo[page];

pageTitle.textContent = currentPage.title;
pageSubtitle.textContent = currentPage.subtitle;
document.title = `${currentPage.title} | Primetime News Cotabato`;


// =============================
// CURRENT CATEGORY
// =============================

const CURRENT_CATEGORY = currentPage.category;

// =============================
// ELEMENTS
// =============================

const featuredContent =
document.getElementById("featuredContent");

const contentList =
document.getElementById("contentList");

const sidebarContent =
document.getElementById("sidebarContent");

const searchInput =
document.getElementById("searchInput");

let newsData = [];

// =============================
// LOAD NEWS
// =============================

async function loadNews(){

    if (featuredContent) {
        featuredContent.innerHTML = "Loading...";
    }

    if (contentList) {
        contentList.innerHTML = "";
    }

    if (sidebarContent) {
        sidebarContent.innerHTML = "";
    }

    try{

        const q = query(

            collection(db,"news"),

            where("status","==","published"),

            where("category","==",CURRENT_CATEGORY),

            orderBy("publishedAt","desc")

        );

        const snapshot = await getDocs(q);

        newsData = [];

        snapshot.forEach(doc=>{

            newsData.push({

                id:doc.id,

                ...doc.data()

            });

        });

        if(newsData.length===0){

           featuredContent.innerHTML = `
    <h2>No ${currentPage.title} Found</h2>
`;

            return;

        }

        renderFeaturedNews(newsData[0]);

        renderNewsList(newsData.slice(1));

        renderMostRead(newsData);

    }

    catch(err){

        console.error(err);

    }

}

loadNews();

// =============================
// FEATURED NEWS
// =============================

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

    <span>
        <i class="fas fa-calendar-alt"></i>

        ${
            news.publishedAt?.seconds
            ? new Date(news.publishedAt.seconds * 1000).toLocaleDateString("en-US",{
                year:"numeric",
                month:"long",
                day:"numeric"
            })
            : ""
        }
    </span>

    <span>
        <i class="fas fa-user"></i>
        ${news.author || "Primetime News Cotabato"}
    </span>

    <span>
        <i class="fas fa-eye"></i>
        ${news.views || 0} Views
    </span>

</div>

        <h2>
            ${news.headline}
        </h2>

        <p>
            ${news.summary || ""}
        </p>

        <button
            class="read-btn"
            data-id="${news.id}">

            Read Full Story

        </button>

    </div>

</div>

`;

}

// =============================
// NEWS LIST
// =============================

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

        <p>
    ${news.summary || ""}
</p>

<div class="news-meta">

    <span>
        <i class="fas fa-eye"></i>
        ${news.views || 0} Views
    </span>

</div>

    </div>

</div>

`;

});

contentList.innerHTML = html;

}

// =============================
// MOST READ
// =============================

function renderMostRead(newsList) {

    if (!sidebarContent) {
        return;
    }

    let html = `
        <div class="most-read-title">
            🔥 Most Read
        </div>
    `;

    newsList.slice(0, 5).forEach(news => {

        html += `
            <a
                href="article.html?id=${news.id}"
                class="most-read-item"
                data-id="${news.id}"
            >

                <img
                    src="${news.featuredImage || "images/news1.jpg"}"
                    alt="${news.headline || "News"}"
                    loading="lazy"
                >

                <div class="most-read-content">

                    <span class="badge">
                        ${news.category || ""}
                    </span>

                    <h4>
                        ${news.headline || ""}
                    </h4>

                    <small>
                        <i class="fas fa-eye"></i>
                        ${news.views || 0} Views
                    </small>

                </div>

            </a>
        `;
    });

    sidebarContent.innerHTML = html;
}
// =============================
// NEWS CLICK HANDLER
// =============================

document.addEventListener("click", (e) => {

    const btn =
        e.target.closest(".read-btn");

    const card =
        e.target.closest(".news-card");

    const mostRead =
        e.target.closest(".most-read-item");

    // Kunin kung alin ang na-click
    const target =
        btn || card || mostRead;

    if (!target) return;

    const id =
        target.dataset.id;

    if (!id) return;

    window.location.href =
        `article.html?id=${id}`;

});


// =============================
// SEARCH
// =============================

if (searchInput) {

    searchInput.addEventListener("input", () => {

        const keyword =
            searchInput.value
                .toLowerCase()
                .trim();


        const filtered =
            newsData.filter(news => {

                const headline =
                    (news.headline || "")
                        .toLowerCase();

                const summary =
                    (news.summary || "")
                        .toLowerCase();

                return (
                    headline.includes(keyword) ||
                    summary.includes(keyword)
                );

            });


        if (filtered.length > 0) {

            // Featured
            renderFeaturedNews(
                filtered[0]
            );


            // News list
            renderNewsList(
                filtered.slice(1)
            );


            // Most read
            renderMostRead(
                filtered
            );

        }

        else {

            if (featuredContent) {

                featuredContent.innerHTML = `
                    <h2>No News Found</h2>
                    <p>
                        No article matches your search.
                    </p>
                `;

            }


            if (contentList) {

                contentList.innerHTML = "";

            }


            if (sidebarContent) {

                sidebarContent.innerHTML = "";

            }

        }

    });

}

document.addEventListener("DOMContentLoaded", function () {

    const menuToggle = document.getElementById("menuToggle");
    const navLinks = document.querySelector(".nav-links");

    if (!menuToggle || !navLinks) return;


    // OPEN / CLOSE HAMBURGER
    menuToggle.addEventListener("click", function (e) {

        e.stopPropagation();

        navLinks.classList.toggle("active");

    });


    // CLOSE AFTER CLICKING A CATEGORY
    navLinks.querySelectorAll("a").forEach(function (link) {

        link.addEventListener("click", function () {

            navLinks.classList.remove("active");

        });

    });


    // CLOSE WHEN CLICKING OUTSIDE
    document.addEventListener("click", function (e) {

        if (
            !navLinks.contains(e.target) &&
            !menuToggle.contains(e.target)
        ) {
            navLinks.classList.remove("active");
        }

    });

});