import { db } from "./firebase.js";

import {
    collection,
    getDocs,
    getDoc,
    deleteDoc,
    doc
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

import {
    deleteCloudinaryAssets,
    extractCloudinaryPublicId
} from "./cloudinary-delete.js";


// =====================================================
// ELEMENTS
// =====================================================

const newsTable =
    document.getElementById("newsTable");

const searchBox =
    document.getElementById("searchNews");

const dateFilter =
    document.getElementById("dateFilter");

const clearDate =
    document.getElementById("clearDate");

const homeBtn =
    document.getElementById("homeNews");


// =====================================================
// DATA
// =====================================================

let allNews = [];

let currentFilter = "all";


// =====================================================
// FILTER BUTTONS
// =====================================================

document
    .querySelectorAll(".filterBtn")
    .forEach(btn => {

        btn.addEventListener("click", () => {

            document
                .querySelectorAll(".filterBtn")
                .forEach(b => {
                    b.classList.remove("active");
                });

            btn.classList.add("active");

            currentFilter =
                btn.dataset.type || "all";

            applyFilter();

        });

    });


// =====================================================
// CATEGORY LINKS
// =====================================================

const categoryLinks =
    document.querySelectorAll(".category-link");


categoryLinks.forEach(link => {

    link.addEventListener("click", e => {

        e.preventDefault();

        const category =
            String(
                link.dataset.category || ""
            )
            .trim()
            .toLowerCase();


        console.log(
            "🔥 CATEGORY CLICK:",
            category
        );


        let filtered =
            allNews.filter(item => {

                // CATEGORY PAGE = ARTICLES ONLY
                if (item.type !== "news") {
                    return false;
                }


                const itemCategory =
                    String(
                        item.category || ""
                    )
                    .trim()
                    .toLowerCase();


                const status =
                    String(
                        item.status || ""
                    )
                    .trim()
                    .toLowerCase();


                return (
                    status === "published" &&
                    itemCategory === category
                );

            });


        // SORT LATEST
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


        console.log(
            "CATEGORY:",
            category,
            "RESULTS:",
            filtered.length
        );

    });

});


// =====================================================
// APPLY MAIN FILTER
// =====================================================

function applyFilter() {

    let filtered =
        allNews.filter(item => {

            // ARTICLES
            if (item.type === "news") {

                const status =
                    String(
                        item.status || ""
                    )
                    .trim()
                    .toLowerCase();

                return status === "published";

            }


            // VIDEOS
            if (item.type === "video") {
                return true;
            }


            return false;

        });


    // NEWS ONLY
    if (currentFilter === "news") {

        filtered =
            filtered.filter(
                item =>
                    item.type === "news"
            );

    }


    // VIDEO ONLY
    if (currentFilter === "video") {

        filtered =
            filtered.filter(
                item =>
                    item.type === "video"
            );

    }


    // SORT LATEST
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


// =====================================================
// RENDER NEWS TABLE
// =====================================================

function renderNews(newsList) {

    if (!newsTable) {
        console.error(
            "❌ newsTable not found."
        );
        return;
    }


    newsTable.innerHTML = "";


    // EMPTY
    if (!newsList || newsList.length === 0) {

        newsTable.innerHTML = `
            <tr>
                <td
                    colspan="6"
                    style="
                        text-align:center;
                        padding:40px;
                    "
                >
                    No news found.
                </td>
            </tr>
        `;

        return;

    }


    // =================================================
    // RENDER EACH ITEM
    // =================================================

    newsList.forEach(item => {

        const title =
            item.headline ||
            item.title ||
            "Untitled";


        const category =
            item.category ||
            "-";


        const author =
            item.author ||
            "-";


        // IMAGE
        const image =
            item.type === "video"
                ? (
                    item.thumbnail ||
                    item.featuredImage ||
                    "../images/PRIMETIME NEWS LOGO.png"
                )
                : (
                    item.featuredImage ||
                    "../images/PRIMETIME NEWS LOGO.png"
                );


        // DATE
        const timestamp =
            item.publishedAt?.seconds ||
            item.createdAt?.seconds ||
            0;


        let publishDate = "-";


        if (timestamp) {

            publishDate =
                new Date(
                    timestamp * 1000
                )
                .toLocaleDateString(
                    "en-US",
                    {
                        month: "short",
                        day: "numeric",
                        year: "numeric"
                    }
                );

        }


        // TYPE BADGE
        let typeBadge = "";


        if (item.type === "video") {

            typeBadge = `
                <span class="typeBadge video">
                    <i class="fab fa-youtube"></i>
                    VIDEO
                </span>
            `;

        } else {

            typeBadge = `
                <span class="typeBadge news">
                    <i class="fas fa-newspaper"></i>
                    ARTICLE
                </span>
            `;

        }


        // =================================================
        // ROW
        // =================================================

        const row =
            document.createElement("tr");


        row.innerHTML = `

            <!-- IMAGE -->

            <td>

                <img
                    src="${escapeHtml(image)}"
                    class="thumb"
                    alt="News image"
                    onerror="
                        this.onerror=null;
                        this.src='../images/PRIMETIME NEWS LOGO.png';
                    "
                >

            </td>


            <!-- TITLE -->

            <td>

                ${typeBadge}

                <div class="headlineText">
                    ${escapeHtml(title)}
                </div>

            </td>


            <!-- CATEGORY -->

            <td>

                ${escapeHtml(category)}

            </td>


            <!-- AUTHOR -->

            <td>

                ${escapeHtml(author)}

            </td>


            <!-- STATUS -->

            <td class="statusColumn">

                <span class="publishedBadge">

                    <i class="fas fa-circle-check"></i>

                    Published

                </span>


                <div class="publishDate">

                    ${publishDate}

                </div>

            </td>


            <!-- ACTIONS -->

            <td>

                <button
                    class="editBtn"
                    onclick="
                        editContent(
                            '${item.id}',
                            '${item.type}'
                        )
                    "
                    title="Edit"
                >

                    <i class="fas fa-edit"></i>

                </button>


                <button
                    class="deleteBtn"
                    onclick="
                        deleteContent(
                            '${item.id}',
                            '${item.type}'
                        )
                    "
                    title="Delete"
                >

                    <i class="fas fa-trash"></i>

                </button>

            </td>

        `;


        newsTable.appendChild(row);

    });

}


// =====================================================
// ESCAPE HTML
// =====================================================

function escapeHtml(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


// =====================================================
// LOAD NEWS + VIDEOS
// =====================================================

async function loadNews() {

    if (!newsTable) {

        console.error(
            "❌ newsTable not found."
        );

        return;

    }


    try {

        newsTable.innerHTML = `

            <tr>

                <td
                    colspan="6"
                    style="
                        text-align:center;
                        padding:40px;
                    "
                >

                    Loading...

                </td>

            </tr>

        `;


        allNews = [];


        // =================================================
        // LOAD NEWS
        // =================================================

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


        // =================================================
        // LOAD VIDEOS
        // =================================================

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


        // =================================================
        // SORT
        // =================================================

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


        // =================================================
        // DISPLAY
        // =================================================

        applyFilter();


        console.log(
            "✅ TOTAL CONTENT:",
            allNews.length
        );


    } catch (error) {

        console.error(
            "❌ LOAD NEWS ERROR:",
            error
        );


        newsTable.innerHTML = `

            <tr>

                <td
                    colspan="6"
                    style="
                        text-align:center;
                        padding:40px;
                        color:#b00020;
                    "
                >

                    Failed to load news.

                    <br>

                    Check browser console.

                </td>

            </tr>

        `;

    }

}


// =====================================================
// SEARCH
// =====================================================

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


            // PUBLISHED ARTICLES ONLY
            filtered =
                filtered.filter(item => {

                    if (item.type === "news") {

                        return (
                            String(
                                item.status || ""
                            )
                            .trim()
                            .toLowerCase()
                            === "published"
                        );

                    }


                    return true;

                });


            // TYPE FILTER
            if (currentFilter === "news") {

                filtered =
                    filtered.filter(
                        item =>
                            item.type === "news"
                    );

            }


            if (currentFilter === "video") {

                filtered =
                    filtered.filter(
                        item =>
                            item.type === "video"
                    );

            }


            // SORT
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


// =====================================================
// DELETE
// =====================================================

window.deleteContent =
    async (id, type) => {

        if (
            !confirm(
                "Delete this item?"
            )
        ) {
            return;
        }


        try {

            const collectionName =
                type === "video"
                    ? "videos"
                    : "news";

            // News images are stored in Cloudinary while their URLs are
            // stored in Firestore. Remove the Cloudinary assets first so
            // deleting the Firestore document does not leave orphan files.
            if (type !== "video") {

                const newsRef = doc(db, collectionName, id);
                const newsSnap = await getDoc(newsRef);

                if (newsSnap.exists()) {

                    const news = newsSnap.data();
                    const imageUrls = [];

                    if (Array.isArray(news.gallery)) {
                        imageUrls.push(...news.gallery);
                    }

                    if (news.featuredImage) {
                        imageUrls.push(news.featuredImage);
                    }

                    const publicIds = [...new Set(
                        imageUrls
                            .map(extractCloudinaryPublicId)
                            .filter(Boolean)
                    )];

                    if (publicIds.length) {
                        await deleteCloudinaryAssets(publicIds);
                    }
                }
            }

            await deleteDoc(
                doc(
                    db,
                    collectionName,
                    id
                )
            );


            console.log(
                "🗑️ DELETED:",
                collectionName,
                id
            );


            // RELOAD
            await loadNews();


        } catch (error) {

            console.error(
                "❌ DELETE ERROR:",
                error
            );


            alert(
                "Failed to delete item: " +
                error.message
            );

        }

    };


// =====================================================
// EDIT
// =====================================================

window.editContent =
    (id, type) => {

        if (type === "video") {

            window.location.href =
                `add-video.html?id=${id}`;

        } else {

            window.location.href =
                `add-news.html?id=${id}`;

        }

    };


// =====================================================
// HOME
// =====================================================

if (homeBtn) {

    homeBtn.addEventListener(
        "click",
        e => {

            e.preventDefault();


            currentFilter = "all";


            document
                .querySelectorAll(".filterBtn")
                .forEach(btn => {

                    btn.classList.remove(
                        "active"
                    );

                });


            document
                .querySelector(
                    '[data-type="all"]'
                )
                ?.classList.add("active");


            if (searchBox) {

                searchBox.value = "";

            }


            if (dateFilter) {

                dateFilter.value = "";

            }


            applyFilter();

        }
    );

}


// =====================================================
// DATE FILTER
// =====================================================

if (dateFilter) {

    dateFilter.addEventListener(
        "change",
        () => {

            const value =
                dateFilter.value;


            let filtered =
                allNews.filter(item => {

                    if (item.type === "news") {

                        return (
                            String(
                                item.status || ""
                            )
                            .trim()
                            .toLowerCase()
                            === "published"
                        );

                    }


                    return true;

                });


            // TYPE
            if (currentFilter === "news") {

                filtered =
                    filtered.filter(
                        item =>
                            item.type === "news"
                    );

            }


            if (currentFilter === "video") {

                filtered =
                    filtered.filter(
                        item =>
                            item.type === "video"
                    );

            }


            // DATE
            if (value) {

                filtered =
                    filtered.filter(item => {

                        const timestamp =
                            item.publishedAt?.seconds ||
                            item.createdAt?.seconds;


                        if (!timestamp) {

                            return false;

                        }


                        const date =
                            new Date(
                                timestamp * 1000
                            );


                        const yyyy =
                            date.getFullYear();


                        const mm =
                            String(
                                date.getMonth() + 1
                            )
                            .padStart(2, "0");


                        const dd =
                            String(
                                date.getDate()
                            )
                            .padStart(2, "0");


                        const itemDate =
                            `${yyyy}-${mm}-${dd}`;


                        return (
                            itemDate === value
                        );

                    });

            }


            // SORT
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


// =====================================================
// CLEAR DATE
// =====================================================

if (clearDate) {

    clearDate.addEventListener(
        "click",
        () => {

            if (dateFilter) {

                dateFilter.value = "";

            }


            applyFilter();

        }
    );

}


// =====================================================
// START
// =====================================================

console.log(
    "🔥 NEWS.JS LOADED"
);


loadNews();
