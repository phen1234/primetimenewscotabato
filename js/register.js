import { auth, db } from "./firebase.js";

import {
    GoogleAuthProvider,
    FacebookAuthProvider,
    signInWithPopup
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";

import {
    doc,
    getDoc,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

export const googleProvider = new GoogleAuthProvider();
export const facebookProvider = new FacebookAuthProvider();

facebookProvider.setCustomParameters({
    display: "popup"
});

// ==========================
// FACEBOOK REGISTER
// ==========================

const facebookBtn =
    document.getElementById("facebookRegister");

console.log("Facebook Button:", facebookBtn);

if (facebookBtn) {

    facebookBtn.addEventListener("click", async (e) => {

        e.preventDefault();

        console.log("FACEBOOK BUTTON CLICKED");

        try {

            const result =
                await signInWithPopup(
                    auth,
                    facebookProvider
                );

            console.log(
                "Facebook Auth Result:",
                result
            );

            const user =
                result.user;

            console.log(
                "Facebook User:",
                user
            );


            // ==========================
            // FIRESTORE USER
            // ==========================

            const userRef =
                doc(db, "users", user.uid);

            const snap =
                await getDoc(userRef);


            if (!snap.exists()) {

                await setDoc(userRef, {

                    name:
                        user.displayName || "",

                    email:
                        user.email || "",

                    photoURL:
                        user.photoURL || "",

                    role:
                        "User",

                    status:
                        "Active",

                    provider:
                        "Facebook",

                    createdAt:
                        serverTimestamp()

                });

            }


            Swal.fire({
                icon: "success",
                title: "Registration Successful",
                text: "Your Facebook account has been registered."
            }).then(() => {

                window.location.href =
                    "users.html";

            });


        } catch (error) {

            console.error(
                "FACEBOOK ERROR:",
                error
            );

            Swal.fire({
                icon: "error",
                title: "Facebook Registration Failed",
                text:
                    error.code +
                    " - " +
                    error.message
            });

        }

    });

} else {

    console.error(
        "Facebook register button not found!"
    );

}

// ==========================
// GOOGLE REGISTER
// ==========================

const googleBtn = document.getElementById("googleRegister");

googleBtn.addEventListener("click", async () => {

    try{

        const provider = new GoogleAuthProvider();

        const result = await signInWithPopup(auth, provider);

        const user = result.user;

        const userRef = doc(db,"users",user.uid);

        const snap = await getDoc(userRef);

        // kung wala pa sa Firestore
        if(!snap.exists()){

            await setDoc(userRef,{

                name:user.displayName || "",

                email:user.email || "",

                photoURL:user.photoURL || "",

                role:"User",

                status:"Active",

                provider:"Google",

                
                createdAt:serverTimestamp()

            });

        }

        alert("Account registered successfully!");

        window.location.href="users.html";

    }

    catch(err){

        console.error(err);

        alert(err.message);

    }

});

