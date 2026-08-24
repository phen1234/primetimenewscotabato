import { db } from "./firebase.js";

import {
collection,
getDocs,
deleteDoc,
doc
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

const newsTable = document.getElementById("newsTable");

if(!newsTable){
console.log("newsTable not found.");
}

let allNews = [];
let currentFilter = "all";

document.querySelectorAll(".filterBtn").forEach(btn=>{

btn.addEventListener("click",()=>{  

    document.querySelectorAll(".filterBtn")  
    .forEach(b=>b.classList.remove("active"));  

    btn.classList.add("active");  

    currentFilter = btn.dataset.type;  

    applyFilter();  

});

});

const categoryLinks =
document.querySelectorAll(".category-link");

categoryLinks.forEach(link=>{

link.addEventListener("click",(e)=>{  

    e.preventDefault();  

    const category =  
    link.dataset.category;  

    const filtered = allNews  
.filter(item =>  
    item.status === "published" &&  
    item.category === category  
)  
  
.sort((a,b)=>{  

    const A = a.publishedAt?.seconds || a.createdAt?.seconds || 0;  
    const B = b.publishedAt?.seconds || b.createdAt?.seconds || 0;  

    return B - A;  

});  

    renderNews(filtered);  

});

});

function applyFilter(){

let filtered = allNews.filter(item=>{  

    if(item.type==="news"){  

        return item.status==="published";  

    }  

    return true;  

});  

if(currentFilter==="news"){  

    filtered = filtered.filter(item=>item.type==="news");  

}  

if(currentFilter==="video"){  

    filtered = filtered.filter(item=>item.type==="video");  

}  

filtered.sort((a,b)=>{  

    const A = a.publishedAt?.seconds || a.createdAt?.seconds || 0;  
    const B = b.publishedAt?.seconds || b.createdAt?.seconds || 0;  

    return B-A;  

});  

renderNews(filtered);

}

// =====================
// RENDER TABLE
// =====================

function renderNews(newsList){

if(!newsTable) return;  

newsTable.innerHTML = "";  

if(newsList.length === 0){  

    newsTable.innerHTML = `  
    <tr>  
        <td colspan="6" style="text-align:center;padding:30px;">  
            No news found.  
        </td>  
    </tr>  
    `;  
    return;  
}  

newsList.forEach(item=>{  

    const publishDate =  
    (item.publishedAt?.seconds || item.createdAt?.seconds)  
    ? new Date(  
        (item.publishedAt?.seconds || item.createdAt?.seconds)*1000  
    ).toLocaleDateString("en-US",{  
        month:"short",  
        day:"numeric",  
        year:"numeric"  
    })  
    : "-";  

    newsTable.innerHTML += `

<tr>  <td>  <img src="${
item.type==="video"
? (item.thumbnail || "../images/PRIMETIME NEWS LOGO.png")
: (item.featuredImage || "../images/PRIMETIME NEWS LOGO.png")
}" class="thumb">

</td>  <td>  <span class="typeBadge ${item.type}">  ${
item.type==="video"
? <span class="typeBadge video">   <i class="fab fa-youtube"></i> VIDEO   </span>
: <span class="typeBadge news">   <i class="fas fa-newspaper"></i> ARTICLE   </span>
}

</span>  <div class="headlineText">  ${item.title || item.headline}

</div>  </td>  <td>  ${item.category || "-"}

</td>  <td>  ${item.author || "-"}

</td>  <td class="statusColumn">  <span class="publishedBadge">  <i class="fas fa-circle-check"></i>

Published

</span>  <div class="publishDate">  ${publishDate}

</div>  </td>  <td>  <button  
class="editBtn"  
onclick="editContent('${item.id}','${item.type}')">

<i class="fas fa-edit"></i>

</button>  <button  
class="deleteBtn"  
onclick="deleteContent('${item.id}','${item.type}')">

<i class="fas fa-trash"></i>

</button>  </td>  </tr>  `;

});

}

// =====================
// LOAD NEWS
// =====================

async function loadNews() {

    if (!newsTable) return;

    try {

        allNews = [];

        // =========================
        // LOAD ARTICLES
        // =========================

        const newsSnap =
            await getDocs(collection(db, "news"));

        newsSnap.forEach(docSnap => {

            allNews.push({
                id: docSnap.id,
                type: "news",
                ...docSnap.data()
            });

        });


        // =========================
        // LOAD VIDEOS
        // =========================

        const videoSnap =
            await getDocs(collection(db, "videos"));

        videoSnap.forEach(docSnap => {

            allNews.push({
                id: docSnap.id,
                type: "video",
                ...docSnap.data()
            });

        });


        // =========================
        // DISPLAY
        // =========================

        const published = allNews.filter(item => {

            // Videos are always displayed
            if (item.type === "video") {
                return true;
            }

            // Articles must be published
            return item.status === "published";

        });


        // =========================
        // SORT LATEST FIRST
        // =========================

        published.sort((a, b) => {

            const A =
                a.publishedAt?.seconds ||
                a.createdAt?.seconds ||
                0;

            const B =
                b.publishedAt?.seconds ||
                b.createdAt?.seconds ||
                0;

            return B - A;

        });


        renderNews(published);

        console.log(
            "✅ NEWS LOADED:",
            published.length,
            published
        );

    } catch (err) {

        console.error(
            "❌ LOAD NEWS ERROR:",
            err
        );

    }

}
// =====================
// SEARCH
// =====================

const searchBox = document.getElementById("searchNews");

if (searchBox) {

searchBox.addEventListener("input", function () {  

    const keyword = this.value.toLowerCase();  

    const filtered = allNews

.filter(item => {

const title = item.headline || item.title || "";  

return title.toLowerCase().includes(keyword);

})
.sort((a,b)=>{

const A=a.publishedAt?.seconds||a.createdAt?.seconds||0;
const B=b.publishedAt?.seconds||b.createdAt?.seconds||0;

return B-A;

});

renderNews(filtered);

});

}

// =====================
// DELETE
// =====================

window.deleteContent = async(id,type)=>{

if(!confirm("Delete this item?")) return;  

await deleteDoc(doc(db,type==="video" ? "videos":"news",id));  

loadNews();

};

// =====================
// EDIT
// =====================

window.editContent = (id,type)=>{

if(type==="video"){  

    window.location.href=`add-video.html?id=${id}`;  

}else{  

    window.location.href=`add-news.html?id=${id}`;  

}

};

const homeBtn = document.getElementById("homeNews");

if(homeBtn){

homeBtn.addEventListener("click",(e)=>{  

    e.preventDefault();  

    currentFilter = "all";  

    document.querySelectorAll(".filterBtn")  
    .forEach(btn=>btn.classList.remove("active"));  

    document.querySelector('[data-type="all"]')?.classList.add("active");  

    applyFilter();  

});

}

// =========================
// DATE FILTER
// =========================

const dateFilter = document.getElementById("dateFilter");

if(dateFilter){

dateFilter.addEventListener("change",()=>{  

    const value = dateFilter.value;

let filtered = allNews.filter(item=>{

if(item.type==="news"){  

    return item.status==="published";  

}  

return true;

});

if(currentFilter==="news"){

filtered = filtered.filter(item=>item.type==="news");

}

if(currentFilter==="video"){

filtered = filtered.filter(item=>item.type==="video");

}

if(value){

filtered = filtered.filter(item=>{  

    const ts =  
    item.publishedAt?.seconds ||  
    item.createdAt?.seconds;  

    if(!ts) return false;  

    const d=new Date(ts*1000);  

    const yyyy=d.getFullYear();  
    const mm=String(d.getMonth()+1).padStart(2,"0");  
    const dd=String(d.getDate()).padStart(2,"0");  

    return `${yyyy}-${mm}-${dd}`===value;  

});

}

// =========================
// CLEAR DATE FILTER
// =========================

const clearDate = document.getElementById("clearDate");

if(clearDate){

clearDate.addEventListener("click",()=>{  

    // alisin ang selected date  
    dateFilter.value = "";  

    // ibalik ang current filter (All / News / Video)  
    applyFilter();  

});

}

renderNews(filtered);

});

}
