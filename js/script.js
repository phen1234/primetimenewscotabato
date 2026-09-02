import { db } from "./firebase.js";
import { getVideoId } from "./youtube.js";


import {
    collection,
    doc,
    getDoc,
    getDocs,
    query,
    orderBy,
    limit
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";


import {
    getAuth,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";



const status =
    document.getElementById("loaderStatus");

const bar =
    document.getElementById("loaderBar");

const pageLoader =
    document.getElementById("pageLoader");

const loadingSiteName =
    document.getElementById("loadingSiteName");


const steps = [
    {
        text: "Initializing...",
        id: "step1"
    },
    {
        text: "Verifying Secure Connection...",
        id: "step2"
    },
    {
        text: "Preparing Dashboard...",
        id: "step3"
    },
    {
        text: "Almost Ready...",
        id: "step4"
    }
];

let progress = 0;

steps.forEach((step,index)=>{

setTimeout(()=>{

status.innerHTML=step.text;

bar.style.width=((index+1)*25)+"%";

document.getElementById(step.id).innerHTML=
"✔ "+step.text;

},index*700);

});

const DEFAULT_SITE_NAME = "Primetime News Cotabato";

async function getWebsiteName() {

    try {

        const ref = doc(db, "settings", "website");
        const snap = await getDoc(ref);

        if (!snap.exists()) {
            return DEFAULT_SITE_NAME;
        }

        const data = snap.data();

        return data.websiteName || DEFAULT_SITE_NAME;

    } catch (error) {

        console.error(
            "Failed to load website name:",
            error
        );

        return DEFAULT_SITE_NAME;
    }
}


async function startLoader() {

    const siteName = await getWebsiteName();

    if (loadingSiteName) {
        loadingSiteName.textContent = siteName;
    }

    const step1 = document.getElementById("step1");

    if (step1) {
        step1.innerHTML =
            "✔ Initializing " + siteName + "...";
    }

    setTimeout(() => {

        if (status) {
            status.textContent =
                "Verifying Secure Connection...";
        }

        const step2 =
            document.getElementById("step2");

        if (step2) {
            step2.innerHTML =
                "✔ Verifying Secure Connection...";
        }

        if (bar) {
            bar.style.width = "50%";
        }

    }, 700);


    setTimeout(() => {

        if (status) {
            status.textContent =
                "Preparing Dashboard...";
        }

        const step3 =
            document.getElementById("step3");

        if (step3) {
            step3.innerHTML =
                "✔ Preparing Dashboard...";
        }

        if (bar) {
            bar.style.width = "75%";
        }

    }, 1400);


    setTimeout(() => {

        if (status) {
            status.textContent =
                "Almost Ready...";
        }

        const step4 =
            document.getElementById("step4");

        if (step4) {
            step4.innerHTML =
                "✔ Almost Ready...";
        }

        if (bar) {
            bar.style.width = "100%";
        }

    }, 2100);


    setTimeout(() => {

        if (status) {
            status.textContent =
                "Welcome to " + siteName;
        }

        if (bar) {
            bar.style.width = "100%";
        }

        setTimeout(() => {

            if (pageLoader) {
                pageLoader.style.opacity = "0";
            }

            setTimeout(() => {

                if (pageLoader) {
                    pageLoader.style.display = "none";
                }

            }, 600);

        }, 700);

    }, 3200);
}


startLoader();


async function loadNews() {

    const container = document.getElementById("newsContainer");

    container.innerHTML = "<p>Loading...</p>";

    const q = query(
    collection(db, "news"),
    orderBy("createdAt", "desc"),
    limit(8)
    );

    const snapshot = await getDocs(q);

    container.innerHTML = "";

    snapshot.forEach(doc => {

        const news = doc.data();

        container.innerHTML += `
<a href="article.html?id=${doc.id}" class="news-link">

    <article class="news-card">

        <img src="${news.featuredImage}" alt="">

        <div class="news-card-content">

            <span>${news.category}</span>

            <h3>${news.headline}</h3>

            <p>${news.summary}</p>

        </div>

    </article>

</a>
`;

    });

}

loadNews();

async function loadMostRead() {

    const container = document.getElementById("mostReadList");

    if (!container) return;

    try {

        const q = query(
            collection(db, "news"),
            orderBy("views", "desc"),
            limit(5)
        );

        const snapshot = await getDocs(q);

        container.innerHTML = "";

        snapshot.forEach(doc => {

            const news = doc.data();

            container.innerHTML += `
                <li>

                    <a href="article.html?id=${doc.id}">

                        <img
                            src="${news.featuredImage || 'images/news1.jpg'}"
                            alt="${news.headline || 'News'}"
                            loading="lazy"
                        >

                        <div class="most-read-content">

                            <span class="category">
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

                </li>
            `;

        });

        if (snapshot.empty) {

            container.innerHTML =
                "<li>No most-read news yet.</li>";

        }

    } catch (error) {

        console.error(
            "Failed to load Most Read:",
            error
        );

        container.innerHTML =
            "<li>Unable to load Most Read.</li>";

    }
}

loadMostRead();


// ==========================
// OPEN VIDEO FROM RECENT ACTIVITY
// ==========================

async function openVideoFromActivity() {

    const params =
        new URLSearchParams(window.location.search);

    const videoDocId =
        params.get("video");

    // Walang video parameter
    if (!videoDocId) {
        return;
    }

    try {

        console.log(
            "Loading activity video:",
            videoDocId
        );


        // ==========================
        // GET VIDEO FROM FIRESTORE
        // ==========================

        const videoRef =
            doc(db, "videos", videoDocId);

        const videoSnap =
            await getDoc(videoRef);


        if (!videoSnap.exists()) {

            console.error(
                "Video document not found:",
                videoDocId
            );

            return;
        }


        const video =
            videoSnap.data();


        // ==========================
        // GET YOUTUBE ID
        // ==========================

        const youtubeId =
            video.videoId ||
            getVideoId(video.youtube);


        if (!youtubeId) {

            console.error(
                "YouTube Video ID not found:",
                video
            );

            return;
        }


        console.log(
            "YouTube Video ID:",
            youtubeId
        );


        // ==========================
        // OPEN VIDEO
        // ==========================

        openActivityVideoModal(
            youtubeId,
            video.title ||
            video.headline ||
            "Video"
        );


    } catch (error) {

        console.error(
            "Open Activity Video Error:",
            error
        );

    }

}


// ========================== // CREATE MODAL // ==========================
const modal = document.createElement("div");
modal.id = "activityVideoModal";
modal.innerHTML = `
  <div class="activity-video-overlay">
    <button class="activity-video-close" aria-label="Close video" >
      &times;
    </button>
    <div class="activity-video-container">
      <iframe 
        src="https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0" 
        title="${escapeHtml(title)}" 
        frameborder="0" 
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowfullscreen
        referrerpolicy="strict-origin-when-cross-origin">
      </iframe>
    </div>
  </div>
`;

    document.body.appendChild(modal);


    // ==========================
    // CLOSE BUTTON
    // ==========================

    const closeBtn =
        modal.querySelector(
            ".activity-video-close"
        );

    closeBtn.addEventListener(
        "click",
        () => {

            modal.remove();

            removeVideoParameter();

        }
    );


    // ==========================
    // CLICK OUTSIDE
    // ==========================

    modal
        .querySelector(
            ".activity-video-overlay"
        )
        .addEventListener(
            "click",
            (e) => {

                if (
                    e.target.classList.contains(
                        "activity-video-overlay"
                    )
                ) {

                    modal.remove();

                    removeVideoParameter();

                }

            }
        );


    // ==========================
    // ESC KEY
    // ==========================

    document.addEventListener(
        "keydown",
        function closeWithEscape(e) {

            if (e.key === "Escape") {

                modal.remove();

                removeVideoParameter();

                document.removeEventListener(
                    "keydown",
                    closeWithEscape
                );

            }

        }
    );

}


// ==========================
// REMOVE ?video= FROM URL
// ==========================

function removeVideoParameter() {

    const url =
        new URL(window.location.href);

    url.searchParams.delete("video");

    window.history.replaceState(
        {},
        document.title,
        url.pathname +
        url.search
    );

}


// ==========================
// HTML ESCAPE
// ==========================

function escapeHtml(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


// ==========================
// START ACTIVITY VIDEO
// ==========================

openVideoFromActivity();


// =====================
// Mobile Menu
// =====================

// =====================
// MOBILE MENU
// =====================

const menu = document.querySelector(".menu-toggle");
const links = document.querySelector(".nav-links");

if (menu && links) {

    menu.addEventListener("click", (e) => {

        e.stopPropagation();

        links.classList.toggle("active");

    });


    // Close menu kapag pumili ng category
    links.querySelectorAll("a").forEach(link => {

        link.addEventListener("click", () => {

            links.classList.remove("active");

        });

    });


    // Close menu kapag nag-click sa labas
    document.addEventListener("click", (e) => {

        if (
            links.classList.contains("active") &&
            !links.contains(e.target) &&
            !menu.contains(e.target)
        ) {

            links.classList.remove("active");

        }

    });

}

// =====================
// Hero Slider
// =====================


function updateClock(){

const now = new Date();

document.getElementById("clock").innerHTML =
now.toLocaleTimeString();

document.getElementById("today").innerHTML =
now.toDateString();

}

setInterval(updateClock,1000);

updateClock();


// ==========================
// LOGIN / LOG OUT STATE
// Desktop header + Mobile/Burger Menu
// ==========================

const auth = getAuth();

function updateLoginButton(user) {

    const desktopAuthLink =
        document.getElementById("desktopAuthLink");

    const desktopAuthText =
        document.getElementById("desktopAuthText");

    const mobileAuthLink =
        document.getElementById("mobileAuthLink");

    const mobileAuthText =
        document.getElementById("mobileAuthText");

    const mobileAuthIcon =
        document.getElementById("mobileAuthIcon");

    // ==========================
    // USER LOGGED IN
    // ==========================
    if (user) {

        // DESKTOP: show Log Out
        if (desktopAuthLink) {
            desktopAuthLink.href = "#";
            desktopAuthText.textContent = "Log Out";
            desktopAuthLink.onclick = async (e) => {
                e.preventDefault();

                try {
                    await signOut(auth);
                    window.location.href = "index.html";
                } catch (error) {
                    console.error("Logout failed:", error);
                }
            };
        }

        // MOBILE BURGER: show Log Out
        if (mobileAuthLink) {
            mobileAuthLink.href = "#";
            mobileAuthText.textContent = "Log Out";
            mobileAuthIcon.textContent = "↪";
            mobileAuthLink.onclick = async (e) => {
                e.preventDefault();

                try {
                    await signOut(auth);
                    window.location.href = "index.html";
                } catch (error) {
                    console.error("Logout failed:", error);
                }
            };
        }

        return;
    }

    // ==========================
    // USER NOT LOGGED IN
    // ==========================

    // DESKTOP: show Login
    if (desktopAuthLink) {
        desktopAuthLink.href = "admin/login.html";
        desktopAuthText.textContent = "Login";
        desktopAuthLink.onclick = null;
    }

    // MOBILE BURGER: show Login
    if (mobileAuthLink) {
        mobileAuthLink.href = "admin/login.html";
        mobileAuthText.textContent = "Login";
        mobileAuthIcon.textContent = "🔐";
        mobileAuthLink.onclick = null;
    }
}


// ==========================
// FIREBASE AUTH STATE
// ==========================

onAuthStateChanged(auth, (user) => {

    console.log(
        "Current Firebase User:",
        user ? user.uid : "NOT LOGGED IN"
    );

    updateLoginButton(user);

});


