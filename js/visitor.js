import { db } from "./firebase.js";

import {
    doc,
    getDoc,
    setDoc,
    updateDoc,
    increment,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

const analyticsRef = doc(db, "analytics", "daily");

async function countVisitor() {

    const today = new Date().toDateString();
    const todayId = new Date().toISOString().split("T")[0];

    const trafficRef = doc(db, "traffic", todayId);

    const lastVisit = localStorage.getItem("lastVisit");

    // Count only once per day per browser
    if (lastVisit === today) return;

    // ==========================
    // ANALYTICS
    // ==========================

    const analyticsSnap = await getDoc(analyticsRef);

    if (!analyticsSnap.exists()) {

        await setDoc(analyticsRef, {

            totalVisitors: 1,
            todayVisitors: 1,
            weekVisitors: 1,
            monthVisitors: 1,
            currentDate: todayId,
            lastUpdated: serverTimestamp()

        });

    } else {

        await updateDoc(analyticsRef, {

            totalVisitors: increment(1),
            todayVisitors: increment(1),
            weekVisitors: increment(1),
            monthVisitors: increment(1),
            currentDate: todayId,
            lastUpdated: serverTimestamp()

        });

    }

    // ==========================
    // DAILY TRAFFIC
    // ==========================

    const trafficSnap = await getDoc(trafficRef);

    if (!trafficSnap.exists()) {

        await setDoc(trafficRef, {

            date: todayId,
            visitors: 1,
            lastUpdated: serverTimestamp()

        });

    } else {

        await updateDoc(trafficRef, {

            visitors: increment(1),
            lastUpdated: serverTimestamp()

        });

    }

    localStorage.setItem("lastVisit", today);

}

countVisitor();