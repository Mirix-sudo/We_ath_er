const cityInput = document.getElementById("cityInput");
const searchForm = document.getElementById("searchForm");
const locationEl = document.getElementById("location");
const dateEl = document.getElementById("date");
const temperatureEl = document.getElementById("temperature");
const conditionEl = document.getElementById("condition");
const weatherIconEl = document.getElementById("weatherIcon");
const feelsLikeEl = document.getElementById("feelsLike");
const humidityEl = document.getElementById("humidity");
const windEl = document.getElementById("wind");
const sunriseEl = document.getElementById("sunrise");
const forecastEl = document.getElementById("forecast");

const weatherCodeMap = {
  0: { label: "Clear sky", icon: "☀️" },
  1: { label: "Mostly clear", icon: "🌤️" },
  2: { label: "Partly cloudy", icon: "⛅" },
  3: { label: "Overcast", icon: "☁️" },
  45: { label: "Foggy", icon: "🌫️" },
  48: { label: "Depositing rime fog", icon: "🌫️" },
  51: { label: "Light drizzle", icon: "🌦️" },
  53: { label: "Drizzle", icon: "🌦️" },
  55: { label: "Heavy drizzle", icon: "🌧️" },
  56: { label: "Freezing drizzle", icon: "🌧️" },
  57: { label: "Heavy freezing drizzle", icon: "🌧️" },
  61: { label: "Light rain", icon: "🌦️" },
  63: { label: "Rain", icon: "🌧️" },
  65: { label: "Heavy rain", icon: "🌧️" },
  66: { label: "Freezing rain", icon: "🌧️" },
  67: { label: "Heavy freezing rain", icon: "🌧️" },
  71: { label: "Light snow", icon: "🌨️" },
  73: { label: "Snow", icon: "❄️" },
  75: { label: "Heavy snow", icon: "❄️" },
  77: { label: "Snow grains", icon: "❄️" },
  80: { label: "Rain showers", icon: "🌦️" },
  81: { label: "Heavy showers", icon: "🌧️" },
  82: { label: "Violent showers", icon: "⛈️" },
  85: { label: "Snow showers", icon: "🌨️" },
  86: { label: "Heavy snow showers", icon: "❄️" },
  95: { label: "Thunderstorm", icon: "⛈️" },
  96: { label: "Thunderstorm with hail", icon: "⛈️" },
  99: { label: "Severe thunderstorm", icon: "⛈️" }
};

function formatDay(dateString) {
  return new Date(dateString).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric"
  });
}

function formatTime(dateString) {
  return new Date(dateString).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit"
  });
}

function getWeatherInfo(code) {
  return weatherCodeMap[code] || { label: "Weather", icon: "🌤️" };
}

function renderForecast(daily) {
  const futureDays = daily.time.slice(1);

  forecastEl.innerHTML = futureDays
    .map((day, index) => {
      const actualIndex = index + 1;
      const code = daily.weather_code[actualIndex];
      const info = getWeatherInfo(code);
      const high = Math.round(daily.temperature_2m_max[actualIndex]);
      const low = Math.round(daily.temperature_2m_min[actualIndex]);

      return `
        <div class="forecast-item">
          <div class="day">${formatDay(day)}</div>
          <span class="icon">${info.icon}</span>
          <div class="temps">${high}° / ${low}°</div>
        </div>
      `;
    })
    .join("");
}

function renderWeather(data) {
  const currentWeather = data.current;
  const daily = data.daily;
  const currentInfo = getWeatherInfo(currentWeather.weather_code);

  locationEl.textContent = `${data.locationName}, ${data.country}`;
  dateEl.textContent = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric"
  });
  temperatureEl.textContent = `${Math.round(currentWeather.temperature_2m)}°C`;
  conditionEl.textContent = currentInfo.label;
  weatherIconEl.textContent = currentInfo.icon;
  feelsLikeEl.textContent = `${Math.round(currentWeather.apparent_temperature)}°C`;
  humidityEl.textContent = `${Math.round(currentWeather.relative_humidity_2m)}%`;
  windEl.textContent = `${Math.round(currentWeather.wind_speed_10m)} km/h`;
  sunriseEl.textContent = formatTime(daily.sunrise[0]);

  renderForecast(daily);
}

async function getWeather(city) {
  const geocodeUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;
  const geocodeResponse = await fetch(geocodeUrl);

  if (!geocodeResponse.ok) {
    throw new Error("Could not find that city.");
  }

  const geocodeData = await geocodeResponse.json();
  const location = geocodeData.results?.[0];

  if (!location) {
    throw new Error("City not found. Try another location.");
  }

  const forecastUrl = `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset&timezone=auto&forecast_days=5`;
  const weatherResponse = await fetch(forecastUrl);

  if (!weatherResponse.ok) {
    throw new Error("Weather data could not be loaded.");
  }

  const weatherData = await weatherResponse.json();

  renderWeather({
    locationName: location.name,
    country: location.country || location.admin1 || "",
    current: weatherData.current,
    daily: weatherData.daily
  });
}

async function handleSearch(event) {
  event.preventDefault();
  const city = cityInput.value.trim();

  if (!city) {
    cityInput.focus();
    return;
  }

  try {
    await getWeather(city);
  } catch (error) {
    locationEl.textContent = "Weather unavailable";
    conditionEl.textContent = error.message;
    temperatureEl.textContent = "--°C";
    weatherIconEl.textContent = "⚠️";
  }
}

searchForm.addEventListener("submit", handleSearch);

getWeather("New York").catch((error) => {
  locationEl.textContent = "Weather unavailable";
  conditionEl.textContent = error.message;
  temperatureEl.textContent = "--°C";
  weatherIconEl.textContent = "⚠️";
});
