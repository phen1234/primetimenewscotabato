import { db } from "./firebase.js";

import {
    collection,
    getDocs,
    query,
    where,
    orderBy,
    limit,
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";


// ===============================
// LOAD WEATHER NEWS
// ===============================

async function loadWeatherNews() {

    const featured =
        document.getElementById("featuredContent");

    const list =
        document.getElementById("contentList");

    const related =
        document.getElementById("relatedWeatherNews");

    if (!featured || !list) return;

    featured.innerHTML = "Loading weather news...";
    list.innerHTML = "";

    if (related) {
        related.innerHTML = "";
    }

    try {

        const q = query(
            collection(db, "news"),

            where("status", "==", "published"),

            where("category", "==", "Weather"),

            orderBy("createdAt", "desc"),
            
            limit(10)
        );

        const snapshot =
            await getDocs(q);


        // ==========================
        // NO WEATHER NEWS
        // ==========================

        if (snapshot.empty) {

            featured.innerHTML = `
                <div style="
                    padding:40px;
                    text-align:center;
                ">

                    <h2>No Weather News Yet</h2>

                    <p>
                        There are no published weather
                        news articles at the moment.
                    </p>

                </div>
            `;

            return;
        }


        // ==========================
        // CONVERT TO ARRAY
        // ==========================

        const newsData = [];

        snapshot.forEach(docSnap => {

            newsData.push({
                id: docSnap.id,
                ...docSnap.data()
            });

        });


        // ==========================
        // FEATURED
        // ==========================

        const featuredNews =
            newsData[0];


        const featuredDate =
            featuredNews.publishedAt?.seconds
                ? new Date(
                    featuredNews.publishedAt.seconds * 1000
                ).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric"
                })
                : "";


        featured.innerHTML = `

            <img
                src="${featuredNews.featuredImage || ""}"
                alt="${featuredNews.headline || "Weather News"}"
            >

            <div class="weather-featured-content">

                <span class="badge">

                    ${featuredNews.category || "Weather"}

                </span>

                <h2>
                    ${featuredNews.headline || ""}
                </h2>

                <p>
                    ${featuredNews.summary || ""}
                </p>

                <div class="weather-featured-meta">

                    <span>
                        <i class="fas fa-user"></i>

                        ${featuredNews.author ||
                        "Primetime News Cotabato"}

                    </span>

                    <span>
                        <i class="fas fa-calendar-alt"></i>

                        ${featuredDate}

                    </span>

                    <span>
                        <i class="fas fa-eye"></i>

                        ${featuredNews.views || 0}
                        Views

                    </span>

                </div>

            </div>

        `;


        // ==========================
        // OTHER WEATHER NEWS
        // ==========================

        const otherNews =
            newsData.slice(1);


        let html = "";


        otherNews.forEach(news => {

            const date =
                news.publishedAt?.seconds
                    ? new Date(
                        news.publishedAt.seconds * 1000
                    ).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric"
                    })
                    : "";


            html += `

                <article
                    class="weather-news-card"
                    data-id="${news.id}"
                >

                    <img
                        src="${news.featuredImage || ""}"
                        alt="${news.headline || "Weather News"}"
                    >

                    <div class="weather-news-card-content">

                        <span class="badge">

                            <i class="fas fa-cloud-sun"></i>

                            ${news.category || "Weather"}

                        </span>

                        <h3>
                            ${news.headline || ""}
                        </h3>

                        <p>
                            ${news.summary || ""}
                        </p>

                        <div class="weather-news-card-meta">

                            <span>

                                <i class="fas fa-calendar"></i>

                                ${date}

                            </span>

                            <span>

                                <i class="fas fa-eye"></i>

                                ${news.views || 0}
                                Views

                            </span>

                        </div>

                    </div>

                </article>

            `;

        });


        // ==========================
        // DISPLAY OTHER NEWS
        // ==========================

        if (list) {

            if (otherNews.length === 0) {

                list.innerHTML = `
                    <div class="no-weather-news">

                        <h3>
                            No Other Weather News
                        </h3>

                        <p>
                            There are no other published
                            weather news articles yet.
                        </p>

                    </div>
                `;

            } else {

                list.innerHTML = html;

            }

        }


        // ==========================
        // FEATURED CLICK
        // ==========================

        featured.onclick = () => {

            window.location.href =
                `article.html?id=${featuredNews.id}`;

        };


        // ==========================
        // OTHER NEWS CLICK
        // ==========================

        list?.addEventListener("click", (e) => {

            const card =
                e.target.closest(".weather-news-card");

            if (!card) return;

            const id =
                card.dataset.id;

            window.location.href =
                `article.html?id=${id}`;

        });


    } catch (error) {

        console.error(
            "Weather News Error:",
            error
        );

        featured.innerHTML = `
            <div style="padding:40px;">
                Unable to load weather news.
            </div>
        `;

    }

}


// ===============================
// LOAD RELATED WEATHER NEWS
// ===============================



const weatherIcon =
    document.getElementById("weatherIcon");

const weatherTemp =
    document.getElementById("weatherTemp");

const weatherDescription =
    document.getElementById("weatherDescription");


const DEFAULT_CITY = "Cotabato City,PH";


// ==========================
// WEATHER DETAILS DISPLAY
// ==========================

function updateWeatherDetails(data) {

    const location = document.getElementById("location");
    const humidity = document.getElementById("humidity");
    const wind = document.getElementById("wind");
    const sunrise = document.getElementById("sunrise");
    const sunset = document.getElementById("sunset");

    // 📍 LOCATION
    if (location) {
        location.textContent =
            data.name || "Current Location";
    }

    // 💧 HUMIDITY
    if (humidity) {
        humidity.textContent =
            data.main?.humidity != null
                ? `${data.main.humidity}%`
                : "--%";
    }

    // 🌬 WIND
    if (wind) {

        const windSpeed = data.wind?.speed;

        wind.textContent =
            windSpeed != null
                ? `${windSpeed} km/h`
                : "-- km/h";
    }

    // 🌅 SUNRISE
    if (sunrise) {

        sunrise.textContent =
            data.sys?.sunrise
                ? formatTime(data.sys.sunrise)
                : "--";
    }

    // 🌇 SUNSET
    if (sunset) {

        sunset.textContent =
            data.sys?.sunset
                ? formatTime(data.sys.sunset)
                : "--";
    }
}


// ==========================
// FORMAT TIME
// ==========================

function formatTime(timestamp) {

    if (!timestamp) {
        return "--";
    }

    return new Date(
        timestamp * 1000
    ).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit"
    });
}


// ==========================
// LOAD WEATHER SETTINGS
// ==========================

async function loadWeather() {

    try {

        const settingsRef =
            doc(db, "settings", "website");

        const settingsSnap =
            await getDoc(settingsRef);


        if (!settingsSnap.exists()) {

            console.error(
                "Website settings not found."
            );

            setWeatherLoading(
                "Weather unavailable"
            );

            return;
        }


        const settings =
            settingsSnap.data();


        const city =
            settings.weatherCity ||
            DEFAULT_CITY;


        const apiKey =
            settings.weatherApiKey ||
            "";


        const unit =
            settings.weatherUnit ||
            "metric";


        console.log(
            "Weather Settings:",
            {
                city,
                hasApiKey: !!apiKey,
                unit
            }
        );


        // ==========================
        // CHECK API KEY
        // ==========================

        if (!apiKey) {

            console.error(
                "OpenWeather API key is empty."
            );

            setWeatherLoading(
                "Weather unavailable"
            );

            return;
        }


        // ==========================
        // OPENWEATHER API
        // ==========================

        const url =
            "https://api.openweathermap.org/data/2.5/weather" +
            "?q=" +
            encodeURIComponent(city) +
            "&units=" +
            encodeURIComponent(unit) +
            "&appid=" +
            encodeURIComponent(apiKey);


        const response =
            await fetch(url);


        const data =
            await response.json();


        if (!response.ok) {

            console.error(
                "OpenWeather API Error:",
                data
            );

            setWeatherLoading(
                "Weather unavailable"
            );

            return;
        }

        // ==========================
// UPDATE WEATHER DETAILS
// ==========================

updateWeatherDetails(data);

        


        // ==========================
        // WEATHER DATA
        // ==========================

        const temperature =
            Math.round(data.main.temp);


        const description =
            data.weather?.[0]?.description ||
            "Unknown";


        const icon =
            data.weather?.[0]?.icon ||
            "";


        // ==========================
        // TEMPERATURE
        // ==========================

        if (weatherTemp) {

            const symbol =
                unit === "imperial"
                    ? "°F"
                    : "°C";


            weatherTemp.textContent =
                `${temperature}${symbol}`;

        }


        // ==========================
        // DESCRIPTION
        // ==========================

        if (weatherDescription) {

            weatherDescription.textContent =
                capitalize(description);

        }


        // ==========================
        // ICON
        // ==========================

        if (
            weatherIcon &&
            icon
        ) {

            weatherIcon.src =
                `https://openweathermap.org/img/wn/${icon}@2x.png`;

            weatherIcon.alt =
                description;

            weatherIcon.style.display =
                "block";

        }


        console.log(
            "Weather loaded successfully:",
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


// ==========================
// WEATHER LOADING DISPLAY
// ==========================

function setWeatherLoading(message) {

    if (weatherTemp) {

        weatherTemp.textContent =
            message;

    }


    if (weatherDescription) {

        weatherDescription.textContent =
            message;

    }


    if (weatherIcon) {

        weatherIcon.style.display =
            "none";

    }

}


// ==========================
// CAPITALIZE
// ==========================

function capitalize(text) {

    if (!text) {
        return "";
    }

    return (
        text.charAt(0).toUpperCase() +
        text.slice(1)
    );
}


// ==========================
// START WEATHER PAGE
// ==========================

loadWeatherNews();
loadWeather();