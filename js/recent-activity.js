import { db } from "./firebase.js";

import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";


// =============================
// LOAD ALL ACTIVITY
// =============================

async function loadAllActivity() {

    const list =
        document.getElementById("allActivityList");

    if (!list) return;

    try {

        list.innerHTML = `
            <li class="activity-loading">
                <i class="fas fa-spinner fa-spin"></i>
                Loading activity...
            </li>
        `;


        // =========================
        // FIRESTORE COLLECTIONS
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
                    "fas fa-user-plus"

            });

        });


        // =========================
        // SORT
        // =========================

        activities.sort((a, b) => {

            return getActivityDate(b.date)
                 - getActivityDate(a.date);

        });


        // =========================
        // DISPLAY ALL
        // =========================

        if (!activities.length) {

            list.innerHTML = `
                <li class="activity-empty">

                    <i class="fas fa-history"></i>

                    No activity yet.

                </li>
            `;

            return;
        }


        list.innerHTML = activities
        .map(activity => {

            return `
                <li
                    class="activity-item"
                    data-id="${activity.id || ""}"
                    data-type="${activity.type}"
                >

                    <div class="activity-icon">
                        <i class="${activity.icon}"></i>
                    </div>

                    <div class="activity-info">

                        <strong>
                            ${activity.title}
                        </strong>

                        <span>
                            ${activity.category}
                        </span>

                    </div>

                    <small>
                        ${formatActivityDate(activity.date)}
                    </small>

                </li>
            `;

        })
        .join("");

        // =============================
// CLICK ACTIVITY
// =============================

list.addEventListener("click", (e) => {

    const item =
        e.target.closest(".activity-item");

    if (!item) return;

    const id =
        item.dataset.id;

    const type =
        item.dataset.type;

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
        
    }

    catch (error) {

        console.error(
            "Load All Activity Error:",
            error
        );

        list.innerHTML = `
            <li class="activity-empty">

                <i class="fas fa-exclamation-circle"></i>

                Unable to load activity.

            </li>
        `;

    }

}



// =============================
// DATE
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
            year: "numeric",

            hour: "numeric",
            minute: "2-digit"

        });

}


// =============================
// START
// =============================

loadAllActivity();