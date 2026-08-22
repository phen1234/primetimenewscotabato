import { db } from "./firebase.js";

import {
    collection,
    addDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    doc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

const saveBtn = document.getElementById("saveAuthor");
const authorName = document.getElementById("authorName");
const authorPosition = document.getElementById("authorPosition");
const authorEmail = document.getElementById("authorEmail");
const table = document.getElementById("authorsTable");

let editingId = null;

async function loadAuthors(){

    table.innerHTML="";

    const snap = await getDocs(collection(db,"authors"));

    snap.forEach(docSnap=>{

        const a = docSnap.data();

        table.innerHTML += `
        <tr>

            <td>${a.name}</td>
            <td>${a.position}</td>
            <td>${a.email}</td>

            <td>

                <button class="editBtn"
                    onclick="editAuthor('${docSnap.id}')">
                    Edit
                </button>

                <button class="deleteBtn"
                    onclick="deleteAuthor('${docSnap.id}')">
                    Delete
                </button>

            </td>

        </tr>
        `;

    });

}

loadAuthors();

saveBtn.addEventListener("click", async ()=>{

    const name = authorName.value.trim();
    const position = authorPosition.value;
    const email = authorEmail.value.trim();

    if(name==""){
        alert("Enter author name.");
        return;
    }

    if(editingId){

        await updateDoc(doc(db,"authors",editingId),{

            name,
            position,
            email

        });

        editingId = null;

        saveBtn.innerHTML = `
        <i class="fas fa-save"></i>
        Register Author
        `;

    }else{

        await addDoc(collection(db,"authors"),{

            name,
            position,
            email,
            createdAt: serverTimestamp()

        });

    }

    authorName.value="";
    authorPosition.value="Writer";
    authorEmail.value="";

    loadAuthors();

});

window.deleteAuthor = async(id)=>{

    if(confirm("Delete this author?")){

        await deleteDoc(doc(db,"authors",id));

        loadAuthors();

    }

}

window.editAuthor = async(id)=>{

    const snap = await getDocs(collection(db,"authors"));

    snap.forEach(docSnap=>{

        if(docSnap.id===id){

            const a = docSnap.data();

            authorName.value = a.name;
            authorPosition.value = a.position;
            authorEmail.value = a.email;

            editingId = id;

            saveBtn.innerHTML=`
            <i class="fas fa-save"></i>
            Update Author
            `;

        }

    });

}