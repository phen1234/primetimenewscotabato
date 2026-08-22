import { db } from "./firebase.js";

import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";


const newsGrid =
    document.getElementById("latestNewsGrid");

const newsFilters =
    document.getElementById("latestFilters");

const categoryToggle =
    document.getElementById("latestCategoryToggle");

    const categoryBar =
    document.querySelector(".latest-category-bar");

const selectedCategory =
    document.getElementById("selectedLatestCategory");


let allNews = [];

let activeCategory = "All";


/* =========================================
   NORMALIZE
========================================= */

function normalize(value) {

    return String(value || "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ");

}


/* =========================================
   GET CATEGORY
========================================= */

function getCategory(article) {

    return (
        article.category ||
        article.categoryName ||
        article.newsCategory ||
        article.type ||
        ""
    );

}


/* =========================================
   GET TITLE
========================================= */

function getTitle(article) {

    return (
        article.title ||
        article.headline ||
        article.name ||
        "Latest News"
    );

}


/* =========================================
   GET DESCRIPTION
========================================= */

function getDescription(article) {

    return (
        article.description ||
        article.excerpt ||
        article.summary ||
        article.content ||
        ""
    );

}


/* =========================================
   GET IMAGE
========================================= */

function getImage(article) {

    return (
        article.image ||
        article.imageUrl ||
        article.thumbnail ||
        article.photo ||
        article.featuredImage ||
        "images/PRIMETIME NEWS LOGO.png"
    );

}


/* =========================================
   GET DATE
========================================= */

function getDate(article) {

    if (article.date) {
        return String(article.date);
    }


    if (article.createdAt?.toDate) {

        return article.createdAt
            .toDate()
            .toLocaleDateString();

    }


    if (article.createdAt?.seconds) {

        return new Date(
            article.createdAt.seconds * 1000
        ).toLocaleDateString();

    }


    if (article.publishedAt?.toDate) {

        return article.publishedAt
            .toDate()
            .toLocaleDateString();

    }


    if (article.publishedAt?.seconds) {

        return new Date(
            article.publishedAt.seconds * 1000
        ).toLocaleDateString();

    }


    return "";

}


/* =========================================
   GET ID
========================================= */

function getArticleId(article) {

    return (
        article.id ||
        article.newsId ||
        article.slug ||
        ""
    );

}


/* =========================================
   ESCAPE HTML
========================================= */

function escapeHtml(value) {

    const div =
        document.createElement("div");

    div.textContent =
        String(value ?? "");

    return div.innerHTML;

}


/* =========================================
   RENDER
========================================= */

function renderNews() {

    if (!newsGrid) return;


    const filtered =
        activeCategory === "All"
            ? allNews
            : allNews.filter(article =>
                normalize(
                    getCategory(article)
                ) === normalize(
                    activeCategory
                )
            );


    newsGrid.innerHTML = "";


    if (!filtered.length) {

        newsGrid.innerHTML = `

            <div class="no-news">

                <i class="fas fa-newspaper"></i>

                <p>
                    No news available in this category.
                </p>

            </div>

        `;

        return;

    }


    let rendered = 0;


    filtered.forEach(article => {

        const id =
            getArticleId(article);

        const title =
            getTitle(article);

        const category =
            getCategory(article);

        const description =
            getDescription(article);

        const image =
            getImage(article);

        const date =
            getDate(article);


        /*
         * IMPORTANT:
         *
         * If your article page uses another
         * filename, change only this line.
         */

        const articleUrl =
            `article.html?id=${encodeURIComponent(id)}`;


        const card =
            document.createElement("a");


        card.className =
            "latest-news-card";

        card.href =
            articleUrl;


        card.innerHTML = `

            <div class="latest-news-image">

                <img
                    src="${escapeHtml(image)}"
                    alt="${escapeHtml(title)}"
                    loading="lazy"
                    onerror="this.src='images/PRIMETIME NEWS LOGO.png'"
                >

            </div>


            <div class="latest-news-content">

                ${
                    category
                        ? `
                            <span class="latest-news-category">
                                ${escapeHtml(category)}
                            </span>
                          `
                        : ""
                }


                <h3>
                    ${escapeHtml(title)}
                </h3>


                ${
                    description
                        ? `
                            <p class="latest-news-excerpt">
                                ${escapeHtml(description)}
                            </p>
                          `
                        : ""
                }


                ${
                    date
                        ? `
                            <div class="latest-news-meta">

                                <i class="far fa-calendar"></i>

                                ${escapeHtml(date)}

                            </div>
                          `
                        : ""
                }

            </div>

        `;


        newsGrid.appendChild(card);

        rendered++;

    });


    if (!rendered) {

        newsGrid.innerHTML = `

            <div class="no-news">

                <i class="fas fa-newspaper"></i>

                <p>
                    No valid news articles available.
                </p>

            </div>

        `;

    }

}


/* =========================================
   LOAD NEWS
========================================= */

async function loadNews() {

    if (!newsGrid) return;


    newsGrid.innerHTML = `

        <div class="news-loading">

            <i class="fas fa-spinner fa-spin"></i>

            <p>
                Loading latest news...
            </p>

        </div>

    `;


    try {

        const snapshot =
            await getDocs(
                collection(db, "news")
            );


        allNews =
            snapshot.docs.map(doc => ({

                id: doc.id,

                ...doc.data()

            }));


        /*
         * NEWEST FIRST
         */

        allNews.sort((a, b) => {

            function getTime(article) {

                if (article.createdAt?.seconds) {

                    return (
                        article.createdAt.seconds * 1000
                    );

                }


                if (article.createdAt?.toDate) {

                    return article.createdAt
                        .toDate()
                        .getTime();

                }


                if (article.publishedAt?.seconds) {

                    return (
                        article.publishedAt.seconds * 1000
                    );

                }


                if (article.publishedAt?.toDate) {

                    return article.publishedAt
                        .toDate()
                        .getTime();

                }


                if (article.date) {

                    const time =
                        new Date(
                            article.date
                        ).getTime();

                    return Number.isNaN(time)
                        ? 0
                        : time;

                }


                return 0;

            }


            return (
                getTime(b) -
                getTime(a)
            );

        });


        renderNews();

    }


    catch (error) {

        console.error(
            "Latest News Error:",
            error
        );


        newsGrid.innerHTML = `

            <div class="no-news">

                <i class="fas fa-circle-exclamation"></i>

                <p>
                    Unable to load latest news.
                </p>

            </div>

        `;

    }

}


/* =========================================
   CATEGORY DROPDOWN
========================================= */

if (categoryToggle) {

    categoryToggle.addEventListener(
        "click",
        function () {

            if (!categoryBar) return;


            const open =
                categoryBar.classList.toggle(
                    "open"
                );


            categoryToggle.setAttribute(
                "aria-expanded",
                String(open)
            );

        }
    );

}


/* =========================================
   CATEGORY FILTER
========================================= */

if (newsFilters) {

    newsFilters.addEventListener(
        "click",
        function (event) {

            const button =
                event.target.closest(
                    ".latest-filter"
                );


            if (!button) return;


            activeCategory =
                button.dataset.category ||
                "All";


            newsFilters
                .querySelectorAll(
                    ".latest-filter"
                )
                .forEach(item => {

                    item.classList.remove(
                        "active"
                    );

                });


            button.classList.add(
                "active"
            );


            if (selectedCategory) {

                selectedCategory.textContent =
                    activeCategory;

            }


            if (categoryBar) {

                categoryBar.classList.remove(
                    "open"
                );

            }


            if (categoryToggle) {

                categoryToggle.setAttribute(
                    "aria-expanded",
                    "false"
                );

            }


            renderNews();

        }
    );

}


/* =========================================
   START
========================================= */

loadNews();

