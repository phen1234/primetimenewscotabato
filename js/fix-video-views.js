import { db } from "./firebase.js";

import {
    collection,
    getDocs,
    updateDoc,
    doc
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

async function fixViews(){

    const snap = await getDocs(collection(db,"videos"));

    for(const d of snap.docs){

        const data = d.data();

        if(data.views === undefined){

            await updateDoc(doc(db,"videos",d.id),{

                views:0

            });

            console.log("Updated:",d.id);

        }

    }

    alert("Done!");

}

fixViews();