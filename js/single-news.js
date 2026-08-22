import { db } from "./firebase.js";

import {
collection,
doc,
getDoc,
getDocs,
query,
orderBy

} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

const params = new URLSearchParams(window.location.search);

const id = params.get("id");

const singleNews =
document.getElementById("singleNews");

const relatedNews =
document.getElementById("relatedNews");

async function loadNews(){

const ref = doc(db,"news",id);

const snap = await getDoc(ref);

if(!snap.exists()){

singleNews.innerHTML="<h2>News not found.</h2>";

return;

}

const news = snap.data();

document.title = news.headline;

singleNews.innerHTML=`

<div class="singleHero">

<img src="${news.featuredImage}">

<span class="categoryBadge">

${news.category}

</span>

<h1>

${news.headline}

</h1>

<div class="newsMeta">

<span>

<i class="fas fa-user"></i>

${news.author || "Administrator"}

</span>

<span>

<i class="fas fa-calendar"></i>

${news.createdAt?.toDate().toLocaleDateString() || ""}

</span>

</div>

<div class="newsContent">

${news.content}

</div>

</div>

`;

loadRelated(news.category);

}

async function loadRelated(category){

const q=query(

collection(db,"news"),

orderBy("createdAt","desc")

);

const snapshot=await getDocs(q);

relatedNews.innerHTML="<div class='relatedGrid'>";

snapshot.forEach(docSnap=>{

const news=docSnap.data();

if(docSnap.id===id) return;

if(news.category!==category) return;

relatedNews.innerHTML+=`

<div class="relatedCard"

onclick="location.href='single-news.html?id=${docSnap.id}'">

<img src="${news.featuredImage}">

<h3>

${news.headline}

</h3>

</div>

`;

});

relatedNews.innerHTML+="</div>";

}

loadNews();