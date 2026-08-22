
import { db } from "./firebase.js";


import {
    collection,
    addDoc,
    updateDoc,
    getDoc,
    doc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

const form = document.getElementById("videoForm");

const youtubeInput = document.getElementById("youtubeUrl");
const thumb = document.getElementById("thumbnailPreview");
const preview = document.getElementById("youtubePreview");

// ==========================
// Extract YouTube Video ID
// ==========================

function getVideoId(url){

    const regExp =
    /^.*(?:youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=)([^#&?]*).*/;

    const match = url.match(regExp);

    return match && match[1].length === 11
        ? match[1]
        : null;

}

// ==========================
// EDIT MODE
// ==========================

const params = new URLSearchParams(window.location.search);
const editId = params.get("id");

if(editId){

    const snap = await getDoc(doc(db,"videos",editId));

    if(snap.exists()){

        const data = snap.data();

        document.getElementById("videoTitle").value = data.title || "";
        document.getElementById("videoDescription").value = data.description || "";
        document.getElementById("videoCategory").value = data.category || "";
        document.getElementById("videoAuthor").value = data.author || "";
        document.getElementById("youtubeUrl").value = data.youtube || "";
        document.getElementById("featuredVideo").checked = data.featured || false;

        if(data.thumbnail){

            thumb.src = data.thumbnail;

        }

        if(data.videoId){

            preview.src = `https://www.youtube.com/embed/${data.videoId}`;
            preview.style.display = "block";

        }

        document.querySelector("#videoForm button[type='submit']").textContent = "Update Video";

    }

}

// ==========================
// Preview Thumbnail
// ==========================

youtubeInput.addEventListener("input",()=>{

    const id = getVideoId(youtubeInput.value);

    if(!id){

        thumb.src="../images/no-thumbnail.png";

        preview.style.display="none";

        return;

    }

    thumb.src=`https://img.youtube.com/vi/${id}/hqdefault.jpg`;

    preview.src=`https://www.youtube.com/embed/${id}`;

    preview.style.display="block";

});

// ==========================
// Publish Video
// ==========================

form.addEventListener("submit",async(e)=>{

    e.preventDefault();

    const id = getVideoId(youtubeInput.value);

    if(!id){

        alert("Invalid YouTube Link");

        return;

    }

    try{

        const payload = {

    title: document.getElementById("videoTitle").value,
    description: document.getElementById("videoDescription").value,
    category: document.getElementById("videoCategory").value,
    author: document.getElementById("videoAuthor").value,
    youtube: youtubeInput.value,
    videoId: id,
    thumbnail:`https://img.youtube.com/vi/${id}/hqdefault.jpg`,
    featured: document.getElementById("featuredVideo").checked

};

// para sa bagong video lang
if (!editId) {

    payload.views = 0;

}

if(editId){

    await updateDoc(doc(db,"videos",editId),payload);

}else{

    payload.createdAt = serverTimestamp();

// bagong field
payload.views = 0;

await addDoc(collection(db,"videos"), payload);

}


        alert(editId ? "Video Updated Successfully!" : "Video Published Successfully!");

        form.reset();

        thumb.src="../images/no-thumbnail.png";

        preview.style.display="none";

    }catch(err){

        console.error(err);

        alert(err.message);

    }

});