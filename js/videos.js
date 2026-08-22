import { db } from "./firebase.js";
import { getVideoId } from "./youtube.js";

import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

const videosGrid = document.getElementById("videosGrid");
const videoFilters = document.getElementById("videoFilters");

let allVideos = [];
let activeCategory = "All";


/* =========================================
   HELPERS
========================================= */

function normalize(value) {
    return String(value || "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ");
}


function getId(video) {

    if (video.videoId) {
        return String(video.videoId).trim();
    }

    const url =
        video.youtube ||
        video.youtubeUrl ||
        video.videoUrl ||
        video.url ||
        "";

    if (!url) return null;

    try {
        return getVideoId(url);
    } catch (error) {
        console.error("Unable to get YouTube ID:", error);
        return null;
    }
}


function getCategory(video) {

    return (
        video.category ||
        video.categoryName ||
        video.newsCategory ||
        video.type ||
        ""
    );
}


function getTitle(video) {

    return (
        video.title ||
        video.headline ||
        video.name ||
        video.description ||
        "Latest Video"
    );
}


function getDate(video) {

    if (video.date) {
        return video.date;
    }

    if (video.createdAt?.toDate) {
        return video.createdAt.toDate().toLocaleDateString();
    }

    if (video.createdAt?.seconds) {
        return new Date(
            video.createdAt.seconds * 1000
        ).toLocaleDateString();
    }

    return "";
}


function escapeHtml(value) {

    const div = document.createElement("div");

    div.textContent = String(value ?? "");

    return div.innerHTML;
}


/* =========================================
   YOUTUBE PLAYER MODAL
========================================= */

function createVideoPlayer(id, title) {

    // Remove existing player if meron
    const existing =
        document.getElementById("youtubeVideoModal");

    if (existing) {
        existing.remove();
    }


    const modal =
        document.createElement("div");

    modal.id = "youtubeVideoModal";

    modal.innerHTML = `

        <div class="youtube-modal-overlay">

            <div
                class="youtube-modal"
                role="dialog"
                aria-modal="true"
                aria-label="${escapeHtml(title)}"
            >

                <button
                    type="button"
                    class="youtube-modal-close"
                    id="youtubeModalClose"
                    aria-label="Close video"
                >
                    <i class="fas fa-xmark"></i>
                </button>


                <div class="youtube-player-wrapper">

                    <iframe
                        src="https://www.youtube.com/embed/${encodeURIComponent(id)}?autoplay=1&rel=0"
                        title="${escapeHtml(title)}"
                        frameborder="0"
                        allow="
                            accelerometer;
                            autoplay;
                            clipboard-write;
                            encrypted-media;
                            gyroscope;
                            picture-in-picture;
                            web-share
                        "
                        allowfullscreen>
                    </iframe>

                </div>


                <div class="youtube-modal-title">
                    ${escapeHtml(title)}
                </div>

            </div>

        </div>

    `;


    document.body.appendChild(modal);


    // Prevent body scrolling while player is open
    document.body.style.overflow = "hidden";


    const closeButton =
        document.getElementById("youtubeModalClose");


    function closePlayer() {

        modal.remove();

        document.body.style.overflow = "";

        document.removeEventListener(
            "keydown",
            handleKeydown
        );
    }


    function handleKeydown(event) {

        if (event.key === "Escape") {
            closePlayer();
        }
    }


    if (closeButton) {

        closeButton.addEventListener(
            "click",
            closePlayer
        );
    }


    const overlay =
        modal.querySelector(".youtube-modal-overlay");


    if (overlay) {

        overlay.addEventListener(
            "click",
            function (event) {

                if (event.target === overlay) {
                    closePlayer();
                }

            }
        );
    }


    document.addEventListener(
        "keydown",
        handleKeydown
    );
}


/* =========================================
   VIDEO PLAYER CSS
========================================= */

function addVideoPlayerStyles() {

    if (
        document.getElementById(
            "youtubeVideoModalStyles"
        )
    ) {
        return;
    }


    const style =
        document.createElement("style");

    style.id =
        "youtubeVideoModalStyles";


    style.textContent = `

        /* =====================================
           YOUTUBE MODAL
        ===================================== */

        #youtubeVideoModal {

            position: fixed;

            inset: 0;

            z-index: 999999;

        }


        .youtube-modal-overlay {

            position: fixed;

            inset: 0;

            display: flex;

            align-items: center;

            justify-content: center;

            padding: 20px;

            background:
                rgba(0, 0, 0, .82);

            box-sizing: border-box;

        }


        .youtube-modal {

            position: relative;

            width: 100%;

            max-width: 900px;

            background: #000;

            border-radius: 10px;

            overflow: hidden;

            box-shadow:
                0 20px 60px rgba(0, 0, 0, .45);

        }


        .youtube-modal-close {

            position: absolute;

            top: 10px;

            right: 10px;

            z-index: 10;

            display: flex;

            align-items: center;

            justify-content: center;

            width: 34px;

            height: 34px;

            padding: 0;

            border: none;

            border-radius: 50%;

            background:
                rgba(0, 0, 0, .75);

            color: #fff;

            font-size: 16px;

            cursor: pointer;

        }


        .youtube-modal-close:hover {

            background: #e00000;

        }


        .youtube-player-wrapper {

            position: relative;

            width: 100%;

            aspect-ratio: 16 / 9;

            background: #000;

        }


        .youtube-player-wrapper iframe {

            position: absolute;

            inset: 0;

            width: 100%;

            height: 100%;

            border: 0;

        }


        .youtube-modal-title {

            padding: 12px 15px;

            background: #111827;

            color: #fff;

            font-family:
                "Poppins",
                sans-serif;

            font-size: 14px;

            font-weight: 600;

            line-height: 1.4;

        }


        /* =====================================
           MOBILE
        ===================================== */

        @media (max-width: 768px) {

            .youtube-modal-overlay {

                padding: 10px;

            }


            .youtube-modal {

                max-width: 100%;

                border-radius: 7px;

            }


            .youtube-modal-close {

                width: 30px;

                height: 30px;

                top: 7px;

                right: 7px;

                font-size: 14px;

            }


            .youtube-modal-title {

                padding: 9px 10px;

                font-size: 11px;

            }

        }


        @media (max-width: 480px) {

            .youtube-modal-overlay {

                padding: 8px;

            }


            .youtube-modal-title {

                padding: 8px;

                font-size: 10px;

            }

        }

    `;


    document.head.appendChild(style);
}


/* =========================================
   RENDER VIDEOS
========================================= */

function renderVideos() {

    if (!videosGrid) return;


    const filtered =
        activeCategory === "All"

            ? allVideos

            : allVideos.filter(video =>
                normalize(getCategory(video)) ===
                normalize(activeCategory)
            );


    videosGrid.innerHTML = "";


    if (!filtered.length) {

        videosGrid.innerHTML = `

            <div class="no-videos">

                <i class="fas fa-video-slash"></i>

                <p>
                    No videos available
                    in this category.
                </p>

            </div>

        `;

        return;
    }


    let rendered = 0;


    filtered.forEach(video => {

        const id = getId(video);

        if (!id) return;


        rendered++;


        const title =
            getTitle(video);

        const category =
            getCategory(video);

        const date =
            getDate(video);


        /*
         * IMPORTANT:
         * Gumagamit tayo ng DIV,
         * hindi A tag.
         *
         * Kaya hindi na siya
         * magre-redirect sa YouTube.
         */

        const card =
            document.createElement("div");


        card.className =
            "video-card";


        card.setAttribute(
            "role",
            "button"
        );


        card.setAttribute(
            "tabindex",
            "0"
        );


        card.setAttribute(
            "aria-label",
            `Play video: ${title}`
        );


        card.innerHTML = `

            <div class="video-thumbnail">

                <img
                    src="https://img.youtube.com/vi/${encodeURIComponent(id)}/hqdefault.jpg"
                    alt="${escapeHtml(title)}"
                    loading="lazy"
                >

                <span class="video-play">

                    <i class="fas fa-play"></i>

                </span>

            </div>


            <div class="video-content">

                ${
                    category

                        ? `<span class="video-category">
                            ${escapeHtml(category)}
                           </span>`

                        : ""
                }


                <h3>
                    ${escapeHtml(title)}
                </h3>


                ${
                    date

                        ? `<div class="video-meta">

                            <i class="far fa-calendar"></i>

                            ${escapeHtml(date)}

                           </div>`

                        : ""
                }

            </div>

        `;


/* =====================================
   CLICK VIDEO
===================================== */

card.addEventListener(
    "click",
    function () {

        createVideoPlayer(
            id,
            title
        );

    }
);


/* =====================================
   KEYBOARD ACCESS
===================================== */

card.addEventListener(
    "keydown",
    function (event) {

        if (
            event.key === "Enter" ||
            event.key === " "
        ) {

            event.preventDefault();

            createVideoPlayer(
                id,
                title
            );

        }

    }
);


videosGrid.appendChild(card);

});


if (!rendered) {

    videosGrid.innerHTML = `

        <div class="no-videos">

            <i class="fas fa-video-slash"></i>

            <p>
                No valid videos available.
            </p>

        </div>

    `;

}

}


/* =========================================
   LOAD VIDEOS
========================================= */

async function loadVideos() {

    if (!videosGrid) return;


    videosGrid.innerHTML =
        `<p>Loading videos...</p>`;


    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "videos"
                )
            );


        allVideos =
            snapshot.docs.map(doc => ({

                id: doc.id,

                ...doc.data()

            }));


        /* =====================================
           SORT NEWEST FIRST
        ===================================== */

        allVideos.sort(
            (a, b) => {

                const time =
                    video => {

                        if (
                            video.createdAt?.seconds
                        ) {

                            return (
                                video.createdAt.seconds *
                                1000
                            );

                        }


                        if (
                            video.createdAt?.toDate
                        ) {

                            return (
                                video.createdAt
                                    .toDate()
                                    .getTime()
                            );

                        }


                        if (video.date) {

                            const parsed =
                                new Date(
                                    video.date
                                ).getTime();


                            return Number.isNaN(
                                parsed
                            )
                                ? 0
                                : parsed;

                        }


                        return 0;

                    };


                return time(b) - time(a);

            }
        );


        /* =====================================
           RENDER
        ===================================== */

        renderVideos();


        /* =====================================
           AUTO OPEN VIDEO FROM URL
           
           Example:
           videos.html?id=VIDEO_DOCUMENT_ID&autoplay=1
        ===================================== */

        if (
            requestedVideoId &&
            shouldAutoplay
        ) {

            const video =
                allVideos.find(
                    item =>
                        item.id ===
                        requestedVideoId
                );


            if (video) {

                const youtubeId =
                    getId(video);


                if (youtubeId) {

                    setTimeout(
                        () => {

                            createVideoPlayer(
                                youtubeId,
                                getTitle(video)
                            );

                        },
                        150
                    );

                }

            }

        }

    }


    catch (error) {

        console.error(
            "Videos page error:",
            error
        );


        videosGrid.innerHTML = `

            <div class="no-videos">

                <i class="fas fa-circle-exclamation"></i>

                <p>
                    Unable to load videos.
                </p>

            </div>

        `;

    }

}


/* =========================================
   VIDEO CATEGORY MENU
========================================= */

const videoCategoryBar =
    document.querySelector(
        ".video-category-bar"
    );


const videoCategoryToggle =
    document.getElementById(
        "videoCategoryToggle"
    );


const selectedVideoCategory =
    document.getElementById(
        "selectedVideoCategory"
    );


if (videoCategoryToggle) {

    videoCategoryToggle.addEventListener(
        "click",
        function () {

            if (!videoCategoryBar) return;


            const isOpen =
                videoCategoryBar.classList
                    .contains("open");


            if (isOpen) {

                videoCategoryBar.classList
                    .remove("open");


                videoCategoryToggle.setAttribute(
                    "aria-expanded",
                    "false"
                );

            }

            else {

                videoCategoryBar.classList
                    .add("open");


                videoCategoryToggle.setAttribute(
                    "aria-expanded",
                    "true"
                );

            }

        }
    );

}


/* =========================================
   CATEGORY FILTER
========================================= */

if (videoFilters) {

    videoFilters.addEventListener(
        "click",
        function (event) {

            const button =
                event.target.closest(
                    ".video-filter"
                );


            if (!button) return;


            /* =================================
               SET ACTIVE CATEGORY
            ================================= */

            activeCategory =
                button.dataset.category ||
                "All";


            /* =================================
               REMOVE ACTIVE STATE
            ================================= */

            videoFilters
                .querySelectorAll(
                    ".video-filter"
                )
                .forEach(
                    function (item) {

                        item.classList
                            .remove("active");

                    }
                );


            /* =================================
               ADD ACTIVE STATE
            ================================= */

            button.classList.add(
                "active"
            );


            /* =================================
               UPDATE MOBILE CATEGORY LABEL
            ================================= */

            if (selectedVideoCategory) {

                selectedVideoCategory
                    .textContent =
                    activeCategory;

            }


            /* =================================
               CLOSE CATEGORY MENU
            ================================= */

            if (videoCategoryBar) {

                videoCategoryBar.classList
                    .remove("open");

            }


            if (videoCategoryToggle) {

                videoCategoryToggle.setAttribute(
                    "aria-expanded",
                    "false"
                );

            }


            /* =================================
               RENDER FILTERED VIDEOS
               
               IMPORTANT:
               HINDI DITO NAKA-OPEN
               ANG AUTOPLAY VIDEO.
            ================================= */

            renderVideos();

        }
    );

}


/* =========================================
   INITIALIZE
========================================= */

addVideoPlayerStyles();


/* =========================================
   READ URL PARAMETERS
========================================= */

const urlParams =
    new URLSearchParams(
        window.location.search
    );


const requestedVideoId =
    urlParams.get("id");


const shouldAutoplay =
    urlParams.get("autoplay") === "1";


/* =========================================
   LOAD VIDEOS
========================================= */

loadVideos();
