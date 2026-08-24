import { db } from "./firebase.js";

import {
    collection,
    getDocs,
    deleteDoc,
    doc
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

const newsTable = document.getElementById("newsTable");

let allNews = [];
let currentFilter = "all";


// =====================
// FILTER BUTTONS
// =====================

document.querySelectorAll(".filterBtn").forEach(btn => {

    btn.addEventListener("click", () => {

        document.querySelectorAll(".filterBtn")
            .forEach(b => b.classList.remove("active"));

        btn.classList.add("active");

        currentFilter = btn.dataset.type;

        applyFilter();

    });

});


// =====================
// CATEGORY LINKS
// =====================

const categoryLinks =
    document.querySelectorAll(".category-link");

categoryLinks.forEach(link => {

    link.addEventListener("click", (e) => {

        e.preventDefault();

        const category =
            (link.dataset.category || "")
                .trim()
                .toLowerCase();

        console.log("CLICKED CATEGORY:", category);

        const filtered = allNews.filter(item => {

            // ARTICLE ONLY
            if (item.type !== "news") {
                return false;
            }

            const itemCategory =
                String(item.category || "")
                    .trim()
                    .toLowerCase();

            const status =
                String(item.status || "")
                    .trim()
                    .toLowerCase();

            return (
                status === "published" &&
                itemCategory === category
            );

        }).sort((a, b) => {

            const A =
                a.publishedAt?.seconds ||
                a.createdAt?.seconds ||
                0;

            const B =
                b.publishedAt?.seconds ||
                b.createdAt?.seconds ||
                0;

            return B - A;

        });

        renderNews(filtered);

        console.log(
            "CATEGORY:",
            category,
            "RESULTS:",
            filtered.length
        );

    });

});

// =====================
// APPLY FILTER
// =====================

function applyFilter() {

    let filtered = allNews.filter(item => {

        // ARTICLES
        if (item.type === "news") {
            return item.status === "published";
        }

        // VIDEOS
        if (item.type === "video") {
            return true;
        }

        return false;

    });


    if (currentFilter === "news") {

        filtered = filtered.filter(
            item => item.type === "news"
        );

    }


    if (currentFilter === "video") {

        filtered = filtered.filter(
            item => item.type === "video"
        );

    }


    filtered.sort((a, b) => {

        const A =
            a.publishedAt?.seconds ||
            a.createdAt?.seconds ||
            0;

        const B =
            b.publishedAt?.seconds ||
            b.createdAt?.seconds ||
            0;

        return B - A;

    });


    renderNews(filtered);

}


// =====================
// RENDER TABLE
// =====================

async function loadHeroSlider() {

    if (!heroSlider || !heroDots) {
        console.error("❌ Hero elements not found.");
        return;
    }

    heroSlider.innerHTML = "";
    heroDots.innerHTML = "";

    try {

        console.log("🔥 Loading hero news...");

        const snapshot =
            await getDocs(
                collection(db, "news")
            );

        let newsList = [];

        snapshot.forEach(docSnap => {

            const news = docSnap.data();

            const status =
                String(news.status || "")
                    .trim()
                    .toLowerCase();

            // Only published
            if (status !== "published") {
                return;
            }

            newsList.push({
                id: docSnap.id,
                ...news
            });

        });

        // =========================
        // SORT LATEST
        // =========================

        newsList.sort((a, b) => {

            const A =
                a.publishedAt?.seconds ||
                a.createdAt?.seconds ||
                0;

            const B =
                b.publishedAt?.seconds ||
                b.createdAt?.seconds ||
                0;

            return B - A;

        });

        // =========================
        // PINNED FIRST
        // =========================

        const pinned =
            newsList.filter(
                news => news.pinned === true
            );

        const normal =
            newsList.filter(
                news => news.pinned !== true
            );

        newsList = [
            ...pinned,
            ...normal
        ].slice(0, 5);


        console.log(
            "🔥 PUBLISHED NEWS:",
            newsList
        );


        // =========================
        // NO NEWS
        // =========================

        if (!newsList.length) {

            heroSlider.innerHTML = `
                <div class="slide active">

                    <img
                        src="${DEFAULT_IMAGE}"
                        alt="PrimeTime News"
                    >

                    <div class="overlay">

                        <span>NO NEWS</span>

                        <h1>
                            No news available.
                        </h1>

                    </div>

                </div>
            `;

            return;
        }


        // =========================
        // CREATE SLIDES
        // =========================

        newsList.forEach((news, index) => {

            const image =
                news.featuredImage ||
                DEFAULT_IMAGE;

            const headline =
                news.headline ||
                news.title ||
                "PrimeTime News";

            const category =
                news.category ||
                "News";

            const summary =
                news.summary ||
                "";


            heroSlider.innerHTML += `
                <div class="slide ${index === 0 ? "active" : ""}">

                    <a href="article.html?id=${news.id}">

                        <img
                            src="${image}"
                            alt="${headline.replace(/"/g, "&quot;")}"
                            onerror="
                                this.onerror=null;
                                this.src='${DEFAULT_IMAGE}';
                            "
                        >

                    </a>

                    <div class="overlay">

                        <span class="hero-category">
                            ${category}
                        </span>

                        <h1>
                            ${headline}
                        </h1>

                        <p>
                            ${summary}
                        </p>

                        <a
                            href="article.html?id=${news.id}"
                            class="hero-btn"
                        >
                            Read Full Story
                            <i class="fas fa-arrow-right"></i>
                        </a>

                    </div>

                </div>
            `;

            heroDots.innerHTML += `
                <span
                    class="dot ${index === 0 ? "active" : ""}"
                    data-index="${index}">
                </span>
            `;

        });


        slides =
            document.querySelectorAll(
                "#heroSlider .slide"
            );

        dots =
            document.querySelectorAll(
                "#heroDots .dot"
            );

        currentSlide = 0;


        dots.forEach((dot, index) => {

            dot.addEventListener("click", () => {

                currentSlide = index;

                showSlide(currentSlide);

            });

        });


        console.log(
            "✅ HERO NEWS LOADED:",
            slides.length
        );

    } catch (err) {

        console.error(
            "❌ Hero Slider Error:",
            err
        );

    }

}

// =====================
// LOAD NEWS + VIDEOS
// =====================

async function loadNews() {

    if (!newsTable) {
        console.error("❌ newsTable not found.");
        return;
    }


    try {

        newsTable.innerHTML = `
            <tr>
                <td
                    colspan="6"
                    style="text-align:center;padding:40px;"
                >
                    Loading...
                </td>
            </tr>
        `;


        allNews = [];


        // =========================
        // LOAD ARTICLES
        // =========================

        const newsSnap =
            await getDocs(
                collection(db, "news")
            );


        newsSnap.forEach(docSnap => {

            allNews.push({

                id: docSnap.id,

                type: "news",

                ...docSnap.data()

            });

        });


        console.log(
            "📰 ARTICLES:",
            newsSnap.size
        );


        // =========================
        // LOAD VIDEOS
        // =========================

        const videoSnap =
            await getDocs(
                collection(db, "videos")
            );


        videoSnap.forEach(docSnap => {

            allNews.push({

                id: docSnap.id,

                type: "video",

                ...docSnap.data()

            });

        });


        console.log(
            "🎬 VIDEOS:",
            videoSnap.size
        );


        // =========================
        // SORT
        // =========================

        allNews.sort((a, b) => {

            const A =
                a.publishedAt?.seconds ||
                a.createdAt?.seconds ||
                0;

            const B =
                b.publishedAt?.seconds ||
                b.createdAt?.seconds ||
                0;

            return B - A;

        });


        // =========================
        // DISPLAY
        // =========================

        applyFilter();


        console.log(
            "✅ TOTAL CONTENT:",
            allNews.length,
            allNews
        );


    } catch (err) {

        console.error(
            "❌ LOAD NEWS ERROR:",
            err
        );


        newsTable.innerHTML = `
            <tr>
                <td
                    colspan="6"
                    style="text-align:center;padding:40px;color:#b00020;"
                >
                    Failed to load news.
                    <br>
                    Check browser console for details.
                </td>
            </tr>
        `;

    }

}


// =====================
// SEARCH
// =====================

const searchBox =
    document.getElementById("searchNews");


if (searchBox) {

    searchBox.addEventListener(
        "input",
        function () {

            const keyword =
                this.value
                    .toLowerCase()
                    .trim();


            let filtered =
                allNews.filter(item => {

                    const title =
                        item.headline ||
                        item.title ||
                        "";


                    return title
                        .toLowerCase()
                        .includes(keyword);

                });


            // Apply current type filter
            if (currentFilter === "news") {

                filtered =
                    filtered.filter(
                        item => item.type === "news"
                    );

            }


            if (currentFilter === "video") {

                filtered =
                    filtered.filter(
                        item => item.type === "video"
                    );

            }


            // Published articles only
            filtered =
                filtered.filter(item => {

                    if (item.type === "news") {
                        return item.status === "published";
                    }

                    return true;

                });


            filtered.sort((a, b) => {

                const A =
                    a.publishedAt?.seconds ||
                    a.createdAt?.seconds ||
                    0;

                const B =
                    b.publishedAt?.seconds ||
                    b.createdAt?.seconds ||
                    0;

                return B - A;

            });


            renderNews(filtered);

        }
    );

}


// =====================
// DELETE
// =====================

window.deleteContent = async (id, type) => {

    if (!confirm("Delete this item?")) {
        return;
    }


    try {

        const collectionName =
            type === "video"
                ? "videos"
                : "news";


        await deleteDoc(
            doc(db, collectionName, id)
        );


        console.log(
            "🗑️ Deleted:",
            collectionName,
            id
        );


        // Reload
        await loadNews();


    } catch (err) {

        console.error(
            "❌ DELETE ERROR:",
            err
        );

        alert(
            "Failed to delete item: " +
            err.message
        );

    }

};


// =====================
// EDIT
// =====================

window.editContent = (id, type) => {

    if (type === "video") {

        window.location.href =
            `add-video.html?id=${id}`;

    } else {

        window.location.href =
            `add-news.html?id=${id}`;

    }

};


// =====================
// HOME
// =====================

const homeBtn =
    document.getElementById("homeNews");


if (homeBtn) {

    homeBtn.addEventListener(
        "click",
        e => {

            e.preventDefault();

            currentFilter = "all";


            document
                .querySelectorAll(".filterBtn")
                .forEach(btn =>
                    btn.classList.remove("active")
                );


            document
                .querySelector(
                    '[data-type="all"]'
                )
                ?.classList.add("active");


            if (searchBox) {
                searchBox.value = "";
            }


            applyFilter();

        }
    );

}


// =========================
// DATE FILTER
// =========================

const dateFilter =
    document.getElementById("dateFilter");


if (dateFilter) {

    dateFilter.addEventListener(
        "change",
        () => {

            const value =
                dateFilter.value;


            let filtered =
                allNews.filter(item => {

                    if (item.type === "news") {
                        return item.status === "published";
                    }

                    return true;

                });


            // TYPE FILTER
            if (currentFilter === "news") {

                filtered =
                    filtered.filter(
                        item => item.type === "news"
                    );

            }


            if (currentFilter === "video") {

                filtered =
                    filtered.filter(
                        item => item.type === "video"
                    );

            }


            // DATE
            if (value) {

                filtered =
                    filtered.filter(item => {

                        const ts =
                            item.publishedAt?.seconds ||
                            item.createdAt?.seconds;


                        if (!ts) {
                            return false;
                        }


                        const d =
                            new Date(ts * 1000);


                        const yyyy =
                            d.getFullYear();


                        const mm =
                            String(
                                d.getMonth() + 1
                            ).padStart(2, "0");


                        const dd =
                            String(
                                d.getDate()
                            ).padStart(2, "0");


                        return (
                            `${yyyy}-${mm}-${dd}`
                            === value
                        );

                    });

            }


            filtered.sort((a, b) => {

                const A =
                    a.publishedAt?.seconds ||
                    a.createdAt?.seconds ||
                    0;

                const B =
                    b.publishedAt?.seconds ||
                    b.createdAt?.seconds ||
                    0;

                return B - A;

            });


            renderNews(filtered);

        }
    );

}


// =========================
// CLEAR DATE
// =========================

const clearDate =
    document.getElementById("clearDate");


if (clearDate) {

    clearDate.addEventListener(
        "click",
        () => {

            dateFilter.value = "";

            applyFilter();

        }
    );

}


// =====================
// START
// =====================

console.log("🔥 NEWS.JS LOADED");

loadNews();
