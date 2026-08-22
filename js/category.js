import { db } from "./firebase.js";

import {
collection,
query,
orderBy,
getDocs
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

const featuredContainer = document.getElementById("featuredNews");
const newsContainer = document.getElementById("categoryNews");

const searchInput = document.getElementById("searchNews");

const categoryButtons =
document.querySelectorAll(".categoryMenu button");

let allNews=[];

async function loadNews(){

    const q=query(
        collection(db,"news"),
        orderBy("createdAt","desc")
    );

    const snapshot=await getDocs(q);

    allNews=[];

    snapshot.forEach(doc=>{

        allNews.push({
            id:doc.id,
            ...doc.data()
        });

    });

    renderFeatured();

    renderNews(allNews);

    renderTrending();

}

function renderFeatured(){

    if(allNews.length===0) return;

    const news=allNews[0];

    featuredContainer.innerHTML=`

<div class="featuredNews">

<img src="${news.featuredImage}">

<div class="featuredOverlay">

<span>${news.category}</span>

<h2>${news.headline}</h2>

<p>${news.summary}</p>

<a href="article.html?id=${news.id}">
Read Full Story →
</a>

</div>

</div>

`;

}

function renderNews(newsList){

    newsContainer.innerHTML="";

    newsList.forEach(news=>{

        newsContainer.innerHTML+=`

<div class="news-card">

<img src="${news.featuredImage}">

<div class="news-card-content">

<span>${news.category}</span>

<h2>${news.headline}</h2>

<p>${news.summary}</p>

<a href="article.html?id=${news.id}">
Read More →
</a>

</div>

</div>

`;

    });

}


function renderTrending() {

    const trending = document.getElementById("trendingNews");

    trending.innerHTML = "";

    allNews.slice(0,5).forEach(news => {

        trending.innerHTML += `

        <div class="trending-item">

            <img src="${news.featuredImage}" alt="">

            <div>

                <h4>
                    <a href="article.html?id=${news.id}">
                        ${news.headline}
                    </a>
                </h4>

                <small>${news.category}</small>

            </div>

        </div>

        `;

    });

}


/* SEARCH */

searchInput.addEventListener("input",()=>{

    const keyword=
    searchInput.value.toLowerCase();

    const filtered=
    allNews.filter(news=>

        news.headline.toLowerCase().includes(keyword) ||

        news.summary.toLowerCase().includes(keyword)

    );

    renderNews(filtered);

});

/* CATEGORY */

categoryButtons.forEach(btn=>{

btn.addEventListener("click",()=>{

categoryButtons.forEach(b=>
b.classList.remove("active"));

btn.classList.add("active");

const cat=btn.dataset.category;

if(cat==="All"){

renderNews(allNews);

return;

}

const filtered=

allNews.filter(news=>

news.category===cat

);

renderNews(filtered);

});

});

loadNews();