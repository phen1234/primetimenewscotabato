import { db } from "./firebase.js";

import {
    doc,
    getDoc,
    updateDoc
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

const params = new URLSearchParams(window.location.search);
const userId = params.get("id");

const form = document.getElementById("editForm");

const userPhoto = document.getElementById("userPhoto");
const displayName = document.getElementById("displayName");
const displayEmail = document.getElementById("displayEmail");

const nameInput = document.getElementById("name");
const emailInput = document.getElementById("email");
const roleInput = document.getElementById("role");
const statusInput = document.getElementById("status");

// ================================
// LOAD USER
// ================================

async function loadUser(){

    if(!userId){

        alert("Invalid User");

        history.back();

        return;

    }

    try{

        const snap = await getDoc(doc(db,"users",userId));

        if(!snap.exists()){

            alert("User not found.");

            history.back();

            return;

        }

        const user = snap.data();

        userPhoto.src =
            user.photoURL || "../images/default-user.png";

        displayName.textContent =
            user.name || "-";

        displayEmail.textContent =
            user.email || "-";

        nameInput.value =
            user.name || "";

        emailInput.value =
            user.email || "";

        roleInput.value =
            user.role || "User";

        statusInput.value =
            user.status || "Active";

    }

    catch(err){

        console.error(err);

        alert(err.message);

    }

}

loadUser();

// ================================
// SAVE
// ================================

form.addEventListener("submit",async(e)=>{

    e.preventDefault();

    try{

        await updateDoc(doc(db,"users",userId),{

            name:nameInput.value,

            role:roleInput.value,

            status:statusInput.value

        });

        alert("Account Updated Successfully!");

        window.location.href="users.html";

    }

    catch(err){

        console.error(err);

        alert(err.message);

    }

});