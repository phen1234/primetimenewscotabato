import { db } from "./firebase.js";

import {
    collection,
    query,
    where,
    orderBy,
    getDocs
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

const featuredImage =
document.getElementById("weatherFeaturedImage");

const featuredTitle =
document.getElementById("weatherFeaturedTitle");

const featuredDescription =
document.getElementById("weatherFeaturedDescription");

const featuredBtn =
document.getElementById("weatherFeaturedBtn");

const contentList =
document.getElementById("contentList");

async function loadWeatherNews(){

    try{

        const q = query(
            collection(db,"news"),
            where("category","==","Weather"),
            orderBy("createdAt","desc")
        );

        const snap = await getDocs(q);

        if(snap.empty){

            featuredTitle.textContent =
                "No Weather News Available";

            return;

        }

        let first = true;

        contentList.innerHTML = "";

        snap.forEach(doc=>{

            const news = doc.data();

            if(first){

                featuredImage.src =
                    news.image || "images/no-image.jpg";

                featuredTitle.textContent =
                    news.headline || "";

                featuredDescription.textContent =
                    (news.summary || news.content || "")
                    .substring(0,180) + "...";

                featuredBtn.onclick = ()=>{

                    window.location.href =
                        `article.html?id=${doc.id}`;

                };

                first = false;

                return;

            }

            contentList.innerHTML += `
            <div class="news-card">

                <img src="${news.image || 'images/no-image.jpg'}">

                <div class="news-info">

                    <span class="category">
                        ${news.category}
                    </span>

                    <h3>${news.headline}</h3>

                    <p>
                        ${(news.summary || news.content || "")
                        .substring(0,120)}...
                    </p>

                    <a href="article.html?id=${doc.id}">
                        Read More →
                    </a>

                </div>

            </div>
            `;

        });

    }

    catch(err){

        console.error(err);

    }

}

loadWeatherNews();