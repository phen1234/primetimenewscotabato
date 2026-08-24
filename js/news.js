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

        const category = link.dataset.category;

        const filtered = allNews
            .filter(item => {

                if (item.type === "video") {
                    return item.category === category;
                }

                return (
                    item.status === "published" &&
                    item.category === category
                );

            })
            .sort((a, b) => {

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

function renderNews(newsList) {

    if (!newsTable) {
        console.error("❌ newsTable not found.");
        return;
    }

    newsTable.innerHTML = "";


    if (newsList.length === 0) {

        newsTable.innerHTML = `
            <tr>
                <td
                    colspan="6"
                    style="text-align:center;padding:40px;"
                >
                    No news found.
                </td>
            </tr>
        `;

        return;

    }


    newsList.forEach(item => {

        const publishTimestamp =
            item.publishedAt?.seconds ||
            item.createdAt?.seconds ||
            0;


        const publishDate =
            publishTimestamp
                ? new Date(
                    publishTimestamp * 1000
                ).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric"
                })
                : "-";


        // =========================
        // IMAGE
        // =========================

        const image =
            item.type === "video"
                ? (
                    item.thumbnail ||
                    item.featuredImage ||
                    "https://res.cloudinary.com/ufx7karu/image/upload/v1787537790/primetime-news/n4eboj0okjvljwwrqloc.png"
                )
                : (
                    item.featuredImage ||
                    "https://res.cloudinary.com/ufx7karu/image/upload/v1787537790/primetime-news/n4eboj0okjvljwwrqloc.png"
                );


        // =========================
        // TITLE
        // =========================

        const title =
            item.headline ||
            item.title ||
            "Untitled";


        // =========================
        // TYPE BADGE
        // =========================

        const typeBadge =
            item.type === "video"

                ? `
                    <span class="typeBadge video">
                        <i class="fab fa-youtube"></i>
                        VIDEO
                    </span>
                  `

                : `
                    <span class="typeBadge news">
                        <i class="fas fa-newspaper"></i>
                        ARTICLE
                    </span>
                  `;


        // =========================
        // ROW
        // =========================

        newsTable.innerHTML += `

            <tr>

                <td>

                    <img
                        src="${image}"
                        class="thumb"
                        alt="News image"
                        onerror="
                            this.onerror=null;
                            this.src='https://res.cloudinary.com/ufx7karu/image/upload/v1787537790/primetime-news/n4eboj0okjvljwwrqloc.png';
                        "
                    >

                </td>


                <td>

                    ${typeBadge}

                    <div class="headlineText">

                        ${title}

                    </div>

                </td>


                <td>

                    ${item.category || "-"}

                </td>


                <td>

                    ${item.author || "-"}

                </td>


                <td class="statusColumn">

                    <span class="publishedBadge">

                        <i class="fas fa-circle-check"></i>

                        Published

                    </span>

                    <div class="publishDate">

                        ${publishDate}

                    </div>

                </td>


                <td>

                    <button
                        class="editBtn"
                        onclick="editContent('${item.id}','${item.type}')"
                    >

                        <i class="fas fa-edit"></i>

                    </button>


                    <button
                        class="deleteBtn"
                        onclick="deleteContent('${item.id}','${item.type}')"
                    >

                        <i class="fas fa-trash"></i>

                    </button>

                </td>

            </tr>

        `;

    });

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
