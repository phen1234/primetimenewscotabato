import { db } from "./firebase.js";

import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";


// =====================================================
// PAGE INFO
// =====================================================

const page = document.body.dataset.page;

const pageTitle =
    document.getElementById("pageTitle");

const pageSubtitle =
    document.getElementById("pageSubtitle");


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


// =====================================================
// CHECK PAGE
// =====================================================

const currentPage =
    pageInfo[page];


if (!currentPage) {

    console.error(
        "❌ Unknown category page:",
        page
    );

}


// =====================================================
// PAGE TITLE
// =====================================================

if (currentPage) {

    if (pageTitle) {
        pageTitle.textContent =
            currentPage.title;
    }

    if (pageSubtitle) {
        pageSubtitle.textContent =
            currentPage.subtitle;
    }

    document.title =
        `${currentPage.title} | Primetime News Cotabato`;

}


// =====================================================
// CURRENT CATEGORY
// =====================================================

const CURRENT_CATEGORY =
    String(
        currentPage?.category || ""
    )
    .trim()
    .toLowerCase();


console.log(
    "📂 CURRENT CATEGORY:",
    CURRENT_CATEGORY
);


// =====================================================
// ELEMENTS
// =====================================================

const featuredContent =
    document.getElementById(
        "featuredContent"
    );

const contentList =
    document.getElementById(
        "contentList"
    );

const sidebarContent =
    document.getElementById(
        "sidebarContent"
    );

const searchInput =
    document.getElementById(
        "searchInput"
    );


// =====================================================
// DATA
// =====================================================

let newsData = [];


// =====================================================
// NORMALIZE CATEGORY
// =====================================================

function normalizeCategory(value) {

    return String(value || "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ");

}


// =====================================================
// GET TIMESTAMP
// =====================================================

function getTimestamp(news) {

    return (
        news.publishedAt?.seconds ||
        news.createdAt?.seconds ||
        0
    );

}


// =====================================================
// LOAD NEWS
// =====================================================

async function loadNews() {

    console.log(
        "🔥 Loading category:",
        CURRENT_CATEGORY
    );


    if (featuredContent) {

        featuredContent.innerHTML = `
            <div style="padding:30px;text-align:center;">
                Loading...
            </div>
        `;

    }


    if (contentList) {
        contentList.innerHTML = "";
    }


    if (sidebarContent) {
        sidebarContent.innerHTML = "";
    }


    try {

        // =================================================
        // LOAD ALL NEWS
        // =================================================

        const snapshot =
            await getDocs(
                collection(db, "news")
            );


        console.log(
            "📰 TOTAL FIRESTORE NEWS:",
            snapshot.size
        );


        newsData = [];


        // =================================================
        // FILTER PUBLISHED + CATEGORY
        // =================================================

        snapshot.forEach(docSnap => {

            const news =
                docSnap.data();


            const status =
                normalizeCategory(
                    news.status
                );


            const category =
                normalizeCategory(
                    news.category
                );


            console.log(
                "CHECK NEWS:",
                news.headline,
                "| status:",
                status,
                "| category:",
                category
            );


            // ONLY PUBLISHED
            if (status !== "published") {
                return;
            }


            // ONLY CURRENT CATEGORY
            if (
                category !==
                CURRENT_CATEGORY
            ) {

                return;

            }


            newsData.push({

                id: docSnap.id,

                ...news

            });

        });


        // =================================================
        // SORT LATEST
        // =================================================

        newsData.sort((a, b) => {

            return (
                getTimestamp(b) -
                getTimestamp(a)
            );

        });


        console.log(
            "✅ CATEGORY RESULTS:",
            newsData.length,
            newsData
        );


        // =================================================
        // NO NEWS
        // =================================================

        if (newsData.length === 0) {

            if (featuredContent) {

                featuredContent.innerHTML = `

                    <div
                        style="
                            padding:40px;
                            text-align:center;
                        "
                    >

                        <h2>
                            No ${currentPage.title} Found
                        </h2>

                        <p>
                            There are currently no published
                            articles under this category.
                        </p>

                    </div>

                `;

            }


            return;

        }


        // =================================================
        // FEATURED
        // =================================================

        renderFeaturedNews(
            newsData[0]
        );


        // =================================================
        // LIST
        // =================================================

        renderNewsList(
            newsData.slice(1)
        );


        // =================================================
        // MOST READ
        // =================================================

        renderMostRead(
            newsData
        );


    } catch (error) {

        console.error(
            "❌ CATEGORY NEWS ERROR:",
            error
        );


        if (featuredContent) {

            featuredContent.innerHTML = `

                <div
                    style="
                        padding:40px;
                        text-align:center;
                    "
                >

                    <h2>
                        Failed to Load News
                    </h2>

                    <p>
                        Please check the browser console.
                    </p>

                </div>

            `;

        }

    }

}


// =====================================================
// FEATURED NEWS
// =====================================================

function renderFeaturedNews(news) {

    if (!featuredContent) {
        return;
    }


    const image =
        news.featuredImage ||
        "images/news1.jpg";


    const headline =
        news.headline ||
        news.title ||
        "Primetime News";


    const category =
        news.category ||
        currentPage.title;


    const summary =
        news.summary ||
        "";


    const date =
        news.publishedAt?.seconds
            ? new Date(
                news.publishedAt.seconds * 1000
            ).toLocaleDateString(
                "en-US",
                {
                    year: "numeric",
                    month: "long",
                    day: "numeric"
                }
            )
            : "";


    featuredContent.innerHTML = `

        <div class="featured-news">

            <img
                src="${image}"
                class="featured-image"
                alt="${escapeHtml(headline)}"
                onerror="
                    this.onerror=null;
                    this.src='images/news1.jpg';
                "
            >


            <div class="featured-overlay">

                <span class="badge">
                    ${escapeHtml(category)}
                </span>


                <div class="news-meta">

                    <span>

                        <i class="fas fa-calendar-alt"></i>

                        ${date}

                    </span>


                    <span>

                        <i class="fas fa-user"></i>

                        ${escapeHtml(
                            news.author ||
                            "Primetime News Cotabato"
                        )}

                    </span>


                    <span>

                        <i class="fas fa-eye"></i>

                        ${news.views || 0}
                        Views

                    </span>

                </div>


                <h2>
                    ${escapeHtml(headline)}
                </h2>


                <p>
                    ${escapeHtml(summary)}
                </p>


                <button
                    class="read-btn"
                    data-id="${news.id}"
                >

                    Read Full Story

                </button>

            </div>

        </div>

    `;

}


// =====================================================
// NEWS LIST
// =====================================================

function renderNewsList(newsList) {

    if (!contentList) {
        return;
    }


    if (!newsList.length) {

        contentList.innerHTML = "";

        return;

    }


    let html = "";


    newsList.forEach(news => {

        const image =
            news.featuredImage ||
            "images/news1.jpg";


        const headline =
            news.headline ||
            news.title ||
            "Primetime News";


        html += `

            <div
                class="news-card"
                data-id="${news.id}"
            >

                <img
                    src="${image}"
                    alt="${escapeHtml(headline)}"
                    loading="lazy"
                    onerror="
                        this.onerror=null;
                        this.src='images/news1.jpg';
                    "
                >


                <div class="news-info">

                    <span class="badge">

                        ${escapeHtml(
                            news.category ||
                            currentPage.title
                        )}

                    </span>


                    <h3>

                        ${escapeHtml(headline)}

                    </h3>


                    <p>

                        ${escapeHtml(
                            news.summary || ""
                        )}

                    </p>


                    <div class="news-meta">

                        <span>

                            <i class="fas fa-eye"></i>

                            ${news.views || 0}
                            Views

                        </span>

                    </div>

                </div>

            </div>

        `;

    });


    contentList.innerHTML =
        html;

}


// =====================================================
// MOST READ
// =====================================================

function renderMostRead(newsList) {

    if (!sidebarContent) {
        return;
    }


    let html = `

        <div class="most-read-title">
            🔥 Most Read
        </div>

    `;


    newsList
        .slice(0, 5)
        .forEach(news => {

            const image =
                news.featuredImage ||
                "images/news1.jpg";


            const headline =
                news.headline ||
                news.title ||
                "News";


            html += `

                <a
                    href="article.html?id=${news.id}"
                    class="most-read-item"
                    data-id="${news.id}"
                >

                    <img
                        src="${image}"
                        alt="${escapeHtml(headline)}"
                        loading="lazy"
                    >


                    <div class="most-read-content">

                        <span class="badge">

                            ${escapeHtml(
                                news.category || ""
                            )}

                        </span>


                        <h4>

                            ${escapeHtml(headline)}

                        </h4>


                        <small>

                            <i class="fas fa-eye"></i>

                            ${news.views || 0}
                            Views

                        </small>

                    </div>

                </a>

            `;

        });


    sidebarContent.innerHTML =
        html;

}


// =====================================================
// CLICK HANDLER
// =====================================================

document.addEventListener(
    "click",
    e => {

        const btn =
            e.target.closest(
                ".read-btn"
            );


        const card =
            e.target.closest(
                ".news-card"
            );


        const mostRead =
            e.target.closest(
                ".most-read-item"
            );


        const target =
            btn ||
            card ||
            mostRead;


        if (!target) {
            return;
        }


        const id =
            target.dataset.id;


        if (!id) {
            return;
        }


        window.location.href =
            `article.html?id=${id}`;

    }
);


// =====================================================
// SEARCH
// =====================================================

if (searchInput) {

    searchInput.addEventListener(
        "input",
        () => {

            const keyword =
                searchInput.value
                    .toLowerCase()
                    .trim();


            const filtered =
                newsData.filter(news => {

                    const headline =
                        String(
                            news.headline || ""
                        )
                        .toLowerCase();


                    const summary =
                        String(
                            news.summary || ""
                        )
                        .toLowerCase();


                    return (
                        headline.includes(keyword) ||
                        summary.includes(keyword)
                    );

                });


            if (!filtered.length) {

                if (featuredContent) {

                    featuredContent.innerHTML = `

                        <div
                            style="
                                padding:40px;
                                text-align:center;
                            "
                        >

                            <h2>
                                No News Found
                            </h2>

                            <p>
                                No article matches your search.
                            </p>

                        </div>

                    `;

                }


                if (contentList) {
                    contentList.innerHTML = "";
                }


                if (sidebarContent) {
                    sidebarContent.innerHTML = "";
                }


                return;

            }


            renderFeaturedNews(
                filtered[0]
            );


            renderNewsList(
                filtered.slice(1)
            );


            renderMostRead(
                filtered
            );

        }
    );

}


// =====================================================
// MOBILE MENU
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const menuToggle =
            document.getElementById(
                "menuToggle"
            );


        const navLinks =
            document.querySelector(
                ".nav-links"
            );


        if (
            !menuToggle ||
            !navLinks
        ) {
            return;
        }


        menuToggle.addEventListener(
            "click",
            e => {

                e.stopPropagation();

                navLinks.classList.toggle(
                    "active"
                );

            }
        );


        navLinks
            .querySelectorAll("a")
            .forEach(link => {

                link.addEventListener(
                    "click",
                    () => {

                        navLinks.classList.remove(
                            "active"
                        );

                    }
                );

            });


        document.addEventListener(
            "click",
            e => {

                if (
                    !navLinks.contains(
                        e.target
                    ) &&
                    !menuToggle.contains(
                        e.target
                    )
                ) {

                    navLinks.classList.remove(
                        "active"
                    );

                }

            }
        );

    }
);


// =====================================================
// ESCAPE HTML
// =====================================================

function escapeHtml(value) {

    return String(value ?? "")
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


// =====================================================
// START
// =====================================================

console.log(
    "🔥 CATEGORY-NEWS.JS LOADED"
);

loadNews();
