import { db } from "./firebase.js";

import {
    collection,
    addDoc,
    serverTimestamp,
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

async function loadContactSettings() {

    try {

        const ref = doc(db, "settings", "website");
        const snap = await getDoc(ref);

        if (!snap.exists()) {

            console.log("Settings document not found.");
            return;

        }

        const data = snap.data();

        console.log("Website Settings:", data);

        const officeAddress =
            document.getElementById("officeAddress");

        const contactNumber =
            document.getElementById("contactNumber");

        const contactEmail =
            document.getElementById("contactEmail");


        if (officeAddress) {

            officeAddress.textContent =
                data.officeAddress || "No Address";

        }


        if (contactNumber) {

            contactNumber.textContent =
                data.contactNumber || "No Phone";

        }


        if (contactEmail) {

            contactEmail.textContent =
                data.contactEmail || "No Email";

        }

    } catch (error) {

        console.error(
            "Failed to load contact settings:",
            error
        );

    }

}

loadContactSettings();


// ==========================
// CONTACT FORM
// ==========================

const form =
    document.getElementById("contactForm");

const status =
    document.getElementById("contactStatus");


console.log("Contact JS Loaded");


if (form) {

    form.addEventListener("submit", async (e) => {

        e.preventDefault();

        console.log("Submit clicked");

        try {

            await addDoc(
                collection(db, "contactMessages"),
                {

                    name:
                        document.getElementById("name").value,

                    email:
                        document.getElementById("email").value,

                    subject:
                        document.getElementById("subject").value,

                    message:
                        document.getElementById("message").value,

                    status: "unread",

                    createdAt:
                        serverTimestamp()

                }
            );


            console.log("Saved successfully");


            if (status) {

                status.style.color = "green";

                status.textContent =
                    "Message sent successfully.";

            }


            form.reset();


        } catch (err) {

            console.error(err);


            if (status) {

                status.style.color = "red";

                status.textContent =
                    err.message;

            }

        }

    });

}