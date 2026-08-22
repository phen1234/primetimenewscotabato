import { db, auth } from "./firebase.js";

import {
    updatePassword,
    EmailAuthProvider,
    reauthenticateWithCredential,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";

import {
    doc,
    getDoc,
    setDoc,
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

const currentPassword = document.getElementById("currentPassword");
const newPassword = document.getElementById("newPassword");
const confirmPassword = document.getElementById("confirmPassword");
const changePassword = document.getElementById("changePassword");

const saveProfile = document.getElementById("saveProfile");
const saveWebsite = document.getElementById("saveWebsite");
const saveWeather = document.getElementById("saveWeather");
const saveAppearance = document.getElementById("saveAppearance");

const adminName = document.getElementById("adminName");
const adminEmail = document.getElementById("adminEmail");
const adminPhone = document.getElementById("adminPhone");

const websiteName = document.getElementById("websiteName");
const websiteDescription = document.getElementById("websiteDescription");
const contactEmail = document.getElementById("contactEmail");
const contactNumber = document.getElementById("contactNumber");
const officeAddress = document.getElementById("officeAddress");
const facebookLink = document.getElementById("facebookLink");
const youtubeLink = document.getElementById("youtubeLink");

const weatherCity = document.getElementById("weatherCity");
const weatherApiKey = document.getElementById("weatherApiKey");
const weatherUnit = document.getElementById("weatherUnit");
const weatherRefresh = document.getElementById("weatherRefresh");

const primaryColor = document.getElementById("primaryColor");
const secondaryColor = document.getElementById("secondaryColor");
const themeMode = document.getElementById("themeMode");
const fontSize = document.getElementById("fontSize");


const photoURL =
document.getElementById("photoURL");

const profilePreview =
document.getElementById("profilePreview");

const websiteLogo =
document.getElementById("websiteLogo");

const logoPreview =
document.getElementById("logoPreview");

const profileSettingsSection =
    document.getElementById("profileSettingsSection");

const changePasswordSection =
    document.getElementById("changePasswordSection");

  function handleSocialAccountSettings() {

    const user = auth.currentUser;

    if (!user) return;

    const profileSection =
        document.getElementById("profileSettingsSection");

    const changePasswordSection =
        document.getElementById("changePasswordSection");

    // Kunin ang role mula Firestore
    getDoc(
        doc(db, "users", user.uid)
    ).then((snap) => {

        if (!snap.exists()) return;

        const userData = snap.data();
        const role = userData.role || "";

        // =========================
        // EDITOR / REPORTER
        // =========================

        if (
            role === "Editor" ||
            role === "Reporter"
        ) {

            if (profileSection) {
                profileSection.style.display = "none";
            }

            if (changePasswordSection) {
                changePasswordSection.style.display = "none";
            }

            return;
        }

        // =========================
        // ADMIN / SUPER ADMIN
        // =========================

        if (
            role === "Admin" ||
            role === "Super Admin"
        ) {

            if (profileSection) {
                profileSection.style.display = "block";
            }

            if (changePasswordSection) {
                changePasswordSection.style.display = "block";
            }
        }

    }).catch((error) => {

        console.error(
            "Failed to check user role:",
            error
        );

    });
}


 async function loadSettings() {

    try {

        const ref = doc(db, "settings", "website");

        const snap = await getDoc(ref);

        if (!snap.exists()) return;

        const data = snap.data();

        // ==========================
        // WEBSITE NAME
        // ==========================

        const siteName =
            document.getElementById("siteName");

        if (siteName) {

            siteName.textContent =
                data.websiteName ||
                "Primetime News Cotabato";

        }


        // ==========================
        // WEBSITE
        // ==========================

        logoPreview.src =
            data.websiteLogo ||
            "../images/PRIMETIME NEWS LOGO.png";

        websiteName.value =
            data.websiteName || "";

        websiteDescription.value =
            data.websiteDescription || "";

        contactEmail.value =
            data.contactEmail || "";

        contactNumber.value =
            data.contactNumber || "";

        officeAddress.value =
            data.officeAddress || "";

        facebookLink.value =
            data.facebookLink || "";

        youtubeLink.value =
            data.youtubeLink || "";

        // ==========================
        // WEATHER
        // ==========================

        weatherCity.value =
            data.weatherCity || "";

        weatherApiKey.value =
            data.weatherApiKey || "";

        weatherUnit.value =
            data.weatherUnit || "metric";

        weatherRefresh.value =
            data.weatherRefresh || 30;

        // ==========================
        // APPEARANCE
        // ==========================

        primaryColor.value =
            data.primaryColor || "#2563eb";

        secondaryColor.value =
            data.secondaryColor || "#ef4444";

        themeMode.value =
            data.themeMode || "light";

        fontSize.value =
            data.fontSize || "16";

        applyAppearance({

            primaryColor:
                primaryColor.value,

            secondaryColor:
                secondaryColor.value,

            fontSize:
                fontSize.value,

            themeMode:
                themeMode.value

        });

    } catch (error) {

        console.error(
            "Failed to load settings:",
            error
        );

    }

}

async function loadSystemInfo() {

    const newsSnap = await getDocs(collection(db, "news"));
    document.getElementById("totalNews").textContent = newsSnap.size;

    const categorySnap = await getDocs(collection(db, "categories"));
    document.getElementById("totalCategories").textContent = categorySnap.size;

    document.getElementById("totalAccounts").textContent = "-";

    document.getElementById("totalAuthors").textContent = "-";

    let totalMedia = 0;

    newsSnap.forEach(doc => {

        const data = doc.data();

        if (data.galleryImages && Array.isArray(data.galleryImages)) {

            totalMedia += data.galleryImages.length;

        }

        if (data.featuredImage) {

            totalMedia++;

        }

    });

    document.getElementById("totalMedia").textContent = totalMedia;

    document.getElementById("lastUpdated").textContent =
        new Date().toLocaleString();

}

async function checkSettingsAccess() {

    const currentUser = auth.currentUser;

    if (!currentUser) {
        location.href = "../index.html";
        return false;
    }

    const snap = await getDoc(
        doc(db, "users", currentUser.uid)
    );

    if (!snap.exists()) {
        location.href = "../index.html";
        return false;
    }

    const userData = snap.data();
    const role = userData.role || "";

    if (
        role !== "Admin" &&
        role !== "Super Admin" &&
        role !== "Reporter" &&
        role !== "Editor"
    ) {
        Swal.fire({
            icon: "error",
            title: "Access Denied",
            text: "You are not allowed to access Settings."
        }).then(() => {
            location.href = "dashboard.html";
        });

        return false;
    }

    return true;
}
// ==========================
// LIVE THEME SWITCH
// ==========================




photoURL.onchange = () => {

    const file = photoURL.files[0];

    if(file){

        profilePreview.src =
        URL.createObjectURL(file);

    }

};

websiteLogo.onchange = () => {

    const file = websiteLogo.files[0];

    if(file){

        logoPreview.src =
        URL.createObjectURL(file);

    }

};

const settingsMenu = document.getElementById("settingsMenu");

if (settingsMenu) {
    settingsMenu.onclick = () => {
        location.href = "settings.html";
    };
}
  

   async function uploadToCloudinary(file) {

    const formData = new FormData();

    formData.append("file", file);

    formData.append("upload_preset", "primetime_news");

    formData.append("folder", "primetime-news");

    const response = await fetch(
        "https://api.cloudinary.com/v1_1/ufx7karu/image/upload",
        {
            method: "POST",
            body: formData
        }
    );

    const result = await response.json();

    if (!response.ok) {

        throw new Error(result.error.message);

    }

    console.log("Cloudinary Result:", result);

    return result.secure_url;

}


   async function saveAllSettings() {

    try {

        // Kunin muna ang kasalukuyang settings
        const settingsRef = doc(db, "settings", "website");
        const snap = await getDoc(settingsRef);

        let oldData = {};

        if (snap.exists()) {
            oldData = snap.data();
        }

        // Gamitin muna ang lumang image
        let profileURL = oldData.photoURL || "";
        let logoURL = oldData.websiteLogo || "";

        // Upload lang kapag may bagong profile image
        if (photoURL.files.length > 0) {

            profileURL = await uploadToCloudinary(
                photoURL.files[0]
            );

        }

        // Upload lang kapag may bagong logo
        if (websiteLogo.files.length > 0) {

            logoURL = await uploadToCloudinary(
                websiteLogo.files[0]
            );

        }

        await setDoc(settingsRef, {

            photoURL: profileURL,
            websiteLogo: logoURL,

            adminName: adminName.value,
            adminEmail: adminEmail.value,
            adminPhone: adminPhone.value,

            websiteName: websiteName.value,
            websiteDescription: websiteDescription.value,
            contactEmail: contactEmail.value,
            contactNumber: contactNumber.value,
            officeAddress: officeAddress.value,
            facebookLink: facebookLink.value,
            youtubeLink: youtubeLink.value,

            weatherCity: weatherCity.value,
            weatherApiKey: weatherApiKey.value,
            weatherUnit: weatherUnit.value,
            weatherRefresh: weatherRefresh.value,

            primaryColor: primaryColor.value,
            secondaryColor: secondaryColor.value,
            themeMode: themeMode.value,
            fontSize: fontSize.value

        });

        // Apply appearance immediately
applyAppearance({
    primaryColor: primaryColor.value,
    secondaryColor: secondaryColor.value,
    fontSize: fontSize.value,
    themeMode: themeMode.value
});

       // Update preview
profilePreview.src = profileURL;

console.log("PROFILE ELEMENT:", profilePreview);
console.log("PROFILE SRC:", profilePreview.src);
console.log("PROFILE URL:", profileURL);

        // Update sidebar logo kung meron
        const siteLogo = document.getElementById("siteLogo");
        if (siteLogo) {
            siteLogo.src = logoURL;
        }

        Swal.fire(
            "Success",
            "Settings Saved Successfully",
            "success"
        );

    } catch (err) {

        console.error(err);

        Swal.fire(
            "Error",
            err.message,
            "error"
        );

    }

}




async function changeUserPassword() {

    const user = auth.currentUser;

    if (!user) {

        Swal.fire(
            "Error",
            "No logged in user.",
            "error"
        );

        return;
    }

    if (
        newPassword.value !== confirmPassword.value
    ) {

        Swal.fire(
            "Error",
            "Passwords do not match.",
            "error"
        );

        return;
    }

    if (newPassword.value.length < 6) {

        Swal.fire(
            "Error",
            "Password must be at least 6 characters.",
            "error"
        );

        return;
    }

    try {

        const credential =
            EmailAuthProvider.credential(
                user.email,
                currentPassword.value
            );

        await reauthenticateWithCredential(
            user,
            credential
        );

        await updatePassword(
            user,
            newPassword.value
        );

        Swal.fire(
            "Success",
            "Password changed successfully.",
            "success"
        );

        currentPassword.value = "";
        newPassword.value = "";
        confirmPassword.value = "";

    } catch (err) {

        Swal.fire(
            "Error",
            err.message,
            "error"
        );

    }

}


// Save Buttons

saveProfile.onclick = saveProfileSettings;
saveWebsite.onclick = saveWebsiteSettings;
saveWeather.onclick = saveWeatherSettings;
saveAppearance.onclick = saveAppearanceSettings;
changePassword.onclick = changeUserPassword;


async function saveAppearanceSettings() {
    try {
        const ref = doc(db, "settings", "website");

        const snap = await getDoc(ref);

        let oldData = {};

        if (snap.exists()) {
            oldData = snap.data();
        }

        const appearance = {
            primaryColor: primaryColor.value,
            secondaryColor: secondaryColor.value,
            themeMode: themeMode.value,
            fontSize: fontSize.value
        };

        await setDoc(ref, {
            ...oldData,
            ...appearance
        });

        // Apply immediately
        applyAppearance(appearance);

        // Save locally
        localStorage.setItem(
            "appearance",
            JSON.stringify(appearance)
        );

        Swal.fire(
            "Success",
            "Appearance Updated",
            "success"
        );

    } catch (err) {

        console.error(err);

        Swal.fire(
            "Error",
            err.message,
            "error"
        );
    }
}

function applyAppearance(data) {

    document.documentElement.style.setProperty(
        "--primary-color",
        data.primaryColor || "#2563eb"
    );

    document.documentElement.style.setProperty(
        "--secondary-color",
        data.secondaryColor || "#ef4444"
    );

    document.documentElement.style.setProperty(
        "--font-size",
        (data.fontSize || "16") + "px"
    );

    if (data.themeMode === "dark") {

        document.body.classList.add("dark-mode");

    } else {

        document.body.classList.remove("dark-mode");

    }

}

themeMode.addEventListener("change", () => {

    applyAppearance({
        primaryColor: primaryColor.value,
        secondaryColor: secondaryColor.value,
        fontSize: fontSize.value,
        themeMode: themeMode.value
    });

});

primaryColor.addEventListener("input", () => {

    applyAppearance({
        primaryColor: primaryColor.value,
        secondaryColor: secondaryColor.value,
        fontSize: fontSize.value,
        themeMode: themeMode.value
    });

});

secondaryColor.addEventListener("input", () => {

    applyAppearance({
        primaryColor: primaryColor.value,
        secondaryColor: secondaryColor.value,
        fontSize: fontSize.value,
        themeMode: themeMode.value
    });

});

fontSize.addEventListener("change", () => {

    applyAppearance({
        primaryColor: primaryColor.value,
        secondaryColor: secondaryColor.value,
        fontSize: fontSize.value,
        themeMode: themeMode.value
    });

});


// Live Preview ng Appearance
primaryColor.addEventListener("input", () => {
    document.documentElement.style.setProperty(
        "--primary-color",
        primaryColor.value
    );
});

secondaryColor.addEventListener("input", () => {
    document.documentElement.style.setProperty(
        "--secondary-color",
        secondaryColor.value
    );
});

fontSize.addEventListener("change", () => {
    document.documentElement.style.setProperty(
        "--font-size",
        fontSize.value + "px"
    );
});

async function saveProfileSettings() {

    const user = auth.currentUser;

    if (!user) {
        Swal.fire(
            "Error",
            "No logged in user.",
            "error"
        );
        return;
    }

    try {

        // =========================
        // USER DOCUMENT
        // =========================

        const userRef = doc(
            db,
            "users",
            user.uid
        );

        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {

            Swal.fire(
                "Error",
                "User profile document not found.",
                "error"
            );

            return;
        }

        const oldData = userSnap.data();

        // =========================
        // KEEP OLD PROFILE IMAGE
        // =========================

        let profileURL =
            oldData.photoURL || "";

        /// =========================
// UPLOAD NEW PROFILE IMAGE
// =========================

if (
    photoURL &&
    photoURL.files &&
    photoURL.files.length > 0
) {

    profileURL =
        await uploadToCloudinary(
            photoURL.files[0]
        );

    console.log(
        "NEW PROFILE URL:",
        profileURL
    );
}


// =========================
// SAVE USER PROFILE
// =========================

await setDoc(
    userRef,
    {
        name: adminName.value.trim(),
        phone: adminPhone.value.trim(),
        photoURL: profileURL
    },
    {
        merge: true
    }
);


// =========================
// UPDATE PREVIEW
// =========================

profilePreview.src = profileURL;

console.log(
    "Saved photoURL:",
    profileURL
);
        // =========================
        // SAVE USER PROFILE
        // =========================

        await setDoc(
    userRef,
    {
        name: adminName.value.trim(),
        phone: adminPhone.value.trim(),
        photoURL: profileURL
    },
    {
        merge: true
    }
);

        // =========================
        // UPDATE PREVIEW
        // =========================

        if (profileURL) {
            profilePreview.src = profileURL;
        }

        console.log(
            "Profile saved to:",
            `users/${user.uid}`
        );

        console.log(
            "Saved photoURL:",
            profileURL
        );

        // Clear selected file
        photoURL.value = "";

        Swal.fire(
            "Success",
            "Profile Updated Successfully",
            "success"
        );

    } catch (error) {

        console.error(
            "PROFILE UPDATE ERROR:",
            error
        );

        Swal.fire(
            "Error",
            error.message ||
            "Failed to update profile.",
            "error"
        );
    }
}
async function saveWebsiteSettings(){

    try{

        const ref = doc(db,"settings","website");

        const snap = await getDoc(ref);

        let oldData = {};

        if(snap.exists()){

            oldData = snap.data();

        }

        let logoURL = oldData.websiteLogo || "";

        if(websiteLogo.files.length>0){

            logoURL = await uploadToCloudinary(
                websiteLogo.files[0]
            );

        }

        await setDoc(ref,{

            ...oldData,

            websiteLogo:logoURL,

            websiteName:websiteName.value,

            websiteDescription:websiteDescription.value,

            contactEmail:contactEmail.value,

            contactNumber:contactNumber.value,

            officeAddress:officeAddress.value,

            facebookLink:facebookLink.value,

            youtubeLink:youtubeLink.value

        });

        logoPreview.src = logoURL;

        document.getElementById("siteLogo").src = logoURL;

        Swal.fire(
            "Success",
            "Website Updated",
            "success"
        );

    }

    catch(err){

        Swal.fire(
            "Error",
            err.message,
            "error"
        );

    }

}

async function saveWeatherSettings(){

    try{

        const ref = doc(db,"settings","website");

        const snap = await getDoc(ref);

        let oldData = {};

        if(snap.exists()){

            oldData = snap.data();

        }

        await setDoc(ref,{

            ...oldData,

            weatherCity:weatherCity.value,

            weatherApiKey:weatherApiKey.value,

            weatherUnit:weatherUnit.value,

            weatherRefresh:weatherRefresh.value

        });

        Swal.fire(
            "Success",
            "Weather Settings Saved",
            "success"
        );

    }

    catch(err){

        Swal.fire(
            "Error",
            err.message,
            "error"
        );

    }

}


dashboardBtn.onclick = () => {
    location.href = "dashboard.html";
};

analyticsBtn.onclick = () => {
    location.href = "analytics.html";
};

categoriesBtn.onclick = () => {
    location.href = "categories.html";
};

accountsBtn.onclick = () => {
    location.href = "users.html";
};

logoutBtn.onclick = async () => {

    try {

        await signOut(auth);

        location.href = "../index.html";

    } catch (error) {

        console.error("Logout Error:", error);

        Swal.fire({
            icon: "error",
            title: "Logout Failed",
            text: "Hindi ma-logout ang account. Pakisubukan muli."
        });

    }

};


// ===============================
// START SETTINGS
// ===============================

onAuthStateChanged(auth, async (user) => {

    if (!user) {
        location.href = "../index.html";
        return;
    }

    const access =
        await checkSettingsAccess();

    if (!access) {
        return;
    }

    await loadSettings();

    await loadUserProfile();

    await loadSystemInfo();

    handleSocialAccountSettings();

    const savedAppearance =
        JSON.parse(
            localStorage.getItem("appearance")
        );

    if (savedAppearance) {
        applyAppearance(savedAppearance);
    }

});

async function loadUserProfile() {

    const user = auth.currentUser;

    if (!user) return;

    try {

        const userRef = doc(
            db,
            "users",
            user.uid
        );

        const snap = await getDoc(userRef);

        if (!snap.exists()) {

            console.warn(
                "User profile not found."
            );

            return;
        }

        const data = snap.data();

        // NAME
        adminName.value =
            data.name || "";

        // EMAIL
        adminEmail.value =
            user.email || "";

        // PHONE
        adminPhone.value =
            data.phone || "";

        // PROFILE IMAGE
profilePreview.src =
    data.photoURL ||
    "../images/PRIMETIME NEWS LOGO.png";

    } catch (error) {

        console.error(
            "Failed to load user profile:",
            error
        );

    }
}