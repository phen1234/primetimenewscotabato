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
    onSnapshot,
    where
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

import {
    signOut
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";


// ==============================
// LOAD SAVED THEME
// ==============================

loadTheme();


async function loadWebsiteSettings() {

    try {

        const ref = doc(db, "settings", "website");

        const snap = await getDoc(ref);

        if (!snap.exists()) {
            console.log("Website settings not found.");
            return;
        }

        const data = snap.data();

        // ==========================
        // WEBSITE NAME
        // ==========================

        const siteName =
            document.getElementById("siteName");

        if (siteName) {

            siteName.textContent =
                data.websiteName || "Primetime News Cotabato";

        }

        // ==========================
        // WEBSITE LOGO
        // ==========================

        const siteLogo =
            document.getElementById("siteLogo");

        if (siteLogo && data.websiteLogo) {

            siteLogo.src = data.websiteLogo;

        }

    } catch (error) {

        console.error(
            "Failed to load website settings:",
            error
        );

    }

}

// ===============================
// DASHBOARD WEATHER
// ===============================

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


async function loadWeather() {

    try {

        const settingsRef =
            doc(db, "settings", "website");

        const settingsSnap =
            await getDoc(settingsRef);


        if (!settingsSnap.exists()) {

            setWeatherLoading("Weather unavailable");

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


        // TEMPERATURE

        if (weatherTemp) {

            weatherTemp.textContent =
                `${Math.round(data.main.temp)}°C`;

        }


        // CONDITION

        if (weatherCondition) {

            const description =
                data.weather?.[0]?.description ||
                "Unknown";

            weatherCondition.textContent =
                description.charAt(0).toUpperCase() +
                description.slice(1);

        }


        // HUMIDITY

        if (weatherHumidity) {

            weatherHumidity.textContent =
                `${data.main.humidity}%`;

        }


        // WIND

        if (weatherWind) {

            weatherWind.textContent =
                `${data.wind?.speed ?? 0} m/s`;

        }


        // SUNRISE

        if (weatherSunrise) {

            weatherSunrise.textContent =
                formatWeatherTime(
                    data.sys?.sunrise
                );

        }


        // SUNSET

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

    }

    catch (error) {

        console.error(
            "Weather loading error:",
            error
        );

        setWeatherLoading(
            "Weather unavailable"
        );

    }

}


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


loadWeather();

loadWebsiteSettings();



// =============================
// RECENT ACTIVITY
// =============================

async function loadRecentActivity() {

    const activityList =
        document.getElementById("recentActivityList");

    if (!activityList) return;

    activityList.innerHTML = `
        <li class="activity-loading">
            <i class="fas fa-spinner fa-spin"></i>
            Loading activity...
        </li>
    `;

    try {

        // =========================
        // GET DATA
        // =========================

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


        // =========================
        // ARTICLES
        // =========================

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


        // =========================
        // VIDEOS
        // =========================

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


        // =========================
        // USERS
        // =========================

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


        // =========================
        // CONVERT FIRESTORE DATE
        // =========================

        function getActivityTime(date) {

            if (!date) {
                return 0;
            }

            // Firestore Timestamp
            if (
                typeof date === "object" &&
                typeof date.seconds === "number"
            ) {

                return date.seconds * 1000;

            }

            // JavaScript Date
            if (date instanceof Date) {

                return date.getTime();

            }

            // String date
            if (typeof date === "string") {

                const time =
                    new Date(date).getTime();

                return isNaN(time)
                    ? 0
                    : time;

            }

            return 0;

        }


        // =========================
        // SORT NEWEST FIRST
        // =========================

        activities.sort((a, b) => {

            return (
                getActivityTime(b.date) -
                getActivityTime(a.date)
            );

        });


        // =========================
        // COUNT
        // =========================

        const totalActivities =
            activities.length;


        console.log(
            "RECENT ACTIVITIES:",
            totalActivities
        );


        // =========================
        // NO ACTIVITY
        // =========================

        if (totalActivities === 0) {

            activityList.innerHTML = `
                <li class="activity-empty">

                    <i class="fas fa-clock"></i>

                    <div>
                        <strong>No Activities</strong>

                        <p>
                            No recent activity found.
                        </p>
                    </div>

                </li>
            `;

            return;

        }


        // =========================
        // SHOW ONLY 6
        // =========================

        const recentActivities =
            activities.slice(0, 6);


        // =========================
        // RENDER
        // =========================

        activityList.innerHTML = "";


        recentActivities.forEach(activity => {

            const time =
                getActivityTime(activity.date);


            const formattedDate =
                time
                    ? new Date(time).toLocaleString(
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
            li.addEventListener("click", () => {

    if (!activity.id) return;

    if (activity.type === "video") {

        window.location.href =
            `../videos.html?id=${activity.id}&autoplay=1`;


    } else {

        window.location.href =
            `../article.html?id=${activity.id}`;

    }

});

        });


        // =========================
        // ACTIVITY COUNT
        // =========================

        const activityCount =
            document.getElementById(
                "activityCount"
            );

        if (activityCount) {

            activityCount.textContent =
                `${totalActivities} Activities`;

        }


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


// =============================
// FIRESTORE DATE
// =============================

function getActivityDate(timestamp) {

    if (!timestamp) return 0;

    if (
        typeof timestamp.toDate === "function"
    ) {

        return timestamp
            .toDate()
            .getTime();

    }

    if (timestamp.seconds) {

        return timestamp.seconds * 1000;

    }

    const date =
        new Date(timestamp);

    return isNaN(date.getTime())
        ? 0
        : date.getTime();

}


// =============================
// FORMAT DATE
// =============================

function formatActivityDate(timestamp) {

    const time =
        getActivityDate(timestamp);

    if (!time) return "";

    return new Date(time)
        .toLocaleString("en-US", {

            month: "short",
            day: "numeric",

            hour: "numeric",
            minute: "2-digit"

        });

}


// =============================
// START
// =============================

loadRecentActivity();

// ===============================
// DASHBOARD ANALYTICS
// ===============================

async function loadAnalytics() {

    let totalViews = 0;

    // NEWS
    const newsSnap = await getDocs(collection(db, "news"));

    newsSnap.forEach(doc => {

        const news = doc.data();

        totalViews += news.views || 0;

    });

    // VIDEOS
    const videoSnap = await getDocs(collection(db, "videos"));

    videoSnap.forEach(doc => {

        const video = doc.data();

        totalViews += video.views || 0;

    });

    document.getElementById("totalViews").textContent =
        totalViews.toLocaleString();

}

loadAnalytics();





// ===============================
// LOAD VISITORS
// ===============================

onSnapshot(doc(db, "analytics", "daily"), (snap) => {

    if (!snap.exists()) return;

    document.getElementById("todayVisitors").textContent =
        snap.data().todayVisitors || 0;

});

auth.onAuthStateChanged(async (user) => {

    if (!user) return;

    const snap = await getDoc(
        doc(db, "users", user.uid)
    );

    if (!snap.exists()) return;

    const data = snap.data();

    document.getElementById("adminName").textContent =
        data.name || "Administrator";

    document.getElementById("adminPhoto").src =
        data.photoURL || "../images/default-user.png";

});


// ======================
// SIDEBAR NAVIGATION
// ======================

document.getElementById("dashboardBtn")?.addEventListener("click", () => {
    window.location.href = "dashboard.html";
});

document.getElementById("analyticsBtn")?.addEventListener("click", () => {
    window.location.href = "analytics.html";
});

document.getElementById("categorySidebarBtn")?.addEventListener("click", () => {
    window.location.href = "categories.html";
});

document.getElementById("usersBtn")?.addEventListener("click", () => {
    window.location.href = "users.html";
});

document.getElementById("settingsMenu")?.addEventListener("click", () => {
    window.location.href = "settings.html";
});


// LOGOUT
document.getElementById("logoutBtn").addEventListener("click", async (e) => {

    e.preventDefault();

    if (confirm("Are you sure you want to logout?")) {

        try {

            // Update status muna
            if (auth.currentUser) {

                await updateDoc(
                    doc(db, "users", auth.currentUser.uid),
                    {
                        status: "Offline",
                        lastSeen: serverTimestamp()
                    }
                );

            }

            // Logout
            await signOut(auth);

            window.location.replace("../index.html");

        } catch (error) {

            console.error(error);

            alert(error.message);

        }

    }

});



const messagesBtn = document.getElementById("messagesBtn");
const dropdown = document.getElementById("messageDropdown");

messagesBtn.addEventListener("click",()=>{

    dropdown.classList.toggle("show");

});

document.addEventListener("click",(e)=>{

    if(!messagesBtn.contains(e.target) &&
       !dropdown.contains(e.target)){

        dropdown.classList.remove("show");

    }

});

document.getElementById("viewAllMessages")
.addEventListener("click",()=>{

    window.location.href="messages.html";

});



// LIVE CLOCK
function updateClock() {

    const now = new Date();

    document.getElementById("clock").textContent =
        now.toLocaleTimeString("en-PH", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: true
        });

    document.getElementById("currentDate").textContent =
        now.toLocaleDateString("en-PH", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric"
        });

}

updateClock();

setInterval(updateClock, 1000);

const messageList =
document.getElementById("messageList");

const messageCount =
document.getElementById("messageCount");

const q = query(

collection(db,"contactMessages"),

orderBy("createdAt","desc"),

limit(5)

);

onSnapshot(q, (snapshot) => {

    messageList.innerHTML = "";

    let unread = 0;

    if (snapshot.empty) {

        messageList.innerHTML = `
            <div class="empty-message">
                <i class="fas fa-inbox"></i>
                <p>No messages yet.</p>
            </div>
        `;

        messageCount.style.display = "none";
        return;

    }

    snapshot.forEach((doc) => {

        const data = doc.data();

        if (data.status === "unread") unread++;

        const div = document.createElement("div");

        div.className = "message-item";

        div.innerHTML = `
            <h4>${data.name}</h4>
            <p>${data.subject}</p>
            <small>${data.email}</small>
        `;

        messageList.appendChild(div);

    });

    if (unread > 0) {

        messageCount.style.display = "flex";
        messageCount.textContent = unread;

    } else {

        messageCount.style.display = "none";

    }

});




const addNewsBtn = document.getElementById("addNewsBtn");

if (addNewsBtn) {
    addNewsBtn.onclick = () => {
        window.location.href = "add-news.html";
    };
}

const viewAllNewsBtn = document.getElementById("viewAllNewsBtn");

if(viewAllNewsBtn){

    viewAllNewsBtn.onclick = () => {

        window.location.href = "../latest-news.html";
    };

}

const liveWebsiteBtn = document.getElementById("liveWebsiteBtn");

if (liveWebsiteBtn) {
    liveWebsiteBtn.onclick = () => {
        window.location.href = "../index.html?cms=1";
    };
}

const newsManagerBtn = document.getElementById("newsManagerBtn");

if (newsManagerBtn) {
    newsManagerBtn.onclick = () => {
        location.href = "news.html";
    };
}

const addVideoBtn = document.getElementById("addVideoBtn");

if (addVideoBtn) {
    addVideoBtn.onclick = () => {
        location.href = "add-video.html";
    };
}



// ======================================
// LATEST CONTENT (NEWS + VIDEOS)
// ======================================

const newsTable = document.getElementById("newsTable");

async function loadLatestContent(){

    if(!newsTable) return;

    newsTable.innerHTML=`
    <tr>
        <td colspan="5">Loading...</td>
    </tr>
    `;

    try{

        let items=[];

        // NEWS
        const newsSnap=await getDocs(collection(db,"news"));

        newsSnap.forEach(docSnap=>{

            items.push({

                id:docSnap.id,
                type:"news",
                ...docSnap.data()

            });

        });

        // VIDEOS
        const videoSnap=await getDocs(collection(db,"videos"));
        console.log("Total Videos:", videoSnap.size);

        videoSnap.forEach(docSnap=>{
            console.log(docSnap.data());

            items.push({

                id:docSnap.id,
                type:"video",
                ...docSnap.data()

            });

        });

        // Published News + All Videos
items = items.filter(item => {

    if(item.type === "video"){

        return true;

    }

    return item.status === "published";

});

// ======================================
// DASHBOARD TOTAL COUNTERS
// ======================================

async function loadDashboardCounters() {

    try {

        // ==============================
        // LOAD NEWS
        // ==============================

        const newsSnapshot =
            await getDocs(
                collection(db, "news")
            );


        // ==============================
        // COUNT ARTICLES ONLY
        // ==============================

        let articleCount = 0;

        newsSnapshot.forEach((docSnap) => {

            const data = docSnap.data();

            /*
             * ARTICLE ONLY
             *
             * Kapag may type field na "video",
             * HUWAG isama sa article count.
             *
             * Normal news documents na walang type
             * ay articles pa rin.
             */

            const type =
                String(data.type || "")
                    .trim()
                    .toLowerCase();

            if (type === "video") {
                return;
            }

            articleCount++;

        });


        // ==============================
        // TOTAL ARTICLES
        // ==============================

        const totalArticle =
            document.getElementById("totalArticle") ||
            document.getElementById("totalArticles") ||
            document.getElementById("totalNews");


        if (totalArticle) {

            totalArticle.textContent =
                articleCount;

        }


        // ==============================
        // LOAD VIDEOS
        // ==============================

        const videoSnapshot =
            await getDocs(
                collection(db, "videos")
            );


        // ==============================
        // TOTAL VIDEOS
        // ==============================

        const totalVideos =
            document.getElementById("totalVideos");


        if (totalVideos) {

            totalVideos.textContent =
                videoSnapshot.size;

        }


        // ==============================
        // TOTAL UPLOADS
        // ==============================

        const totalUploads =
            document.getElementById("totalUploads");


        if (totalUploads) {

            /*
             * Uploads = videos uploaded.
             * Kung gusto mong ibang definition
             * ng Uploads, pwede natin baguhin later.
             */

            totalUploads.textContent =
                videoSnapshot.size;

        }


        // ==============================
        // TOTAL USERS
        // ==============================

        const usersSnapshot =
            await getDocs(
                collection(db, "users")
            );


        const totalUsers =
            document.getElementById("totalUsers");


        if (totalUsers) {

            totalUsers.textContent =
                usersSnapshot.size;

        }


        // ==============================
        // DEBUG
        // ==============================

        console.log(
            "================================"
        );

        console.log(
            "📊 DASHBOARD COUNTERS"
        );

        console.log(
            "📰 Total Articles:",
            articleCount
        );

        console.log(
            "🎬 Total Videos:",
            videoSnapshot.size
        );

        console.log(
            "📤 Total Uploads:",
            videoSnapshot.size
        );

        console.log(
            "👥 Total Users:",
            usersSnapshot.size
        );

        console.log(
            "================================"
        );


    } catch (error) {

        console.error(
            "❌ Dashboard counters error:",
            error
        );

    }

}


loadDashboardCounters();


// ======================================
// TOTAL VIDEOS
// ======================================

const totalVideos = document.getElementById("totalVideos");

if(totalVideos){

    const totalVideoCount = items.filter(item =>
        item.type === "video"
    ).length;

    totalVideos.textContent = totalVideoCount;

}


        // Latest first
        items.sort((a,b)=>{

            const A=a.publishedAt?.seconds||a.createdAt?.seconds||0;
            const B=b.publishedAt?.seconds||b.createdAt?.seconds||0;

            return B-A;

        });

        // Latest 5 only
        items=items.slice(0,5);

        newsTable.innerHTML="";

        items.forEach(item=>{

            newsTable.innerHTML+=`

<tr>

<td>

<span class="typeBadge ${item.type}">

${
item.type==="video"
? `<span class="typeBadge video"><i class="fab fa-youtube"></i> VIDEO</span>`
: `<span class="typeBadge news"><i class="fas fa-newspaper"></i> NEWS ARTICLE</span>`
}

</span>

<br>

<strong>

${item.headline || item.title}

</strong>

</td>

<td>

<span class="categoryBadge">

${item.category}

</span>

</td>

<td>

<span class="published">

Published

</span>

</td>

<td>

${
(item.publishedAt?.seconds || item.createdAt?.seconds)
? new Date(
    (item.publishedAt?.seconds || item.createdAt?.seconds) * 1000
).toLocaleDateString("en-US",{
    month:"short",
    day:"numeric",
    year:"numeric"
})
: "-"
}

</td>

</td>

<td>

<button class="editBtn"

onclick="window.location.href='${
item.type==="video"
? "add-video.html"
: "add-news.html"
}?id=${item.id}'">

<i class="fas fa-edit"></i>

</button>

</td>

</tr>

`;

        });

    }

    catch(err){

        console.error(err);

    }

}

loadLatestContent();

const usersBtn = document.getElementById("usersBtn");

if(usersBtn){

    usersBtn.addEventListener("click",()=>{

        window.location.href = "users.html";

    });

}

async function loadDashboardProfile() {

    const user = auth.currentUser;

    if (!user) {
        console.warn("No logged in user.");
        return;
    }

    try {

        const userRef = doc(
            db,
            "users",
            user.uid
        );

        const snap = await getDoc(userRef);

        if (!snap.exists()) {
            console.warn(
                "User document not found:",
                user.uid
            );
            return;
        }

        const data = snap.data();

        console.log(
            "DASHBOARD USER DATA:",
            data
        );

        // =========================
        // NAME
        // =========================

        const dashboardName =
            document.getElementById("dashboardName");

        if (dashboardName) {

            dashboardName.textContent =
                data.name ||
                user.displayName ||
                "User";
        }

        // =========================
        // PROFILE IMAGE
        // =========================

        const dashboardProfile =
            document.getElementById("dashboardProfile");

        if (dashboardProfile) {

            dashboardProfile.src =
                data.photoURL ||
                "../images/PRIMETIME NEWS LOGO.png";

        }

    } catch (error) {

        console.error(
            "Failed to load dashboard profile:",
            error
        );

    }
}


// ======================================
// ADVERTISING INQUIRY NOTIFICATIONS
// ======================================

const notificationBtn =
    document.getElementById("notificationBtn");

const notificationDropdown =
    document.getElementById("notificationDropdown");

const notificationList =
    document.getElementById("notificationList");

const notificationCount =
    document.getElementById("notificationCount");


// ======================================
// CHECK ELEMENTS
// ======================================

console.log("Advertising Notification Elements:", {
    notificationBtn,
    notificationDropdown,
    notificationList,
    notificationCount
});


// ======================================
// CLICK BELL
// ======================================

if (notificationBtn && notificationDropdown) {

    notificationBtn.addEventListener("click", (e) => {

        e.stopPropagation();

        notificationDropdown.classList.toggle("show");

    });

}


// ======================================
// CLOSE DROPDOWN
// ======================================

document.addEventListener("click", (e) => {

    if (
        notificationDropdown &&
        notificationBtn &&
        !notificationBtn.contains(e.target)
    ) {

        notificationDropdown.classList.remove("show");

    }

});


// ======================================
// FIRESTORE ADVERTISING INQUIRIES
// ======================================

const advertisingQuery = query(
    collection(db, "advertising_inquiries"),
    orderBy("createdAt", "desc")
);


onSnapshot(

    advertisingQuery,

    (snapshot) => {

        console.log(
            "Advertising inquiries:",
            snapshot.size
        );


        if (!notificationList) {

            console.error(
                "notificationList not found in dashboard.html"
            );

            return;

        }


        notificationList.innerHTML = "";

        let unreadCount = 0;


        // ==================================
        // NO DATA
        // ==================================

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

                notificationCount.style.display = "none";

            }

            return;

        }


        // ==================================
        // LOOP
        // ==================================

        snapshot.forEach((docSnap) => {

            const data = docSnap.data();

            const id = docSnap.id;


            console.log(
                "Advertising inquiry:",
                id,
                data
            );


            // ==================================
            // UNREAD
            // ==================================

            if (
                data.read === false ||
                data.status === "new"
            ) {

                unreadCount++;

            }


            // ==================================
            // CREATE ITEM
            // ==================================

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


            // ==================================
            // CLICK
            // ==================================

            item.addEventListener(
                "click",
                async () => {

                    console.log(
                        "Opening inquiry:",
                        id
                    );


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

                    }

                    catch (error) {

                        console.error(
                            "Failed to open advertising inquiry:",
                            error
                        );

                    }

                }
            );


            notificationList.appendChild(item);

        });


        // ==================================
        // BADGE
        // ==================================

        if (notificationCount) {

            if (unreadCount > 0) {

                notificationCount.style.display =
                    "flex";

                notificationCount.textContent =
                    unreadCount;

            }

            else {

                notificationCount.style.display =
                    "none";

            }

        }

    },

    (error) => {

        console.error(
            "Advertising notification listener error:",
            error
        );

    }

);


// ======================================
// VIEW ALL
// ======================================

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
