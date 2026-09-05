import { db } from "./firebase.js";
import { collection, getDocs, query, where, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

// ===============================
// PAGE INFO
// ===============================

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


// ===============================
// CHECK PAGE
// ===============================

const currentPage =
    pageInfo[page];

if (!currentPage) {

    console.error(
        "❌ Unknown category page:",
        page
    );

}


// ===============================
// PAGE TITLE
// ===============================

if (pageTitle && currentPage) {

    pageTitle.textContent =
        currentPage.title;

}

if (pageSubtitle && currentPage) {

    pageSubtitle.textContent =
        currentPage.subtitle;

}

if (currentPage) {

    document.title =
        `${currentPage.title} | Primetime News Cotabato`;

}


// ===============================
// CURRENT CATEGORY
// ===============================

const CURRENT_CATEGORY =
    currentPage?.category || "";


// ===============================
// ELEMENTS
// ===============================

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



const tickerList = document.getElementById( "tickerList" ); // PARA SA AUTO SLIDE


// IMPORTANT:
// HTML mo currently walang id="searchInput"
// Kaya iche-check natin pareho.

const searchInput =
    document.getElementById(
        "searchInput"
    ) ||
    document.querySelector(
        ".search-box input"
    );


let newsData = [];


// ===============================
// NORMALIZE TEXT
// ===============================

function normalizeCategory(value) {

    return String(value || "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ");

}


// ===============================
// LOAD NEWS
// ===============================

async function loadNews() {

    console.log(
        "================================="
    );

    console.log(
        "🔥 CATEGORY NEWS LOADING"
    );

    console.log(
        "PAGE:",
        page
    );

    console.log(
        "TARGET CATEGORY:",
        CURRENT_CATEGORY
    );

    console.log(
        "================================="
    );


    if (featuredContent) {

        featuredContent.innerHTML = `
            <p>Loading...</p>
        `;

    }

    if (contentList) {

        contentList.innerHTML = "";

    }

    if (sidebarContent) {

        sidebarContent.innerHTML = "";

    }


    try {

        // =============================
        // LOAD ALL NEWS
        // =============================

        const snapshot =
            await getDocs(
                collection(db, "news")
            );


        newsData = [];


        console.log(
            "📰 TOTAL FIRESTORE NEWS:",
            snapshot.size
        );


        snapshot.forEach(
            docSnap => {

                const news =
                    docSnap.data();


                const status =
                    String(
                        news.status || ""
                    )
                    .trim()
                    .toLowerCase();


                const savedCategory =
                    normalizeCategory(
                        news.category
                    );


                const targetCategory =
                    normalizeCategory(
                        CURRENT_CATEGORY
                    );


                console.log(
                    "---------------------------------"
                );

                console.log(
                    "HEADLINE:",
                    news.headline
                );

                console.log(
                    "CATEGORY SAVED:",
                    news.category
                );

                console.log(
                    "CATEGORY NORMALIZED:",
                    savedCategory
                );

                console.log(
                    "TARGET CATEGORY:",
                    targetCategory
                );

                console.log(
                    "STATUS:",
                    news.status
                );


                // =============================
                // PUBLISHED ONLY
                // =============================

                if (
                    status !==
                    "published"
                ) {

                    console.log(
                        "⏭️ SKIPPED: not published"
                    );

                    return;

                }


                // =============================
                // CATEGORY MATCH
                // =============================

                if (
                    savedCategory !==
                    targetCategory
                ) {

                    console.log(
                        "⏭️ SKIPPED: category mismatch"
                    );

                    return;

                }


                // =============================
                // ADD NEWS
                // =============================

                newsData.push({

                    id:
                        docSnap.id,

                    ...news

                });


                console.log(
                    "✅ CATEGORY MATCH"
                );

            }
        );


        // =============================
        // SORT LATEST
        // =============================

        newsData.sort(
            (a, b) => {

                const A =
                    a.publishedAt?.seconds ||
                    a.createdAt?.seconds ||
                    0;

                const B =
                    b.publishedAt?.seconds ||
                    b.createdAt?.seconds ||
                    0;


                return B - A;

            }
        );


        console.log(
            "================================="
        );

        console.log(
            "✅ FINAL CATEGORY:",
            CURRENT_CATEGORY
        );

        console.log(
            "✅ RESULTS:",
            newsData.length
        );

        console.log(
            "✅ NEWS DATA:",
            newsData
        );

        console.log(
            "================================="
        );


        // =============================
        // NO NEWS
        // =============================

        if (
            newsData.length === 0
        ) {

            if (featuredContent) {

                featuredContent.innerHTML = `

                    <div class="no-news">

                        <h2>
                            No ${currentPage.title} Found
                        </h2>

                        <p>
                            No published news available
                            in this category.
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


        // =============================
        // FEATURED
        // =============================

        renderFeaturedNews(
            newsData[0]
        );


        // =============================
        // LIST
        // =============================

        renderNewsList(
            newsData.slice(1)
        );


        // =============================
        // MOST READ
        // =============================

        renderMostRead( newsData );
loadLatestTicker(); 








        
    }

    catch (err) {

        console.error(
            "❌ CATEGORY NEWS ERROR:",
            err
        );


        if (featuredContent) {

            featuredContent.innerHTML = `

                <div class="no-news">

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


// ===============================
// FEATURED NEWS
// ===============================

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
        CURRENT_CATEGORY;


    const summary =
        news.summary ||
        "";


    const publishedDate =
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


    const author =
        news.author ||
        "Primetime News Cotabato";


    const views =
        news.views ||
        0;


    featuredContent.innerHTML = `

        <div
            class="featured-news"
            data-id="${news.id}"
        >

            <img
                src="${image}"
                class="featured-image"
                alt="${headline}"
                onerror="
                    this.onerror=null;
                    this.src='images/news1.jpg';
                "
            >


            <div class="featured-overlay">

                <span class="badge">
                    ${category}
                </span>


                <div class="news-meta">

                    <span>

                        <i class="fas fa-calendar-alt"></i>

                        ${publishedDate}

                    </span>


                    <span>

                        <i class="fas fa-user"></i>

                        ${author}

                    </span>


                    <span>

                        <i class="fas fa-eye"></i>

                        ${views} Views

                    </span>

                </div>


                <h2>
                    ${headline}
                </h2>


                <p>
                    ${summary}
                </p>


                <button
                    class="read-btn"
                    data-id="${news.id}"
                    type="button"
                >

                    Read Full Story

                </button>

            </div>

        </div>

    `;

}


// ===============================
// NEWS LIST
// ===============================

function renderNewsList(newsList) {

    if (!contentList) {
        return;
    }


    if (!newsList.length) {

        contentList.innerHTML = "";

        return;

    }


    let html = "";


    newsList.forEach(
        news => {

            const image =
                news.featuredImage ||
                "images/news1.jpg";


            const headline =
                news.headline ||
                news.title ||
                "Primetime News";


            const summary =
                news.summary ||
                "";


            const category =
                news.category ||
                CURRENT_CATEGORY;


            const views =
                news.views ||
                0;


            html += `

                <div
                    class="news-card"
                    data-id="${news.id}"
                >

                    <img
                        src="${image}"
                        alt="${headline}"
                        loading="lazy"
                        onerror="
                            this.onerror=null;
                            this.src='images/news1.jpg';
                        "
                    >


                    <div class="news-info">

                        <span class="badge">

                            ${category}

                        </span>


                        <h3>

                            ${headline}

                        </h3>


                        <p>

                            ${summary}

                        </p>


                        <div class="news-meta">

                            <span>

                                <i class="fas fa-eye"></i>

                                ${views} Views

                            </span>

                        </div>

                    </div>

                </div>

            `;

        }
    );


    contentList.innerHTML =
        html;

}


// ===============================
// MOST READ
// ===============================

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
        .forEach(
            news => {

                const image =
                    news.featuredImage ||
                    "images/news1.jpg";


                const headline =
                    news.headline ||
                    news.title ||
                    "News";


                const category =
                    news.category ||
                    "";


                const views =
                    news.views ||
                    0;


                html += `

                    <a
                        href="article.html?id=${news.id}"
                        class="most-read-item"
                        data-id="${news.id}"
                    >

                        <img
                            src="${image}"
                            alt="${headline}"
                            loading="lazy"
                            onerror="
                                this.onerror=null;
                                this.src='images/news1.jpg';
                            "
                        >


                        <div
                            class="most-read-content"
                        >

                            <span class="badge">

                                ${category}

                            </span>


                            <h4>

                                ${headline}

                            </h4>


                            <small>

                                <i class="fas fa-eye"></i>

                                ${views} Views

                            </small>

                        </div>

                    </a>

                `;

            }
        );


    sidebarContent.innerHTML =
        html;

}







// ===============================
// LATEST TICKER - AUTO SLIDE
// ===============================
function loadLatestTicker() {
  if (!tickerList) return;
  
  const latest = newsData.slice(0, 6); // kuha 6 pinakabago
  if (latest.length === 0) {
    tickerList.innerHTML = "<p>No news</p>";
    return;
  }
  
  let html = "";
  latest.forEach(news => {
    const headline = news.headline || "News";
    const time = news.publishedAt?.seconds ? new Date(news.publishedAt.seconds * 1000).toLocaleTimeString("en-US", {hour: "2-digit", minute:"2-digit"}) : "";
    
    html += `
      <a href="article.html?id=${news.id}" class="ticker-item">
        <span class="ticker-time">${time}</span>
        <h4>${headline}</h4>
      </a>
    `;
  });
  
  tickerList.innerHTML = html;
  
  // AUTO SLIDE
  let currentIndex = 0;
  const items = tickerList.querySelectorAll('.ticker-item');
  const itemHeight = 70; // dapat same sa CSS height
  
  setInterval(() => {
    currentIndex++;
    if (currentIndex >= items.length) currentIndex = 0;
    tickerList.style.transform = `translateY(-${currentIndex * itemHeight}px)`;
  }, 3000); // 3 seconds bago magpalit
}









// ===============================
// NEWS CLICK HANDLER
// ===============================

document.addEventListener(
    "click",
    (e) => {

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


// ===============================
// SEARCH
// ===============================

if (searchInput) {

    searchInput.addEventListener(
        "input",
        () => {

            const keyword =
                searchInput.value
                    .toLowerCase()
                    .trim();


            // =========================
            // EMPTY SEARCH
            // =========================

            if (!keyword) {

                renderFeaturedNews(
                    newsData[0]
                );


                renderNewsList(
                    newsData.slice(1)
                );


                renderMostRead(
                    newsData
                );



                


                return;

            }


            // =========================
            // FILTER
            // =========================

            const filtered =
                newsData.filter(
                    news => {

                        const headline =
                            String(
                                news.headline ||
                                news.title ||
                                ""
                            )
                            .toLowerCase();


                        const summary =
                            String(
                                news.summary ||
                                ""
                            )
                            .toLowerCase();


                        return (
                            headline.includes(
                                keyword
                            ) ||
                            summary.includes(
                                keyword
                            )
                        );

                    }
                );


            // =========================
            // SEARCH RESULT
            // =========================

            if (
                filtered.length > 0
            ) {

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

            else {

                if (featuredContent) {

                    featuredContent.innerHTML = `

                        <div class="no-news">

                            <h2>
                                No News Found
                            </h2>

                            <p>
                                No article matches
                                your search.
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

            }

        }
    );

}


// ===============================
// MOBILE MENU
// ===============================

document.addEventListener(
    "DOMContentLoaded",
    function () {

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


        // =========================
        // OPEN / CLOSE
        // =========================

        menuToggle.addEventListener(
            "click",
            function (e) {

                e.stopPropagation();

                navLinks.classList.toggle(
                    "active"
                );

            }
        );


        // =========================
        // CLOSE AFTER LINK
        // =========================

        navLinks
            .querySelectorAll("a")
            .forEach(
                function (link) {

                    link.addEventListener(
                        "click",
                        function () {

                            navLinks.classList.remove(
                                "active"
                            );

                        }
                    );

                }
            );


        // =========================
        // CLICK OUTSIDE
        // =========================

        document.addEventListener(
            "click",
            function (e) {

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








// ===============================
// START
// ===============================

console.log(
    "🔥 CATEGORY-NEWS.JS LOADED"
);

console.log(
    "📂 PAGE:",
    page
);

console.log(
    "📂 CATEGORY:",
    CURRENT_CATEGORY
);


loadNews();
