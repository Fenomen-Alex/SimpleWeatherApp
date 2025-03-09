const cityInput = document.getElementById('cityInput');
const suggestionsDiv = document.getElementById('suggestions');
const themeIcon = document.getElementById('themeIcon');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toastMessage');

const showToast = (message, isError = false) => {
    toastMessage.textContent = message;
    toast.className = isError ? 'toast toast-error' : 'toast toast-success';
    toast.style.display = 'block';
    setTimeout(() => {
        toast.style.display = 'none';
    }, 3000);
}

fetch('https://ipapi.co/json/')
    .then(response => response.json())
    .then(data => {
        const { latitude, longitude } = data;
        fetchWeather(latitude, longitude);
    })
    .catch(error => {
        showToast('Error fetching your location: ' + error.message, true);
    });

function fetchWeather(lat, lon) {
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto`)
        .then(response => response.json())
        .then(data => displayWeather(data))
        .catch(error => {
            showToast('Error fetching weather data: ' + error.message, true);
        });
}

function displayWeather(data) {
    const weatherDataDiv = document.getElementById('weatherData');
    weatherDataDiv.innerHTML = '';

    const currentWeather = data.current_weather;
    const icon = getWeatherIcon(currentWeather.weathercode);
    const card = `
            <div class="col-md-4">
                <div class="weather-card">
                    <h5>Current Weather ${icon}</h5>
                    <p>Temperature: ${currentWeather.temperature} °C</p>
                    <p>Wind Speed: ${currentWeather.windspeed} km/h</p>
                </div>
            </div>
        `;
    weatherDataDiv.innerHTML += card;

    const dailyForecast = data.daily;
    const forecastCard = `
            <div class="col-md-8">
                <div class="weather-card">
                    <h5>Weekly Forecast</h5>
                    <ul class="list-group">
                        ${dailyForecast.time.map((date, index) => `
                            <li class="list-group-item">
                                ${date}: Max Temp: ${dailyForecast.temperature_2m_max[index]} °C, Min Temp: ${dailyForecast.temperature_2m_min[index]} °C, Precipitation: ${dailyForecast.precipitation_sum[index]} mm
                            </li>
                        `).join('')}
                    </ul>
                </div>
            </div>
        `;
    weatherDataDiv.innerHTML += forecastCard;

    showToast('Weather data fetched successfully.');
}

function getWeatherIcon(code) {
    const icons = {
        0: '☀️', // Clear sky
        1: '🌤️', // Mainly clear
        2: '🌥️', // Partly cloudy
        3: '☁️', // Overcast
        45: '🌫️', // Fog
        51: '🌧️', // Drizzle
        61: '🌧️', // Rain
        71: '❄️', // Snow
        80: '🌧️', // Rain showers
        95: '⛈️', // Thunderstorms
    };
    return icons[code] || '❓'; // Default icon for unknown codes
}

function debounce(func, delay) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    };
}

const fetchCitySuggestions = debounce((city) => {
    if (city.length > 2) {
        fetch(`https://nominatim.openstreetmap.org/search?city=${encodeURIComponent(city)}&format=json&addressdetails=1&limit=10`)
            .then(response => response.json())
            .then(data => {
                suggestionsDiv.innerHTML = '';
                data.forEach(result => {
                    const suggestion = document.createElement('div');
                    suggestion.className = 'list-group-item list-group-item-action';
                    suggestion.textContent = `${result.display_name}`;
                    suggestion.onclick = () => {
                        cityInput.value = result.display_name;
                        suggestionsDiv.innerHTML = '';
                        fetchWeather(result.lat, result.lon);
                    };
                    suggestionsDiv.appendChild(suggestion);
                });
            })
            .catch(error => {
                showToast('Error fetching city suggestions: ' + error.message, true);
            });
    } else {
        suggestionsDiv.innerHTML = '';
    }
}, 300);

cityInput.addEventListener('input', (e) => {
    fetchCitySuggestions(e.target.value);
});

document.getElementById('getWeatherBtn').addEventListener('click', () => {
    const cityName = cityInput.value;
    fetchCitySuggestions(cityName);
});

cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const cityName = cityInput.value;
        fetchCitySuggestions(cityName);
    }
});

let isDarkTheme = false;

themeIcon.onclick = () => {
    isDarkTheme = !isDarkTheme;
    document.body.classList.toggle('dark-theme', isDarkTheme);
    themeIcon.className = isDarkTheme ? 'fas fa-moon fa-lg' : 'fas fa-sun fa-lg';
};