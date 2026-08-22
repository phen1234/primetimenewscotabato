import {
    collection,
    addDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

import { db } from "./firebase.js";

const form = document.getElementById("advertisingInquiryForm");

if (form) {

    form.addEventListener("submit", async function (e) {

        e.preventDefault();

        const businessName =
            document.getElementById("businessName").value.trim();

        const contactPerson =
            document.getElementById("contactPerson").value.trim();

        const email =
            document.getElementById("advertisingEmail").value.trim();

        const phone =
            document.getElementById("advertisingPhone").value.trim();

        const packageName =
            document.getElementById("advertisingPackage").value;

        const message =
            document.getElementById("advertisingMessage").value.trim();

        if (
            !businessName ||
            !contactPerson ||
            !email ||
            !phone ||
            !packageName ||
            packageName === "Select Advertising Package"
        ) {
            alert("Please complete all required fields.");
            return;
        }

        const submitButton =
            form.querySelector("button[type='submit']");

        try {

            submitButton.disabled = true;
            submitButton.textContent = "Sending...";

            await addDoc(
                collection(db, "advertising_inquiries"),
                {
                    businessName: businessName,
                    contactPerson: contactPerson,
                    email: email,
                    phone: phone,
                    package: packageName,
                    message: message,

                    status: "new",
                    notification: true,
                    read: false,

                    createdAt: serverTimestamp()
                }
            );

            alert(
                "Thank you! Your advertising inquiry has been submitted successfully."
            );

            form.reset();

        } catch (error) {

            console.error(
                "Advertising inquiry error:",
                error
            );

            alert(
                "Sorry, we could not submit your inquiry. Please try again."
            );

        } finally {

            submitButton.disabled = false;
            submitButton.textContent = "Send Inquiry";

        }

    });

}