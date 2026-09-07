import { db } from "./firebase.js"; 
import { doc, getDoc, collection, getDocs, updateDoc, increment, orderBy, query, limit, where } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js"; 

const params = new URLSearchParams(window.location.search); 
const articleId = params.get("id"); 

async function loadArticle() { 
  if (!articleId) { 
    document.getElementById("articleTitle").innerHTML = "Article not found."; 
    return; 
  } 
  try { 
    const docRef = doc(db, "news", articleId); 
    const snap = await getDoc(docRef); 
    if (!snap.exists()) { 
      document.getElementById("articleTitle").innerHTML = "Article not found."; 
      return; 
    } 
    const news = snap.data(); 

    // ACTIVE CATEGORY NAV
    const navLinks = document.querySelectorAll("#navbar .nav-links a[data-category]"); 
    const articleCategoryName = (news.category || "").trim().toLowerCase(); 
    navLinks.forEach(link => { 
      const navCategory = (link.dataset.category || "").trim().toLowerCase(); 
      link.classList.toggle("active", navCategory === articleCategoryName); 
    });

    // UNIQUE VIEW
    const viewedKey = `viewed_${articleId}`; 
    const alreadyViewed = localStorage.getItem(viewedKey); 
    let currentViews = news.views || 0; 
    if (!alreadyViewed) { 
      await updateDoc(docRef, { views: increment(1) }); 
      localStorage.setItem(viewedKey, "true"); 
      currentViews++; 
    }

    // PAGE TITLE + CONTENT
    document.title = `${news.headline || "News"} | Primetime News Cotabato`; 
    document.getElementById("articleTitle").textContent = news.headline || ""; 
    document.getElementById("articleSummary").textContent = news.summary || ""; 

    const articleImage = document.getElementById("articleImage"); 
    if (articleImage) { 
      if (news.featuredImage) { 
        articleImage.src = news.featuredImage; 
        articleImage.alt = news.headline || ""; 
        articleImage.style.display = "block"; 
      } else { 
        articleImage.style.display = "none"; 
      } 
    }

    document.getElementById("articleCategory").textContent = news.category || ""; 
    document.getElementById("categoryBadge").textContent = news.category || ""; 
    document.getElementById("articleAuthor").textContent = news.author || "Primetime News Cotabato"; 

    const articleDate = document.getElementById("articleDate"); 
    const dateValue = news.publishedAt || news.createdAt; 
    if (articleDate && dateValue && dateValue.seconds) { 
      const date = new Date(dateValue.seconds * 1000); 
      articleDate.textContent = date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }); 
    } 

    document.getElementById("articleViews").textContent = currentViews; 
    document.getElementById("articleBody").innerHTML = news.content || ""; 

  } catch (error) { 
    console.error("Load Article Error:", error); 
    document.getElementById("articleTitle").innerHTML = "Unable to load article."; 
  } 
} 

async function loadLatestNews(){ 
  const container = document.getElementById("latestSidebar"); 
  const q = query(collection(db,"news"), orderBy("createdAt","desc"), limit(5)); 
  const snapshot = await getDocs(q); 
  container.innerHTML=""; 
  snapshot.forEach(docSnap => { 
    const news = docSnap.data(); 
    container.innerHTML += ` 
      <a href="article.html?id=${docSnap.id}" class="most-read-item"> 
        <img src="${news.featuredImage}" alt=""> 
        <div class="most-read-content"> 
          <h4>${news.headline}</h4> 
          <small> <i class="fas fa-eye"></i> ${news.views || 0} Views </small> 
        </div> 
      </a> `; 
  }); 
} 

async function loadRelatedNews() { 
  const container = document.getElementById("relatedNews"); 
  if (!container) return; 
  container.innerHTML = "Loading related news..."; 
  try { 
    const currentSnap = await getDoc(doc(db, "news", articleId)); 
    if (!currentSnap.exists()) { container.innerHTML = ""; return; } 
    const currentNews = currentSnap.data(); 
    const currentCategory = (currentNews.category || "").trim(); 
    if (!currentCategory) { container.innerHTML = ""; return; } 
    
    const q = query(collection(db, "news"), where("status", "==", "published"), where("category", "==", currentCategory), orderBy("createdAt", "desc"), limit(4)); 
    const snapshot = await getDocs(q); 
    container.innerHTML = ""; 
    let count = 0; 
    snapshot.forEach(docSnap => { 
      if (docSnap.id === articleId) return; 
      if (count >= 3) return; 
      const news = docSnap.data(); 
      const dateValue = news.publishedAt || news.createdAt; 
      const date = dateValue && dateValue.seconds ? new Date(dateValue.seconds * 1000).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : ""; 
      
      container.innerHTML += ` 
        <a href="article.html?id=${docSnap.id}" class="related-card"> 
          <img src="${news.featuredImage || ""}" alt="${news.headline || ""}"> 
          <div class="related-content"> 
            <h3>${news.headline || ""}</h3> 
            <div class="related-meta"> 
              <i class="fas fa-calendar"></i> ${date} 
              <i class="fas fa-eye"></i> ${news.views || 0} Views 
            </div> 
          </div> 
        </a> `; 
      count++; 
    }); 
    if (count === 0) { container.innerHTML = `<p class="no-related">No related ${currentCategory} news yet.</p>`; } 
  } catch (error) { 
    console.error("Related News Error:", error); 
    container.innerHTML = `<p class="no-related">Unable to load related news.</p>`; 
  } 
} 

async function loadMostRead() { 
  const container = document.getElementById("mostRead"); 
  if(!container) return; 
  const q = query(collection(db, "news"), orderBy("views", "desc"), limit(6)); 
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
            <h3>${news.headline}</h3> 
            <small> <i class="fas fa-eye"></i> ${news.views || 0} Views </small> 
          </div> 
        </a> `; 
    } else { 
      container.innerHTML += ` 
        <a href="article.html?id=${docSnap.id}" class="most-read-item"> 
          <img src="${news.featuredImage}" alt=""> 
          <div class="most-read-content"> 
            <h4>${news.headline}</h4> 
            <small> <i class="fas fa-eye"></i> ${news.views || 0} Views </small> 
          </div> 
        </a> `; 
    } 
    rank++; 
  }); 
} // <-- TINANGGAL KO NA YUNG SOBRA DITO

loadMostRead(); 
loadArticle(); 
loadLatestNews(); 
loadRelatedNews(); 

// SHARE BUTTONS
const articleUrl = window.location.href; 
const articleTitle = document.title; 

document.getElementById("shareFacebook")?.addEventListener("click", (e) => { 
  e.preventDefault(); 
  window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(articleUrl)}`, "_blank"); 
}); 

document.getElementById("shareX")?.addEventListener("click", (e) => { 
  e.preventDefault(); 
  const url = encodeURIComponent(articleUrl); 
  const text = encodeURIComponent(articleTitle); 
  window.open(`https://x.com/intent/tweet?url=${url}&text=${text}`, "_blank"); 
}); 

document.getElementById("shareViber")?.addEventListener("click", (e) => { 
  e.preventDefault(); 
  const text = encodeURIComponent(articleTitle + " " + articleUrl); 
  window.location.href = `viber://forward?text=${text}`; 
}); 

document.getElementById("copyLink")?.addEventListener("click", async (e) => { 
  e.preventDefault(); 
  try{ 
    await navigator.clipboard.writeText(articleUrl); 
    showToast("✅ Link copied!"); 
  } catch(err){ 
    const input = document.createElement("input"); 
    input.value = articleUrl; 
    document.body.appendChild(input); 
    input.select(); 
    document.execCommand("copy"); 
    document.body.removeChild(input); 
    showToast("✅ Link copied!"); 
  } 
}); 

function showToast(msg){ 
  const t = document.createElement('div'); 
  t.textContent = msg; 
  t.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#0a2540;color:#fff;padding:10px 16px;border-radius:8px;z-index:99999;opacity:0;transition:0.3s'; 
  document.body.appendChild(t); 
  setTimeout(() => t.style.opacity = '1', 100); 
  setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 300); }, 2000); 
}
