import { auth, db } from "./firebase.js";
import { loadTheme } from "./theme.js";

import {
    doc,
    getDoc,
    updateDoc,
    collection,
    getDocs,
    query,
    orderBy,
    limit,
    serverTimestamp,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

import {
    signOut
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";


// =====================================================
// LOAD THEME
// =====================================================

loadTheme();


// =====================================================
// WEBSITE SETTINGS
// =====================================================

async function loadWebsiteSettings() {

    try {

        const ref = doc(db, "settings", "website");
        const snap = await getDoc(ref);

        if (!snap.exists()) {
            console.log("Website settings not found.");
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

        const siteLogo =
            document.getElementById("siteLogo");

        if (siteLogo && data.websiteLogo) {

            siteLogo.src =
                data.websiteLogo;

        }

    } catch (error) {

        console.error(
            "Failed to load website settings:",
            error
        );

    }

}

loadWebsiteSettings();


// =====================================================
// WEATHER
// =====================================================

const weatherTemp =
    document.getElementById("weatherTemp");

const weatherCondition =
    document.getElementById("weatherCondition");

const weatherHumidity =
    document.getElementById("weatherHumidity");

const weatherWind =
    document.getElementById("weatherWind");

const weatherSunrise =
    document.getElementById("weatherSunrise");

const weatherSunset =
    document.getElementById("weatherSunset");


function setWeatherLoading(message) {

    if (weatherTemp) {
        weatherTemp.textContent = message;
    }

    if (weatherCondition) {
        weatherCondition.textContent = message;
    }

}


function formatWeatherTime(timestamp) {

    if (!timestamp) {
        return "--";
    }

    return new Date(timestamp * 1000)
        .toLocaleTimeString("en-PH", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true
        });

}


async function loadWeather() {

    try {

        const settingsRef =
            doc(db, "settings", "website");

        const settingsSnap =
            await getDoc(settingsRef);

        if (!settingsSnap.exists()) {

            setWeatherLoading(
                "Weather unavailable"
            );

            return;
        }

        const settings =
            settingsSnap.data();

        const city =
            settings.weatherCity ||
            "Cotabato City";

        const apiKey =
            settings.weatherApiKey;

        const unit =
            settings.weatherUnit ||
            "metric";

        if (!apiKey) {

            console.error(
                "Weather API key is empty."
            );

            setWeatherLoading(
                "Weather unavailable"
            );

            return;
        }

        const url =
            `https://api.openweathermap.org/data/2.5/weather` +
            `?q=${encodeURIComponent(city)}` +
            `&units=${unit}` +
            `&appid=${apiKey}`;

        const response =
            await fetch(url);

        if (!response.ok) {

            const errorData =
                await response.json()
                    .catch(() => ({}));

            console.error(
                "OpenWeather error:",
                errorData
            );

            setWeatherLoading(
                "Weather unavailable"
            );

            return;
        }

        const data =
            await response.json();


        if (weatherTemp) {

            weatherTemp.textContent =
                `${Math.round(data.main.temp)}°C`;

        }


        if (weatherCondition) {

            const description =
                data.weather?.[0]?.description ||
                "Unknown";

            weatherCondition.textContent =
                description.charAt(0).toUpperCase() +
                description.slice(1);

        }


        if (weatherHumidity) {

            weatherHumidity.textContent =
                `${data.main.humidity}%`;

        }


        if (weatherWind) {

            weatherWind.textContent =
                `${data.wind?.speed ?? 0} m/s`;

        }


        if (weatherSunrise) {

            weatherSunrise.textContent =
                formatWeatherTime(
                    data.sys?.sunrise
                );

        }


        if (weatherSunset) {

            weatherSunset.textContent =
                formatWeatherTime(
                    data.sys?.sunset
                );

        }

        console.log(
            "Dashboard Weather Loaded:",
            data
        );

    } catch (error) {

        console.error(
            "Weather loading error:",
            error
        );

        setWeatherLoading(
            "Weather unavailable"
        );

    }

}

loadWeather();


// =====================================================
// FIRESTORE DATE HELPERS
// =====================================================

function getFirestoreTime(timestamp) {

    if (!timestamp) {
        return 0;
    }

    if (
        typeof timestamp === "object" &&
        typeof timestamp.toDate === "function"
    ) {

        return timestamp.toDate().getTime();

    }

    if (
        typeof timestamp === "object" &&
        typeof timestamp.seconds === "number"
    ) {

        return timestamp.seconds * 1000;

    }

    if (timestamp instanceof Date) {

        return timestamp.getTime();

    }

    if (typeof timestamp === "string") {

        const time =
            new Date(timestamp).getTime();

        return isNaN(time)
            ? 0
            : time;

    }

    return 0;

}


// =====================================================
// DASHBOARD COUNTERS
// =====================================================

async function loadDashboardCounters() {

    try {

        // ---------------------------------------------
        // TOTAL ARTICLES
        // ---------------------------------------------

        const newsSnapshot =
            await getDocs(
                collection(db, "news")
            );


        // ---------------------------------------------
        // TOTAL VIDEOS
        // ---------------------------------------------

        const videoSnapshot =
            await getDocs(
                collection(db, "videos")
            );


        // ---------------------------------------------
        // TOTAL USERS
        // ---------------------------------------------

        const usersSnapshot =
            await getDocs(
                collection(db, "users")
            );


        // ---------------------------------------------
        // ARTICLE COUNT
        // ---------------------------------------------

        const totalArticle =
            document.getElementById(
                "totalArticle"
            );

        if (totalArticle) {

            totalArticle.textContent =
                newsSnapshot.size;

        }


        // ---------------------------------------------
        // VIDEO COUNT
        // ---------------------------------------------

       const videoSnapshot =
    await getDocs(
        collection(db, "videos")
    );

const totalVideos =
    document.getElementById("totalVideos");

if (totalVideos) {

    totalVideos.textContent =
        videoSnapshot.size;

}


        // ==============================
// TOTAL VIDEOS
// ==============================

const videoSnapshot =
    await getDocs(
        collection(db, "videos")
    );

const totalVideos =
    document.getElementById("totalVideos");

if (totalVideos) {

    totalVideos.textContent =
        videoSnapshot.size;

}


// ==============================
// TOTAL UPLOADS
// ARTICLES + VIDEOS
// ==============================

const uploadCount =
    newsSnapshot.size + videoSnapshot.size;

const totalUploads =
    document.getElementById("totalUploads");

if (totalUploads) {

    totalUploads.textContent =
        uploadCount;

}


        

        // ---------------------------------------------
        // TOTAL USERS
        // ---------------------------------------------

        const totalUsers =
            document.getElementById(
                "totalUsers"
            );

        if (totalUsers) {

            totalUsers.textContent =
                usersSnapshot.size;

        }


        console.log(
            "================================="
        );

        console.log(
            "DASHBOARD COUNTERS"
        );

        console.log(
            "Total Articles:",
            newsSnapshot.size
        );

        console.log(
            "Total Videos:",
            videoSnapshot.size
        );

        console.log(
            "Total Users:",
            usersSnapshot.size
        );

        console.log(
            "================================="
        );

    } catch (error) {

        console.error(
            "Dashboard counters error:",
            error
        );

    }

}

loadDashboardCounters();


// =====================================================
// TOTAL CONTENT VIEWS
// =====================================================

async function loadAnalytics() {

    try {

        let totalViews = 0;


        // NEWS VIEWS

        const newsSnap =
            await getDocs(
                collection(db, "news")
            );

        newsSnap.forEach(docSnap => {

            const news =
                docSnap.data();

            totalViews +=
                Number(news.views || 0);

        });


        // VIDEO VIEWS

        const videoSnap =
            await getDocs(
                collection(db, "videos")
            );

        videoSnap.forEach(docSnap => {

            const video =
                docSnap.data();

            totalViews +=
                Number(video.views || 0);

        });


        const totalViewsElement =
            document.getElementById(
                "totalViews"
            );

        if (totalViewsElement) {

            totalViewsElement.textContent =
                totalViews.toLocaleString();

        }

        console.log(
            "Total Content Views:",
            totalViews
        );

    } catch (error) {

        console.error(
            "Analytics error:",
            error
        );

    }

}

loadAnalytics();


// =====================================================
// TODAY VISITORS
// =====================================================

const dailyAnalyticsRef =
    doc(db, "analytics", "daily");

onSnapshot(
    dailyAnalyticsRef,
    snap => {

        const todayVisitors =
            document.getElementById(
                "todayVisitors"
            );

        if (!todayVisitors) {
            return;
        }

        if (!snap.exists()) {

            todayVisitors.textContent =
                "0";

            return;
        }

        todayVisitors.textContent =
            snap.data().todayVisitors || 0;

    },
    error => {

        console.error(
            "Visitor listener error:",
            error
        );

    }
);


// =====================================================
// ADMIN PROFILE
// =====================================================

auth.onAuthStateChanged(async user => {

    if (!user) {
        return;
    }

    try {

        const snap =
            await getDoc(
                doc(
                    db,
                    "users",
                    user.uid
                )
            );

        if (!snap.exists()) {
            return;
        }

        const data =
            snap.data();


        const adminName =
            document.getElementById(
                "adminName"
            );

        if (adminName) {

            adminName.textContent =
                data.name ||
                user.displayName ||
                "Administrator";

        }


        const adminPhoto =
            document.getElementById(
                "adminPhoto"
            );

        if (adminPhoto) {

            adminPhoto.src =
                data.photoURL ||
                "../images/default-user.png";

        }

    } catch (error) {

        console.error(
            "Admin profile error:",
            error
        );

    }

});


// =====================================================
// DASHBOARD PROFILE
// =====================================================

async function loadDashboardProfile() {

    const user =
        auth.currentUser;

    if (!user) {
        return;
    }

    try {

        const userRef =
            doc(
                db,
                "users",
                user.uid
            );

        const snap =
            await getDoc(userRef);

        if (!snap.exists()) {
            return;
        }

        const data =
            snap.data();


        const dashboardName =
            document.getElementById(
                "dashboardName"
            );

        if (dashboardName) {

            dashboardName.textContent =
                data.name ||
                user.displayName ||
                "User";

        }


        const dashboardProfile =
            document.getElementById(
                "dashboardProfile"
            );

        if (dashboardProfile) {

            dashboardProfile.src =
                data.photoURL ||
                "../images/PRIMETIME NEWS LOGO.png";

        }

    } catch (error) {

        console.error(
            "Dashboard profile error:",
            error
        );

    }

}


// =====================================================
// RECENT ACTIVITY
// =====================================================

async function loadRecentActivity() {

    const activityList =
        document.getElementById(
            "recentActivityList"
        );

    if (!activityList) {
        return;
    }

    activityList.innerHTML = `
        <li class="activity-loading">
            <i class="fas fa-spinner fa-spin"></i>
            Loading activity...
        </li>
    `;


    try {

        const newsSnap =
            await getDocs(
                collection(db, "news")
            );

        const videosSnap =
            await getDocs(
                collection(db, "videos")
            );

        const usersSnap =
            await getDocs(
                collection(db, "users")
            );


        const activities = [];


        // ---------------------------------------------
        // NEWS
        // ---------------------------------------------

        newsSnap.forEach(docSnap => {

            const data =
                docSnap.data();

            activities.push({

                type: "article",

                id: docSnap.id,

                title:
                    data.headline ||
                    data.title ||
                    "Untitled Article",

                category:
                    data.category ||
                    "News",

                date:
                    data.publishedAt ||
                    data.createdAt ||
                    null,

                icon:
                    "fas fa-newspaper"

            });

        });


        // ---------------------------------------------
        // VIDEOS
        // ---------------------------------------------

        videosSnap.forEach(docSnap => {

            const data =
                docSnap.data();

            activities.push({

                type: "video",

                id: docSnap.id,

                title:
                    data.title ||
                    data.headline ||
                    "Untitled Video",

                category:
                    data.category ||
                    "Video",

                date:
                    data.createdAt ||
                    data.publishedAt ||
                    null,

                icon:
                    "fas fa-video"

            });

        });


        // ---------------------------------------------
        // USERS
        // ---------------------------------------------

        usersSnap.forEach(docSnap => {

            const data =
                docSnap.data();

            activities.push({

                type: "user",

                title:
                    data.name ||
                    data.displayName ||
                    data.email ||
                    "New User",

                category:
                    data.role ||
                    "User",

                date:
                    data.createdAt ||
                    data.registeredAt ||
                    null,

                icon:
                    "fas fa-user"

            });

        });


        // ---------------------------------------------
        // SORT
        // ---------------------------------------------

        activities.sort((a, b) => {

            return (
                getFirestoreTime(b.date) -
                getFirestoreTime(a.date)
            );

        });


        const totalActivities =
            activities.length;


        const activityCount =
            document.getElementById(
                "activityCount"
            );

        if (activityCount) {

            activityCount.textContent =
                `${totalActivities} Activities`;

        }


        if (totalActivities === 0) {

            activityList.innerHTML = `
                <li class="activity-empty">

                    <i class="fas fa-clock"></i>

                    <div>

                        <strong>
                            No Activities
                        </strong>

                        <p>
                            No recent activity found.
                        </p>

                    </div>

                </li>
            `;

            return;
        }


        activityList.innerHTML = "";


        activities
            .slice(0, 6)
            .forEach(activity => {

                const time =
                    getFirestoreTime(
                        activity.date
                    );


                const formattedDate =
                    time
                        ? new Date(time)
                            .toLocaleString(
                                "en-US",
                                {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                    hour: "numeric",
                                    minute: "2-digit"
                                }
                            )
                        : "Date unavailable";


                const li =
                    document.createElement("li");


                li.className =
                    `activity-item ${activity.type}`;


                li.innerHTML = `

                    <div class="activity-icon">

                        <i class="${activity.icon}"></i>

                    </div>

                    <div class="activity-content">

                        <strong>
                            ${activity.title}
                        </strong>

                        <span class="activity-category">
                            ${activity.category}
                        </span>

                        <small>

                            <i class="far fa-clock"></i>

                            ${formattedDate}

                        </small>

                    </div>

                `;


                activityList.appendChild(li);


                li.addEventListener(
                    "click",
                    () => {

                        if (!activity.id) {
                            return;
                        }


                        if (
                            activity.type === "video"
                        ) {

                            window.location.href =
                                `../videos.html?id=${activity.id}&autoplay=1`;

                        } else if (
                            activity.type === "article"
                        ) {

                            window.location.href =
                                `../article.html?id=${activity.id}`;

                        }

                    }
                );

            });


    } catch (error) {

        console.error(
            "Recent Activity Error:",
            error
        );


        activityList.innerHTML = `

            <li class="activity-empty">

                <i class="fas fa-exclamation-circle"></i>

                <div>

                    <strong>
                        Unable to load activity
                    </strong>

                    <p>
                        Please try again later.
                    </p>

                </div>

            </li>

        `;

    }

}

loadRecentActivity();


// =====================================================
// SIDEBAR NAVIGATION
// =====================================================

document
    .getElementById("dashboardBtn")
    ?.addEventListener(
        "click",
        () => {

            window.location.href =
                "dashboard.html";

        }
    );


document
    .getElementById("analyticsBtn")
    ?.addEventListener(
        "click",
        () => {

            window.location.href =
                "analytics.html";

        }
    );


document
    .getElementById("categorySidebarBtn")
    ?.addEventListener(
        "click",
        () => {

            window.location.href =
                "categories.html";

        }
    );


document
    .getElementById("usersBtn")
    ?.addEventListener(
        "click",
        () => {

            window.location.href =
                "users.html";

        }
    );


document
    .getElementById("settingsMenu")
    ?.addEventListener(
        "click",
        () => {

            window.location.href =
                "settings.html";

        }
    );


// =====================================================
// LOGOUT
// =====================================================

const logoutBtn =
    document.getElementById(
        "logoutBtn"
    );

if (logoutBtn) {

    logoutBtn.addEventListener(
        "click",
        async e => {

            e.preventDefault();

            if (
                !confirm(
                    "Are you sure you want to logout?"
                )
            ) {
                return;
            }

            try {

                if (auth.currentUser) {

                    await updateDoc(
                        doc(
                            db,
                            "users",
                            auth.currentUser.uid
                        ),
                        {
                            status: "Offline",
                            lastSeen:
                                serverTimestamp()
                        }
                    );

                }

                await signOut(auth);

                window.location.replace(
                    "../index.html"
                );

            } catch (error) {

                console.error(
                    "Logout error:",
                    error
                );

                alert(
                    error.message
                );

            }

        }
    );

}


// =====================================================
// MESSAGES
// =====================================================

const messagesBtn =
    document.getElementById(
        "messagesBtn"
    );

const messageDropdown =
    document.getElementById(
        "messageDropdown"
    );

const messageList =
    document.getElementById(
        "messageList"
    );

const messageCount =
    document.getElementById(
        "messageCount"
    );


if (
    messagesBtn &&
    messageDropdown
) {

    messagesBtn.addEventListener(
        "click",
        e => {

            e.stopPropagation();

            messageDropdown.classList.toggle(
                "show"
            );

        }
    );

}


document.addEventListener(
    "click",
    e => {

        if (
            messageDropdown &&
            messagesBtn &&
            !messagesBtn.contains(e.target) &&
            !messageDropdown.contains(e.target)
        ) {

            messageDropdown.classList.remove(
                "show"
            );

        }

    }
);


const messagesQuery =
    query(
        collection(
            db,
            "contactMessages"
        ),
        orderBy(
            "createdAt",
            "desc"
        ),
        limit(5)
    );


if (
    messageList &&
    messageCount
) {

    onSnapshot(
        messagesQuery,
        snapshot => {

            messageList.innerHTML = "";

            let unread = 0;


            if (snapshot.empty) {

                messageList.innerHTML = `
                    <div class="empty-message">

                        <i class="fas fa-inbox"></i>

                        <p>
                            No messages yet.
                        </p>

                    </div>
                `;

                messageCount.style.display =
                    "none";

                return;

            }


            snapshot.forEach(docSnap => {

                const data =
                    docSnap.data();


                if (
                    data.status === "unread"
                ) {

                    unread++;

                }


                const div =
                    document.createElement("div");

                div.className =
                    "message-item";


                div.innerHTML = `

                    <h4>
                        ${data.name || ""}
                    </h4>

                    <p>
                        ${data.subject || ""}
                    </p>

                    <small>
                        ${data.email || ""}
                    </small>

                `;


                messageList.appendChild(div);

            });


            if (unread > 0) {

                messageCount.style.display =
                    "flex";

                messageCount.textContent =
                    unread;

            } else {

                messageCount.style.display =
                    "none";

            }

        },
        error => {

            console.error(
                "Messages listener error:",
                error
            );

        }
    );

}


const viewAllMessages =
    document.getElementById(
        "viewAllMessages"
    );

if (viewAllMessages) {

    viewAllMessages.addEventListener(
        "click",
        () => {

            window.location.href =
                "messages.html";

        }
    );

}


// =====================================================
// LIVE CLOCK
// =====================================================

function updateClock() {

    const now =
        new Date();


    const clock =
        document.getElementById(
            "clock"
        );

    const currentDate =
        document.getElementById(
            "currentDate"
        );


    if (clock) {

        clock.textContent =
            now.toLocaleTimeString(
                "en-PH",
                {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                    hour12: true
                }
            );

    }


    if (currentDate) {

        currentDate.textContent =
            now.toLocaleDateString(
                "en-PH",
                {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric"
                }
            );

    }

}

updateClock();

setInterval(
    updateClock,
    1000
);


// =====================================================
// QUICK ACTIONS
// =====================================================

const addNewsBtn =
    document.getElementById(
        "addNewsBtn"
    );

if (addNewsBtn) {

    addNewsBtn.onclick = () => {

        window.location.href =
            "add-news.html";

    };

}


const addVideoBtn =
    document.getElementById(
        "addVideoBtn"
    );

if (addVideoBtn) {

    addVideoBtn.onclick = () => {

        window.location.href =
            "add-video.html";

    };

}


const liveWebsiteBtn =
    document.getElementById(
        "liveWebsiteBtn"
    );

if (liveWebsiteBtn) {

    liveWebsiteBtn.onclick = () => {

        window.location.href =
            "../index.html?cms=1";

    };

}


const newsManagerBtn =
    document.getElementById(
        "newsManagerBtn"
    );

if (newsManagerBtn) {

    newsManagerBtn.onclick = () => {

        window.location.href =
            "news.html";

    };

}


const viewAllNewsBtn =
    document.getElementById(
        "viewAllNewsBtn"
    );

if (viewAllNewsBtn) {

    viewAllNewsBtn.onclick = () => {

        window.location.href =
            "../latest-news.html";

    };

}


// =====================================================
// LATEST CONTENT
// =====================================================

const newsTable =
    document.getElementById(
        "newsTable"
    );


async function loadLatestContent() {

    if (!newsTable) {
        return;
    }


    newsTable.innerHTML = `
        <tr>
            <td colspan="5"
                style="text-align:center;padding:30px;">
                Loading...
            </td>
        </tr>
    `;


    try {

        const items = [];


        // ---------------------------------------------
        // LOAD NEWS
        // ---------------------------------------------

        const newsSnap =
            await getDocs(
                collection(db, "news")
            );


        newsSnap.forEach(docSnap => {

            const data =
                docSnap.data();


            // Published articles only

            if (
                String(data.status || "")
                    .trim()
                    .toLowerCase()
                !== "published"
            ) {

                return;

            }


            items.push({

                id: docSnap.id,

                type: "news",

                ...data

            });

        });


        // ---------------------------------------------
        // LOAD VIDEOS
        // ---------------------------------------------

        const videoSnap =
            await getDocs(
                collection(db, "videos")
            );


        videoSnap.forEach(docSnap => {

            items.push({

                id: docSnap.id,

                type: "video",

                ...docSnap.data()

            });

        });


        // ---------------------------------------------
        // SORT NEWEST
        // ---------------------------------------------

        items.sort((a, b) => {

            const A =
                getFirestoreTime(
                    a.publishedAt ||
                    a.createdAt
                );

            const B =
                getFirestoreTime(
                    b.publishedAt ||
                    b.createdAt
                );

            return B - A;

        });


        // ---------------------------------------------
        // LATEST 5
        // ---------------------------------------------

        const latest =
            items.slice(0, 5);


        if (latest.length === 0) {

            newsTable.innerHTML = `
                <tr>
                    <td colspan="5"
                        style="text-align:center;padding:30px;">
                        No content found.
                    </td>
                </tr>
            `;

            return;

        }


        newsTable.innerHTML = "";


        // ---------------------------------------------
        // RENDER
        // ---------------------------------------------

        latest.forEach(item => {

            const title =
                item.headline ||
                item.title ||
                "Untitled";


            const category =
                item.category ||
                (item.type === "video"
                    ? "Video"
                    : "News");


            const timestamp =
                item.publishedAt ||
                item.createdAt;


            const date =
                getFirestoreTime(
                    timestamp
                );


            const formattedDate =
                date
                    ? new Date(date)
                        .toLocaleDateString(
                            "en-US",
                            {
                                month: "short",
                                day: "numeric",
                                year: "numeric"
                            }
                        )
                    : "-";


            const row =
                document.createElement("tr");


            row.innerHTML = `

                <td>

                    <span class="typeBadge ${item.type}">

                        ${
                            item.type === "video"

                            ? `
                                <i class="fab fa-youtube"></i>
                                VIDEO
                              `

                            : `
                                <i class="fas fa-newspaper"></i>
                                NEWS ARTICLE
                              `
                        }

                    </span>

                    <br>

                    <strong>
                        ${title}
                    </strong>

                </td>


                <td>

                    <span class="categoryBadge">
                        ${category}
                    </span>

                </td>


                <td>

                    <span class="published">
                        Published
                    </span>

                </td>


                <td>
                    ${formattedDate}
                </td>


                <td>

                    <button
                        class="editBtn"
                        type="button"
                    >

                        <i class="fas fa-edit"></i>

                    </button>

                </td>

            `;


            const editBtn =
                row.querySelector(
                    ".editBtn"
                );


            if (editBtn) {

                editBtn.addEventListener(
                    "click",
                    () => {

                        if (
                            item.type === "video"
                        ) {

                            window.location.href =
                                `add-video.html?id=${item.id}`;

                        } else {

                            window.location.href =
                                `add-news.html?id=${item.id}`;

                        }

                    }
                );

            }


            newsTable.appendChild(row);

        });


        console.log(
            "Latest Content:",
            latest
        );

    } catch (error) {

        console.error(
            "Latest content error:",
            error
        );


        newsTable.innerHTML = `
            <tr>
                <td colspan="5"
                    style="text-align:center;padding:30px;color:#b00020;">
                    Failed to load content.
                </td>
            </tr>
        `;

    }

}

loadLatestContent();


// =====================================================
// ADVERTISING NOTIFICATIONS
// =====================================================

const notificationBtn =
    document.getElementById(
        "notificationBtn"
    );

const notificationDropdown =
    document.getElementById(
        "notificationDropdown"
    );

const notificationList =
    document.getElementById(
        "notificationList"
    );

const notificationCount =
    document.getElementById(
        "notificationCount"
    );


if (
    notificationBtn &&
    notificationDropdown
) {

    notificationBtn.addEventListener(
        "click",
        e => {

            e.stopPropagation();

            notificationDropdown.classList.toggle(
                "show"
            );

        }
    );

}


document.addEventListener(
    "click",
    e => {

        if (
            notificationDropdown &&
            notificationBtn &&
            !notificationBtn.contains(e.target) &&
            !notificationDropdown.contains(e.target)
        ) {

            notificationDropdown.classList.remove(
                "show"
            );

        }

    }
);


// =====================================================
// ADVERTISING FIRESTORE
// =====================================================

const advertisingQuery =
    query(
        collection(
            db,
            "advertising_inquiries"
        ),
        orderBy(
            "createdAt",
            "desc"
        )
    );


if (notificationList) {

    onSnapshot(
        advertisingQuery,

        snapshot => {

            notificationList.innerHTML = "";

            let unreadCount = 0;


            if (snapshot.empty) {

                notificationList.innerHTML = `
                    <div class="empty-notification">

                        <i class="fas fa-inbox"></i>

                        <p>
                            No advertising inquiries.
                        </p>

                    </div>
                `;


                if (notificationCount) {

                    notificationCount.style.display =
                        "none";

                }

                return;

            }


            snapshot.forEach(docSnap => {

                const data =
                    docSnap.data();

                const id =
                    docSnap.id;


                if (
                    data.read === false ||
                    data.status === "new"
                ) {

                    unreadCount++;

                }


                const item =
                    document.createElement("div");


                item.className =
                    "notification-item";


                item.innerHTML = `

                    <div class="notification-icon">

                        <i class="fas fa-bullhorn"></i>

                    </div>


                    <div class="notification-content">

                        <strong>
                            ${data.businessName || "New Client"}
                        </strong>

                        <span>
                            ${data.package || "Advertising Inquiry"}
                        </span>

                        <small>
                            ${data.contactPerson || ""}
                        </small>

                    </div>


                    <i class="fas fa-chevron-right notification-arrow"></i>

                `;


                item.addEventListener(
                    "click",
                    async () => {

                        try {

                            await updateDoc(
                                doc(
                                    db,
                                    "advertising_inquiries",
                                    id
                                ),
                                {
                                    read: true,
                                    status: "read"
                                }
                            );


                            window.location.href =
                                `advertising-inquiry.html?id=${id}`;

                        } catch (error) {

                            console.error(
                                "Failed to open advertising inquiry:",
                                error
                            );

                        }

                    }
                );


                notificationList.appendChild(
                    item
                );

            });


            if (notificationCount) {

                if (unreadCount > 0) {

                    notificationCount.style.display =
                        "flex";

                    notificationCount.textContent =
                        unreadCount;

                } else {

                    notificationCount.style.display =
                        "none";

                }

            }

        },

        error => {

            console.error(
                "Advertising notification listener error:",
                error
            );

        }
    );

}


// =====================================================
// VIEW ALL ADVERTISING
// =====================================================

const viewAllNotifications =
    document.getElementById(
        "viewAllNotifications"
    );


if (viewAllNotifications) {

    viewAllNotifications.addEventListener(
        "click",
        () => {

            window.location.href =
                "advertising-inquiries.html";

        }
    );

}


// =====================================================
// START PROFILE
// =====================================================

auth.onAuthStateChanged(
    user => {

        if (user) {

            loadDashboardProfile();

        }

    }
);


console.log(
    "================================="
);

console.log(
    "🔥 DASHBOARD.JS LOADED"
);

console.log(
    "🔥 ARTICLE COUNT FIX ENABLED"
);

console.log(
    "================================="
);
