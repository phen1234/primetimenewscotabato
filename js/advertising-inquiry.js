import { db } from "./firebase.js";

import {
    doc,
    getDoc,
    updateDoc,
    deleteDoc
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

import { loadTheme } from "./theme.js";


// ======================================
// THEME
// ======================================

loadTheme();


// ======================================
// GET INQUIRY ID FROM URL
// ======================================

const urlParams = new URLSearchParams(
    window.location.search
);

const inquiryId = urlParams.get("id");

console.log("Advertising Inquiry ID:", inquiryId);


// ======================================
// ELEMENTS
// ======================================

const loading =
    document.getElementById("loading");

const errorMessage =
    document.getElementById("errorMessage");

const inquiryContainer =
    document.getElementById("inquiryContainer");

const businessName =
    document.getElementById("businessName");

const contactPerson =
    document.getElementById("contactPerson");

const email =
    document.getElementById("email");

const phone =
    document.getElementById("phone");

const packageName =
    document.getElementById("package");

const message =
    document.getElementById("message");

const createdAt =
    document.getElementById("createdAt");

const statusBadge =
    document.getElementById("statusBadge");

const markUnreadBtn =
    document.getElementById("markUnreadBtn");

const deleteBtn =
    document.getElementById("deleteBtn");

const backBtn =
    document.getElementById("backBtn");


// ======================================
// CHECK ID
// ======================================

if (!inquiryId) {

    showError(
        "No advertising inquiry ID was provided."
    );

} else {

    loadInquiry();

}


// ======================================
// LOAD INQUIRY
// ======================================

async function loadInquiry() {

    try {

        console.log(
            "Loading inquiry:",
            inquiryId
        );


        const inquiryRef = doc(
            db,
            "advertising_inquiries",
            inquiryId
        );


        const snap =
            await getDoc(inquiryRef);


        if (!snap.exists()) {

            showError(
                "Advertising inquiry not found."
            );

            return;
        }


        const data =
            snap.data();


        console.log(
            "Inquiry data:",
            data
        );


        // ==================================
        // DISPLAY DATA
        // ==================================

        businessName.textContent =
            data.businessName ||
            "Unknown Business";


        contactPerson.textContent =
            data.contactPerson ||
            "-";


        email.textContent =
            data.email ||
            "-";


        phone.textContent =
            data.phone ||
            "-";


        packageName.textContent =
            data.package ||
            "-";


        message.textContent =
            data.message ||
            "No message provided.";


        statusBadge.textContent =
            data.status ||
            "new";


        statusBadge.className =
            `status-badge ${
                data.status === "read"
                    ? "read"
                    : "new"
            }`;


        // ==================================
        // DATE
        // ==================================

        if (
            data.createdAt &&
            typeof data.createdAt.toDate === "function"
        ) {

            createdAt.textContent =
                data.createdAt
                    .toDate()
                    .toLocaleString(
                        "en-PH",
                        {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit"
                        }
                    );

        } else {

            createdAt.textContent =
                "Date unavailable";

        }


        // ==================================
        // MARK AS READ
        // ==================================

        if (
            data.read === false ||
            data.status === "new"
        ) {

            await updateDoc(
                inquiryRef,
                {
                    read: true,
                    status: "read"
                }
            );

            statusBadge.textContent =
                "read";

            statusBadge.className =
                "status-badge read";
        }


        // ==================================
        // SHOW PAGE
        // ==================================

        loading.style.display =
            "none";

        inquiryContainer.style.display =
            "block";


    } catch (error) {

        console.error(
            "Failed to load advertising inquiry:",
            error
        );

        showError(
            "Failed to load advertising inquiry."
        );

    }

}


// ======================================
// MARK AS UNREAD
// ======================================

if (markUnreadBtn) {

    markUnreadBtn.addEventListener(
        "click",
        async () => {

            if (!inquiryId) return;

            try {

                await updateDoc(
                    doc(
                        db,
                        "advertising_inquiries",
                        inquiryId
                    ),
                    {
                        read: false,
                        status: "new"
                    }
                );

                statusBadge.textContent =
                    "new";

                statusBadge.className =
                    "status-badge new";

                alert(
                    "Inquiry marked as unread."
                );

            } catch (error) {

                console.error(
                    "Failed to mark unread:",
                    error
                );

                alert(
                    "Unable to update inquiry."
                );

            }

        }
    );

}


// ======================================
// DELETE
// ======================================

if (deleteBtn) {

    deleteBtn.addEventListener(
        "click",
        async () => {

            if (!inquiryId) return;


            const confirmed =
                confirm(
                    "Are you sure you want to delete this advertising inquiry?"
                );


            if (!confirmed) return;


            try {

                await deleteDoc(
                    doc(
                        db,
                        "advertising_inquiries",
                        inquiryId
                    )
                );


                alert(
                    "Advertising inquiry deleted."
                );


                window.location.href =
                    "advertising-inquiries.html";


            } catch (error) {

                console.error(
                    "Failed to delete inquiry:",
                    error
                );

                alert(
                    "Unable to delete inquiry."
                );

            }

        }
    );

}


// ======================================
// BACK
// ======================================

if (backBtn) {

    backBtn.addEventListener(
        "click",
        () => {

            window.location.href =
                "advertising-inquiries.html";

        }
    );

}


// ======================================
// ERROR
// ======================================

function showError(text) {

    if (loading) {

        loading.style.display =
            "none";

    }


    if (inquiryContainer) {

        inquiryContainer.style.display =
            "none";

    }


    if (errorMessage) {

        errorMessage.style.display =
            "flex";

        errorMessage.querySelector(
            "span"
        ).textContent = text;

    }

}

