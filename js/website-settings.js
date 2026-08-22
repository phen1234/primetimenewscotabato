import { db } from "./firebase.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";


const websiteRef = doc(db, "settings", "website");


async function loadWebsiteSettings() {

    try {

        const snap = await getDoc(websiteRef);

        if (!snap.exists()) {

            console.log("Website settings document not found.");
            return;

        }

        const data = snap.data();

        console.log("Website Settings:", data);


        // ==========================
        // WEBSITE TITLE
        // ==========================

        document.title =
            data.websiteName || document.title;


        // ==========================
        // WEBSITE NAME
        // ==========================

        const websiteName =
    document.getElementById("siteName");

        if (websiteName) {

            websiteName.textContent =
                data.websiteName || "";

        }


        // ==========================
        // LOGO
        // ==========================

       const siteLogo =
    document.getElementById("siteLogo");

if (siteLogo && data.websiteLogo) {

    siteLogo.src = data.websiteLogo;

}


        const headerLogo =
            document.getElementById("websiteLogoHeader");

        if (headerLogo && data.websiteLogo) {

            headerLogo.src =
                data.websiteLogo;

        }


        // ==========================
        // CONTACT EMAIL
        // ==========================

        const contactEmail =
            document.getElementById("contactEmail");

        if (contactEmail) {

            contactEmail.textContent =
                data.contactEmail || "No Email";

        }


        // ==========================
        // CONTACT NUMBER
        // ==========================

        const contactNumber =
            document.getElementById("contactNumber");

        if (contactNumber) {

            contactNumber.textContent =
                data.contactNumber || "No Contact Number";

        }


        // ==========================
        // OFFICE ADDRESS
        // ==========================

        const officeAddress =
            document.getElementById("officeAddress");

        if (officeAddress) {

            officeAddress.textContent =
                data.officeAddress || "No Address";

        }


        // ==========================
        // OFFICE HOURS
        // ==========================

        const officeHours =
            document.getElementById("officeHours");

        if (officeHours) {

            officeHours.innerHTML =
                data.officeHours ||
                "Monday - Friday<br>8:00 AM - 5:00 PM";

        }


        // ==========================
        // SOCIAL LINKS
        // ==========================

        const facebookLink =
            document.getElementById("facebookLink");

        if (facebookLink) {

            facebookLink.href =
                data.facebookLink || "#";

        }


        const youtubeLink =
            document.getElementById("youtubeLink");

        if (youtubeLink) {

            youtubeLink.href =
                data.youtubeLink || "#";

        }


        // ==========================
        // FOOTER SITE NAME
        // ==========================

        const footerSiteName =
            document.getElementById("footerSiteName");

        if (footerSiteName) {

            footerSiteName.textContent =
                data.websiteName || "";

        }


        const footerSiteName2 =
            document.getElementById("footerSiteName2");

        if (footerSiteName2) {

            footerSiteName2.textContent =
                data.websiteName || "";

        }


        // ==========================
        // FOOTER DESCRIPTION
        // ==========================

        const footerDescription =
            document.getElementById("footerDescription");

        if (footerDescription) {

            footerDescription.textContent =
                data.websiteDescription || "";

        }


        // ==========================
        // FOOTER POWERED BY
        // ==========================

        const footerPoweredBy =
            document.getElementById("footerPoweredBy");

        if (footerPoweredBy) {

            footerPoweredBy.textContent =
                "Powered by: " +
                (data.poweredBy || "Stephen Jimenez");

        }


        // ==========================
        // FOOTER YEAR
        // ==========================

        const footerYear =
            document.getElementById("footerYear");

        if (footerYear) {

            footerYear.textContent =
                new Date().getFullYear();

        }

    }

    catch (err) {

        console.error(
            "Website Settings Error:",
            err
        );

    }

}


loadWebsiteSettings();