import { db } from "./firebase.js";

import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";


/* =========================================
   ELEMENT
========================================= */

const newsTicker =
    document.getElementById("newsTicker");


/* =========================================
   SETTINGS
========================================= */

let headlines = [];

let currentHeadlineIndex = 0;

let headlineTimer = null;

const HEADLINE_INTERVAL = 5000;


/* =========================================
   HELPERS
========================================= */

function getTitle(article) {

    return (
        article.title ||
        article.headline ||
        article.name ||
        "Latest News"
    );

}


function getDateValue(article) {

    if (article.createdAt?.seconds) {

        return article.createdAt.seconds * 1000;

    }


    if (article.createdAt?.toDate) {

        return article.createdAt
            .toDate()
            .getTime();

    }


    if (article.publishedAt?.seconds) {

        return article.publishedAt.seconds * 1000;

    }


    if (article.publishedAt?.toDate) {

        return article.publishedAt
            .toDate()
            .getTime();

    }


    if (article.date) {

        const parsed =
            new Date(article.date).getTime();

        return Number.isNaN(parsed)
            ? 0
            : parsed;

    }


    return 0;

}


/* =========================================
   SHOW HEADLINE
========================================= */

function showHeadline(article) {

    if (!newsTicker || !article) {
        return;
    }


    const oldHeadline =
        newsTicker.querySelector(
            ".ticker-headline"
        );


    if (oldHeadline) {

        oldHeadline.classList.remove("show");


        setTimeout(() => {

            if (oldHeadline.parentNode) {
                oldHeadline.remove();
            }


            insertHeadline(article);

        }, 500);

    }

    else {

        insertHeadline(article);

    }

}


/* =========================================
   INSERT HEADLINE
========================================= */

function insertHeadline(article) {

    if (!newsTicker) {
        return;
    }


    const title =
        getTitle(article);


    const link =
        document.createElement("a");


    link.className =
        "ticker-headline";


    /*
     * IMPORTANT:
     * Firebase document ID
     */

    link.href =
        `article.html?id=${encodeURIComponent(
            article.id
        )}`;


    link.setAttribute(
        "aria-label",
        `Read: ${title}`
    );


    link.textContent =
        title;


    newsTicker.appendChild(link);


    /*
     * FADE IN
     */

    requestAnimationFrame(() => {

        requestAnimationFrame(() => {

            link.classList.add("show");

        });

    });

}


/* =========================================
   START ROTATION
========================================= */

function startHeadlineRotation() {

    if (!newsTicker) {
        return;
    }


    if (!headlines.length) {

        newsTicker.innerHTML = `
            <span class="headline-loading">
                No headlines available.
            </span>
        `;

        return;

    }


    /*
     * CLEAR OLD TIMER
     */

    if (headlineTimer) {

        clearInterval(
            headlineTimer
        );

    }


    currentHeadlineIndex = 0;


    /*
     * CLEAR LOADING TEXT
     */

    newsTicker.innerHTML = "";


    /*
     * FIRST HEADLINE
     */

    showHeadline(
        headlines[currentHeadlineIndex]
    );


    /*
     * ROTATE EVERY 5 SECONDS
     */

    headlineTimer =
        setInterval(() => {

            currentHeadlineIndex++;


            if (
                currentHeadlineIndex >=
                headlines.length
            ) {

                currentHeadlineIndex = 0;

            }


            showHeadline(
                headlines[currentHeadlineIndex]
            );


        }, HEADLINE_INTERVAL);

}


/* =========================================
   LOAD HEADLINES
========================================= */

async function loadHeadlines() {

    if (!newsTicker) {
        console.error(
            "newsTicker element not found."
        );

        return;
    }


    newsTicker.innerHTML = `
        <span class="headline-loading">
            Loading latest headlines...
        </span>
    `;


    try {

        /*
         * IMPORTANT:
         *
         * Your Latest News uses:
         *
         * collection(db, "news")
         *
         * So the ticker must also use
         * the "news" collection.
         */

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "news"
                )
            );


        headlines =
            snapshot.docs.map(doc => ({

                id: doc.id,

                ...doc.data()

            }));


        /*
         * NEWEST FIRST
         */

        headlines.sort(
            (a, b) =>
                getDateValue(b) -
                getDateValue(a)
        );


        /*
         * REMOVE EMPTY TITLES
         */

        headlines =
            headlines.filter(article => {

                const title =
                    getTitle(article);

                return (
                    title &&
                    title.trim() !== ""
                );

            });


        console.log(
            "HEADLINES LOADED:",
            headlines
        );


        startHeadlineRotation();

    }


    catch (error) {

        console.error(
            "Headline ticker error:",
            error
        );


        newsTicker.innerHTML = `
            <span class="headline-loading">
                Unable to load headlines.
            </span>
        `;

    }

}


/* =========================================
   INITIALIZE
========================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        loadHeadlines();

    }
);