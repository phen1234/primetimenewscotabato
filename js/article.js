import { db } from "./firebase.js";

import {
    doc,
    getDoc,
    collection,
    getDocs,
    updateDoc,
    increment,
    orderBy,
    query,
    limit,
    where
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

const params = new URLSearchParams(window.location.search);
const articleId = params.get("id");

async function loadArticle() {

    if (!articleId) {

        document.getElementById("articleTitle").innerHTML =
            "Article not found.";

        return;
    }

    try {

        const docRef = doc(db, "news", articleId);

        const snap = await getDoc(docRef);

        if (!snap.exists()) {

            document.getElementById("articleTitle").innerHTML =
                "Article not found.";

            return;
        }

        const news = snap.data();

        // ===============================
// ACTIVE CATEGORY NAV
// ===============================

const navLinks = document.querySelectorAll(
    "#navbar .nav-links a[data-category]"
);

const articleCategoryName =
    (news.category || "").trim().toLowerCase();

navLinks.forEach(link => {

    const navCategory =
        (link.dataset.category || "").trim().toLowerCase();

    link.classList.toggle(
        "active",
        navCategory === articleCategoryName
    );

});

        
        console.log("ARTICLE DATA:", news);
        console.log("AUTHOR:", news.author);
        console.log("VIEWS:", news.views);

        // ===============================
        // UNIQUE VIEW
        // ===============================

        const viewedKey = `viewed_${articleId}`;

        const alreadyViewed =
            localStorage.getItem(viewedKey);

        let currentViews =
            news.views || 0;

        if (!alreadyViewed) {

            await updateDoc(docRef, {

                views: increment(1)

            });

            localStorage.setItem(
                viewedKey,
                "true"
            );

            currentViews++;
        }

        // ===============================
        // PAGE TITLE
        // ===============================

        document.title =
            `${news.headline || "News"} | Primetime News Cotabato`;


        // ===============================
        // HEADLINE
        // ===============================

        document.getElementById("articleTitle").textContent =
            news.headline || "";


        // ===============================
        // SUMMARY
        // ===============================

        document.getElementById("articleSummary").textContent =
            news.summary || "";


        // ===============================
        // FEATURED IMAGE
        // ===============================

        const articleImage =
            document.getElementById("articleImage");

        if (articleImage) {

            articleImage.src =
                news.featuredImage || "";

            articleImage.alt =
                news.headline || "";
        }


        // ===============================
        // CATEGORY
        // ===============================

        const articleCategory =
            document.getElementById("articleCategory");

        if (articleCategory) {

            articleCategory.textContent =
                news.category || "";
        }


        const categoryBadge =
            document.getElementById("categoryBadge");

        if (categoryBadge) {

            categoryBadge.textContent =
                news.category || "";
        }


        // ===============================
        // AUTHOR
        // ===============================

        const articleAuthor =
            document.getElementById("articleAuthor");

        if (articleAuthor) {

            articleAuthor.textContent =
                news.author ||
                "Primetime News Cotabato";
        }


        // ===============================
        // DATE
        // ===============================

        const articleDate =
            document.getElementById("articleDate");

        const dateValue =
            news.publishedAt ||
            news.createdAt;

        if (
            articleDate &&
            dateValue &&
            dateValue.seconds
        ) {

            const date =
                new Date(
                    dateValue.seconds * 1000
                );

            articleDate.textContent =
                date.toLocaleDateString(
                    "en-US",
                    {
                        year: "numeric",
                        month: "long",
                        day: "numeric"
                    }
                );
        }


        // ===============================
        // VIEWS
        // ===============================

        const articleViews =
            document.getElementById("articleViews");

        if (articleViews) {

            articleViews.textContent =
                currentViews;
        }


        // ===============================
        // ARTICLE BODY
        // ===============================
        // IMPORTANT:
        // Do NOT wrap Quill HTML inside <p>

        const articleBody =
            document.getElementById("articleBody");

        if (articleBody) {

            articleBody.innerHTML =
                news.content || "";
        }

    }

    catch (error) {

        console.error(
            "Load Article Error:",
            error
        );

        document.getElementById("articleTitle").innerHTML =
            "Unable to load article.";

    }
}

async function loadLatestNews(){

    const container = document.getElementById("latestSidebar");

    const q = query(
        collection(db,"news"),
        orderBy("createdAt","desc"),
        limit(5)
    );

    const snapshot = await getDocs(q);

    container.innerHTML="";

    snapshot.forEach(docSnap => {

    const news = docSnap.data();

    container.innerHTML += `
        <a href="article.html?id=${docSnap.id}" class="most-read-item">

            <img src="${news.featuredImage}" alt="">

            <div class="most-read-content">

                <h4>${news.headline}</h4>

                <small>
                    <i class="fas fa-eye"></i>
                    ${news.views || 0} Views
                </small>

            </div>

        </a>
    `;

});

}

async function loadRelatedNews() {

    const container = document.getElementById("relatedNews");

    if (!container) return;

    container.innerHTML = "Loading related news...";

    try {

        // ===============================
        // GET CURRENT ARTICLE
        // ===============================

        const currentSnap = await getDoc(
            doc(db, "news", articleId)
        );

        if (!currentSnap.exists()) {
            container.innerHTML = "";
            return;
        }

        const currentNews = currentSnap.data();

        const currentCategory =
            (currentNews.category || "").trim();

        console.log(
            "CURRENT ARTICLE CATEGORY:",
            currentCategory
        );

        if (!currentCategory) {
            container.innerHTML = "";
            return;
        }

        // ===============================
        // GET RELATED NEWS
        // SAME CATEGORY ONLY
        // ===============================

        const q = query(
            collection(db, "news"),

            where(
                "status",
                "==",
                "published"
            ),

            where(
                "category",
                "==",
                currentCategory
            ),

            orderBy(
                "createdAt",
                "desc"
            ),

            limit(4)
        );

        const snapshot = await getDocs(q);

        container.innerHTML = "";

        let count = 0;

        snapshot.forEach(docSnap => {

            // HUWAG ISAMA ANG CURRENT ARTICLE
            if (docSnap.id === articleId) {
                return;
            }

            if (count >= 3) {
                return;
            }

            const news = docSnap.data();

            container.innerHTML += `

                <a
                    class="news-card"
                    href="article.html?id=${docSnap.id}"
                >

                    <img
                        src="${news.featuredImage || ""}"
                        alt="${news.headline || ""}"
                    >

                    <div class="news-card-content">

                        <span class="news-category">
                            ${news.category || ""}
                        </span>

                        <h3>
                            ${news.headline || ""}
                        </h3>

                        <div class="related-meta">

                            <span>
                                <i class="fas fa-user"></i>
                                ${news.author || "Primetime News Cotabato"}
                            </span>

                            <span>
                                <i class="fas fa-eye"></i>
                                ${news.views || 0} Views
                            </span>

                        </div>

                    </div>

                </a>

            `;

            count++;

        });

        if (count === 0) {

            container.innerHTML = `
                <p class="no-related">
                    No related ${currentCategory} news yet.
                </p>
            `;

        }

    } catch (error) {

        console.error(
            "Related News Error:",
            error
        );

        container.innerHTML = `
            <p class="no-related">
                Unable to load related news.
            </p>
        `;

    }

}

async function loadMostRead() {

    const container = document.getElementById("mostRead");

    const q = query(
        collection(db, "news"),
        orderBy("views", "desc"),
        limit(5)
    );

    const snapshot = await getDocs(q);

    container.innerHTML = "";

    let rank = 1;

    snapshot.forEach((docSnap) => {

        if (docSnap.id === articleId) return;

        const news = docSnap.data();

        if (rank === 1) {

            container.innerHTML += `
            <a href="article.html?id=${docSnap.id}" class="featured-most-read">

                <img src="${news.featuredImage}" alt="">

                <div class="featured-overlay">

                    <span>🔥 MOST READ</span>

                    <h3>${news.headline}</h3>

                    <small>
                        <i class="fas fa-eye"></i>
                        ${news.views || 0} Views
                    </small>

                </div>

            </a>
            `;

        } else {

            container.innerHTML += `
            <a href="article.html?id=${docSnap.id}" class="most-read-item">

                <div class="rank-number">
                    ${rank}
                </div>

                <img src="${news.featuredImage}" alt="">

                <div class="most-read-content">

                    <h4>${news.headline}</h4>

                    <small>

                        <i class="fas fa-eye"></i>

                        ${news.views || 0} Views

                    </small>

                </div>

            </a>
            `;

        }

        rank++;

    });

}

loadMostRead();
loadArticle();
loadLatestNews();
loadRelatedNews();

// ===============================
// SHARE BUTTONS
// ===============================

// ===============================
// SHARE BUTTONS
// ===============================

// ===============================
// SHARE BUTTONS
// ===============================

const articleUrl = window.location.href;

// Facebook Share
document.getElementById("shareFacebook").addEventListener("click", () => {

    const facebookPreviewUrl =
        `${window.location.origin}/share/news/${encodeURIComponent(articleId)}`;

    window.open(
        `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(facebookPreviewUrl)}`,
        "_blank",
        "width=600,height=500"
    );

});


// Copy Link
document.getElementById("copyLink").addEventListener("click", async () => {

    try{

        await navigator.clipboard.writeText(articleUrl);

        alert("✅ Link copied!");

    }

    catch(err){

        const input = document.createElement("input");

        input.value = articleUrl;

        document.body.appendChild(input);

        input.select();

        document.execCommand("copy");

        document.body.removeChild(input);

        alert("✅ Link copied!");

    }

});

// Native Share (Mobile)
document.getElementById("nativeShare").addEventListener("click", async () => {

    if(navigator.share){

        try{

            await navigator.share({

                title: document.title,

                text: "Read this news from Primetime News Cotabato",

                url: articleUrl

            });

        }

        catch(err){

            console.log(err);

        }

    }else{

        alert("Native Share is only available on supported mobile devices.");

    }

});
