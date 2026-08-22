import { db } from "./firebase.js";

import {
    collection,
    doc,
    getDoc,
    getDocs
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

import { loadTheme } from "./theme.js";

loadTheme();

let viewsChart = null;
let categoryChart = null;

async function loadWebsiteSettings() {

    try {

        const ref = doc(db, "settings", "website");

        const snap = await getDoc(ref);

        if (!snap.exists()) {
            return;
        }

        const data = snap.data();

        const siteName =
            document.getElementById("siteName");

        if (siteName) {

            siteName.textContent =
                data.websiteName ||
                "Primetime News Cotabato";

        }

        const websiteLogo =
            document.getElementById("websiteLogo");

        if (
            websiteLogo &&
            data.websiteLogo
        ) {

            websiteLogo.src =
                data.websiteLogo;

        }

        document.title =
            data.websiteName ||
            "Primetime News Cotabato";

    } catch (error) {

        console.error(
            "Failed to load website settings:",
            error
        );

    }

}

loadWebsiteSettings();

function updateClock() {

    const now = new Date();

    document.getElementById("clock").textContent =
        now.toLocaleTimeString();

    document.getElementById("currentDate").textContent =
        now.toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric"
        });

}

updateClock();

setInterval(updateClock, 1000);


// =============================
// LOAD ANALYTICS
// =============================

async function loadAnalytics() {

    try {

        // ===========================
        // NEWS
        // ===========================

       // ===========================
// NEWS + VIDEOS
// ===========================

const newsSnap =
    await getDocs(collection(db, "news"));

const videosSnap =
    await getDocs(collection(db, "videos"));

// ===========================
// TOTAL COUNTS
// ===========================

const totalArticle = newsSnap.size;
const totalVideos = videosSnap.size;
const totalUploads = totalArticle + totalVideos;

let totalViews = 0;

const categoryCount = {};
const topNews = [];

let mostReadTitle = "No Data";
let mostReadViews = 0;


// ===========================
// PROCESS ARTICLES
// ===========================

newsSnap.forEach((docSnap) => {

    const news = docSnap.data();

    const views =
        Number(news.views || news.viewCount || 0);

    totalViews += views;

    const category =
        news.category || "General";

    categoryCount[category] =
        (categoryCount[category] || 0) + 1;


    // MOST READ

    if (views > mostReadViews) {

        mostReadViews = views;

        mostReadTitle =
            news.headline ||
            news.title ||
            "Untitled";
    }


    // TOP CONTENT

    topNews.push({
    id: docSnap.id,

    type: "article",

    title:
        news.headline ||
        news.title ||
        "Untitled",

    category: category,

    views: views
});

});

const settingsMenu = document.getElementById("settingsMenu");

if (settingsMenu) {
    settingsMenu.onclick = () => {
        location.href = "settings.html";
    };
}


// ===========================
// PROCESS VIDEOS
// ===========================

videosSnap.forEach((docSnap) => {

    const video = docSnap.data();

    const views =
        Number(video.views || video.viewCount || 0);

    totalViews += views;

    const category =
        video.category || "Videos";

    categoryCount[category] =
        (categoryCount[category] || 0) + 1;


    // MOST READ VIDEO

    if (views > mostReadViews) {

        mostReadViews = views;

        mostReadTitle =
            video.title ||
            video.headline ||
            "Untitled Video";
    }


    // TOP CONTENT

    topNews.push({

        id: docSnap.id,

        type: "video",

        title:
            video.title ||
            video.headline ||
            "Untitled Video",

        category:
            category,

        views:
            views

    });

});


console.log(
    "ARTICLES:",
    totalArticle
);

console.log(
    "VIDEOS:",
    videosSnap.size
);

console.log(
    "TOTAL ARTICLES:",
    totalArticle
);

console.log(
    "TOTAL VIDEOS:",
    totalVideos
);

console.log(
    "TOTAL UPLOADS:",
    totalUploads
);

console.log(
    "TOTAL VIEWS:",
    totalViews
);

console.log(
    "CATEGORY COUNT:",
    categoryCount
);

const totalArticleEl =
    document.getElementById("totalArticle");

const totalVideosEl =
    document.getElementById("totalVideos");

const totalUploadsEl =
    document.getElementById("totalUploads");

const totalViewsEl =
    document.getElementById("totalViews");


if (totalArticleEl) {
    totalArticleEl.textContent = totalArticle;
}

if (totalVideosEl) {
    totalVideosEl.textContent = totalVideos;
}

if (totalUploadsEl) {
    totalUploadsEl.textContent = totalUploads;
}


if (totalViewsEl) {
    totalViewsEl.textContent =
        totalViews.toLocaleString();
}


        // ===========================
        // USERS
        // ===========================

        const usersSnap = await getDocs(collection(db, "users"));

        let totalUsers = 0;

        let superAdmins = 0;
        let admins = 0;
        let editors = 0;
        let reporters = 0;

        usersSnap.forEach((docSnap) => {

            totalUsers++;

            const user = docSnap.data();

            switch (user.role) {

                case "Super Admin":
                    superAdmins++;
                    break;

                case "Admin":
                    admins++;
                    break;

                case "Editor":
                    editors++;
                    break;

                case "Reporter":
                    reporters++;
                    break;

            }

        });

        const totalUsersEl = document.getElementById("totalUsers");
if (totalUsersEl) {
    totalUsersEl.textContent = totalUsers;
}

        document.getElementById("superAdmins").textContent = superAdmins;

        document.getElementById("admins").textContent = admins;

        document.getElementById("editors").textContent = editors;

        document.getElementById("reporters").textContent = reporters;

        // ===========================
        // TOP NEWS TABLE
        // ===========================

        topNews.sort((a, b) => b.views - a.views);

        const tbody = document.getElementById("topNewsTable");

        tbody.innerHTML = "";

        topNews.slice(0, 10).forEach(news => {

    tbody.innerHTML += `
<tr class="top-content-row"
    data-id="${news.id || ""}"
    data-type="${news.type || "article"}">

    <td>
        <span class="top-content-link">
            ${news.title}
        </span>
    </td>

    <td>
        ${news.views.toLocaleString()}
    </td>

</tr>
`;

});


// =============================
// CLICK TOP VIEWED CONTENT
// =============================

tbody.querySelectorAll(".top-content-row")
    .forEach(row => {

        row.addEventListener("click", () => {

            const id =
                row.dataset.id;

            const type =
                row.dataset.type;

            if (!id) return;


            // =========================
            // ARTICLE
            // =========================

            if (type === "article") {

                window.location.href =
                    `../article.html?id=${encodeURIComponent(id)}`;

                return;
            }


            // =========================
            // VIDEO
            // =========================

            if (type === "video") {

                window.location.href =
                    `../index.html?video=${encodeURIComponent(id)}`;

                return;
            }

        });

    });



      // ===========================
// CATEGORY CHART
// ===========================

if (categoryChart) {
    categoryChart.destroy();
}

categoryChart = new Chart(
    document.getElementById("categoryChart"),
    {
        type: "doughnut",
        data: {
            labels: Object.keys(categoryCount),
            datasets: [{
                data: Object.values(categoryCount)
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: "bottom"
                }
            }
        }
    }
);



// ===========================
// VIEWS CHART
// ===========================

if (viewsChart) viewsChart.destroy();

viewsChart = new Chart(
    document.getElementById("viewsChart"),
    {
        type: "bar",
        data: {
            labels: topNews
                .slice(0, 5)
                .map(n => n.title.substring(0, 20) + "..."),
            datasets: [{
                label: "Views",
                data: topNews
                    .slice(0, 5)
                    .map(n => n.views)
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    }
);
    }

    catch (err) {

        console.error(err);

    }

}

loadAnalytics();



// ==========================
// SIDEBAR NAVIGATION
// ==========================

const dashboardBtn = document.getElementById("dashboardBtn");
if (dashboardBtn) {
    dashboardBtn.addEventListener("click", () => {
        window.location.href = "dashboard.html";
    });
}

const categorySidebarBtn = document.getElementById("categorySidebarBtn");
if (categorySidebarBtn) {
    categorySidebarBtn.addEventListener("click", () => {
        window.location.href = "categories.html";
    });
}

const usersBtn = document.getElementById("usersBtn");
if (usersBtn) {
    usersBtn.addEventListener("click", () => {
        window.location.href = "users.html";
    });
}

const settingsBtn = document.getElementById("settingsBtn");
if (settingsBtn) {
    settingsBtn.addEventListener("click", () => {
        window.location.href = "settings.html";
    });
}