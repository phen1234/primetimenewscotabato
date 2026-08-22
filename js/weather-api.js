const API_KEY = "c4c84dcb28eb32e37cfa39e98d6ae9fc";
const CITY = "Cotabato";

async function loadWeather() {

    try {

        const weatherURL =
        `https://api.openweathermap.org/data/2.5/weather?q=${CITY}&units=metric&appid=${API_KEY}`;

        const forecastURL =
        `https://api.openweathermap.org/data/2.5/forecast?q=${CITY}&units=metric&appid=${API_KEY}`;

        const weatherRes = await fetch(weatherURL);
        const weather = await weatherRes.json();

        document.getElementById("currentTemp").textContent =
            `${Math.round(weather.main.temp)}°C`;

        document.getElementById("currentCondition").textContent =
            weather.weather[0].description;

        document.getElementById("humidity").textContent =
            weather.main.humidity + "%";

        document.getElementById("wind").textContent =
            weather.wind.speed + " km/h";

        document.getElementById("sunrise").textContent =
            new Date(weather.sys.sunrise * 1000)
            .toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit"
            });

        document.getElementById("sunset").textContent =
            new Date(weather.sys.sunset * 1000)
            .toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit"
            });

        const forecastRes = await fetch(forecastURL);
        const forecast = await forecastRes.json();

        const container =
            document.getElementById("forecastContainer");

        container.innerHTML = "";

        const daily =
            forecast.list.filter(item =>
                item.dt_txt.includes("12:00:00")
            );

        daily.slice(0, 7).forEach(day => {

            const date = new Date(day.dt * 1000);

            container.innerHTML += `
            <div class="forecast-item">

                <h4>${date.toLocaleDateString("en-US", {
                    weekday: "short"
                })}</h4>

                <img src="https://openweathermap.org/img/wn/${day.weather[0].icon}@2x.png">

                <p>${Math.round(day.main.temp)}°C</p>

            </div>
            `;

        });

    }

    catch(err){

        console.error(err);

    }

}

loadWeather();