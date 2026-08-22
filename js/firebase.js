// Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import {
    getAuth,
    GoogleAuthProvider,
    FacebookAuthProvider
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";

import { getFirestore } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

export const googleProvider = new GoogleAuthProvider();

export const facebookProvider = new FacebookAuthProvider();

facebookProvider.setCustomParameters({
    display: "popup"
});

const firebaseConfig = {
  apiKey: "AIzaSyCH4CFqt7Yp_x_hTVhJShJn_MhcGs9cfss",
  authDomain: "primetimenews-7c7fe.firebaseapp.com",
  projectId: "primetimenews-7c7fe",
  storageBucket: "primetimenews-7c7fe.firebasestorage.app",
  messagingSenderId: "84822406842",
  appId: "1:84822406842:web:35648db791564f27897483"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);