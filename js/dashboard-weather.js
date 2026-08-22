import { db } from "./firebase.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";



const weatherTemp =
    document.getElementById("weatherTemp");

const weatherCondition =
    document.getElementById("weatherCondition");

const weatherHumidity =
    document.getElementById("weatherHumidity");

const weatherWind =
    document.getElementById("weatherWind");

const weatherSunrise =
    document.getElementById("weatherSunrise");

const weatherSunset =
    document.getElementById("weatherSunset");


async function loadWeather() {

    try {

        const settingsRef =
            doc(db, "settings", "website");

        const settingsSnap =
            await getDoc(settingsRef);


        if (!settingsSnap.exists()) {

            setWeatherLoading("Weather unavailable");

            return;

        }


        const settings =
            settingsSnap.data();


        const city =
            settings.weatherCity ||
            "Cotabato City";


        const apiKey =
            settings.weatherApiKey;


        const unit =
            settings.weatherUnit ||
            "metric";


        if (!apiKey) {

            console.error(
                "Weather API key is empty."
            );

            setWeatherLoading(
                "Weather unavailable"
            );

            return;

        }


        const url =
            `https://api.openweathermap.org/data/2.5/weather` +
            `?q=${encodeURIComponent(city)}` +
            `&units=${unit}` +
            `&appid=${apiKey}`;


        const response =
            await fetch(url);


        if (!response.ok) {

            const errorData =
                await response.json()
                    .catch(() => ({}));

            console.error(
                "OpenWeather error:",
                errorData
            );

            setWeatherLoading(
                "Weather unavailable"
            );

            return;

        }


        const data =
            await response.json();


        // =========================
        // TEMPERATURE
        // =========================

        const temperature =
            Math.round(data.main.temp);


        if (weatherTemp) {

            weatherTemp.textContent =
                `${temperature}°C`;

        }


        // =========================
        // CONDITION
        // =========================

        const description =
            data.weather?.[0]?.description ||
            "Unknown";


        if (weatherCondition) {

            weatherCondition.textContent =
                capitalize(description);

        }


        // =========================
        // HUMIDITY
        // =========================

        if (weatherHumidity) {

            weatherHumidity.textContent =
                `${data.main.humidity}%`;

        }


        // =========================
        // WIND
        // =========================

        if (weatherWind) {

            const windSpeed =
                data.wind?.speed ?? 0;

            weatherWind.textContent =
                `${windSpeed} m/s`;

        }


        // =========================
        // SUNRISE
        // =========================

        if (weatherSunrise) {

            weatherSunrise.textContent =
                formatTime(
                    data.sys?.sunrise
                );

        }


        // =========================
        // SUNSET
        // =========================

        if (weatherSunset) {

            weatherSunset.textContent =
                formatTime(
                    data.sys?.sunset
                );

        }


        console.log(
            "Dashboard Weather Loaded:",
            data
        );


    } catch (error) {

        console.error(
            "Weather loading error:",
            error
        );

        setWeatherLoading(
            "Weather unavailable"
        );

    }

}


// =========================
// LOADING / ERROR
// =========================

function setWeatherLoading(message) {

    if (weatherTemp) {
        weatherTemp.textContent = message;
    }

    if (weatherCondition) {
        weatherCondition.textContent = message;
    }

}


// =========================
// CAPITALIZE
// =========================

function capitalize(text) {

    return text.charAt(0).toUpperCase() +
        text.slice(1);

}


// =========================
// TIME FORMAT
// =========================

function formatTime(timestamp) {

    if (!timestamp) {
        return "--";
    }

    return new Date(timestamp * 1000)
        .toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit"
        });

}


// =========================
// START
// =========================

loadWeather();