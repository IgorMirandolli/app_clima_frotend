const weatherForm = document.getElementById('weather-form');
const cityInput = document.getElementById('city-input');
const searchButton = document.getElementById('search-button');
const searchButtonLabel = searchButton.querySelector('span');

const ui = {
  locationName: document.getElementById('location-name'),
  weatherDescription: document.getElementById('weather-description'),
  temperatureValue: document.getElementById('temperature-value'),
  humidityValue: document.getElementById('humidity-value'),
  currentWeatherIcon: document.getElementById('current-weather-icon'),
  forecastList: document.getElementById('forecast-list'),
  searchStatus: document.getElementById('search-status'),
};

const API_URLS = {
  geocoding: 'https://geocoding-api.open-meteo.com/v1/search',
  forecast: 'https://api.open-meteo.com/v1/forecast',
};

const weatherDescriptions = {
  0: 'Ceu limpo',
  1: 'Predominantemente limpo',
  2: 'Parcialmente nublado',
  3: 'Nublado',
  45: 'Nevoeiro',
  48: 'Nevoeiro com geada',
  51: 'Garoa leve',
  53: 'Garoa moderada',
  55: 'Garoa intensa',
  56: 'Garoa congelante leve',
  57: 'Garoa congelante intensa',
  61: 'Chuva leve',
  63: 'Chuva moderada',
  65: 'Chuva forte',
  66: 'Chuva congelante leve',
  67: 'Chuva congelante forte',
  71: 'Neve leve',
  73: 'Neve moderada',
  75: 'Neve forte',
  77: 'Graos de neve',
  80: 'Pancadas de chuva leves',
  81: 'Pancadas de chuva moderadas',
  82: 'Pancadas de chuva fortes',
  85: 'Pancadas de neve leves',
  86: 'Pancadas de neve fortes',
  95: 'Tempestade',
  96: 'Tempestade com granizo leve',
  99: 'Tempestade com granizo forte',
};

let activeRequest;

function getWeatherDescription(code) {
  return weatherDescriptions[code] ?? 'Condicao indisponivel';
}

const weatherIcons = {
  clear: `
    <svg viewBox="0 0 64 64">
      <circle cx="32" cy="32" r="12" fill="currentColor"></circle>
      <path d="M32 7v8M32 49v8M7 32h8M49 32h8M14.3 14.3l5.7 5.7M44 44l5.7 5.7M49.7 14.3 44 20M20 44l-5.7 5.7" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="3"></path>
    </svg>`,
  cloudy: `
    <svg viewBox="0 0 64 64">
      <path d="M18 47h29a11 11 0 0 0 .3-22A16 16 0 0 0 17 28.8 9.2 9.2 0 0 0 18 47Z" fill="currentColor"></path>
    </svg>`,
  rain: `
    <svg viewBox="0 0 64 64">
      <path d="M18 39h29a10 10 0 0 0 .2-20A15 15 0 0 0 18 22.3 8.4 8.4 0 0 0 18 39Z" fill="currentColor"></path>
      <path d="m22 47-3 6M34 47l-3 6M46 47l-3 6" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="3"></path>
    </svg>`,
  storm: `
    <svg viewBox="0 0 64 64">
      <path d="M18 37h29a10 10 0 0 0 .2-20A15 15 0 0 0 18 20.3 8.4 8.4 0 0 0 18 37Z" fill="currentColor"></path>
      <path d="M34 39 27 50h7l-3 9 10-13h-7l4-7Z" fill="currentColor"></path>
    </svg>`,
  snow: `
    <svg viewBox="0 0 64 64">
      <path d="M18 36h29a10 10 0 0 0 .2-20A15 15 0 0 0 18 19.3 8.4 8.4 0 0 0 18 36Z" fill="currentColor"></path>
      <path d="M22 44v12M17 47l10 6M27 47l-10 6M42 44v12M37 47l10 6M47 47l-10 6" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="2"></path>
    </svg>`,
  fog: `
    <svg viewBox="0 0 64 64">
      <path d="M14 23h36M9 32h40M15 41h34M23 50h27" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="5"></path>
    </svg>`,
};

function getWeatherKind(code) {
  if (code === 0 || code === 1) return 'clear';
  if (code === 2 || code === 3) return 'cloudy';
  if (code === 45 || code === 48) return 'fog';
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'snow';
  if (code >= 95) return 'storm';
  return 'rain';
}

function getWeatherIcon(code) {
  return weatherIcons[getWeatherKind(code)];
}

function formatWeekday(date) {
  const weekday = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'short',
    timeZone: 'UTC',
  }).format(new Date(`${date}T00:00:00Z`));

  return weekday.replace('.', '');
}

function renderWeather(data) {
  ui.locationName.textContent = data.city;
  ui.weatherDescription.textContent = data.description;
  ui.temperatureValue.textContent = data.temperature;
  ui.humidityValue.textContent = `${data.humidity}%`;
  ui.currentWeatherIcon.innerHTML = getWeatherIcon(data.weatherCode);

  ui.forecastList.innerHTML = data.forecast
    .map(
      (item) => `
        <article class="forecast-item">
          <div class="forecast-item__top">
            <span>${item.day}</span>
            <span class="weather-icon weather-icon--forecast" aria-hidden="true">
              ${getWeatherIcon(item.weatherCode)}
            </span>
          </div>
          <strong>${item.max}\u00B0 <small>/ ${item.min}\u00B0</small></strong>
          <p>${item.description}</p>
        </article>
      `,
    )
    .join('');
}

function setLoading(isLoading) {
  cityInput.disabled = isLoading;
  searchButton.disabled = isLoading;
  searchButtonLabel.textContent = isLoading ? 'Buscando...' : 'Buscar clima';
  weatherForm.setAttribute('aria-busy', String(isLoading));
}

function setStatus(message, isError = false) {
  ui.searchStatus.textContent = message;
  ui.searchStatus.classList.toggle('is-error', isError);
}

async function fetchJson(url, signal) {
  const response = await fetch(url, { signal });

  if (!response.ok) {
    throw new Error('A API nao respondeu corretamente.');
  }

  return response.json();
}

async function findLocation(city, signal) {
  const params = new URLSearchParams({
    name: city,
    count: '1',
    language: 'pt',
    format: 'json',
  });
  const data = await fetchJson(`${API_URLS.geocoding}?${params}`, signal);

  if (!data.results?.length) {
    throw new Error('Cidade nao encontrada. Confira o nome e tente novamente.');
  }

  return data.results[0];
}

async function findWeather(latitude, longitude, signal) {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current: 'temperature_2m,relative_humidity_2m,weather_code',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min',
    timezone: 'auto',
    forecast_days: '5',
  });

  return fetchJson(`${API_URLS.forecast}?${params}`, signal);
}

function normalizeWeather(location, weather) {
  const locationLabel = [location.name, location.admin1, location.country]
    .filter(Boolean)
    .filter((item, index, items) => items.indexOf(item) === index)
    .join(', ');

  return {
    city: locationLabel,
    description: getWeatherDescription(weather.current.weather_code),
    temperature: Math.round(weather.current.temperature_2m),
    humidity: Math.round(weather.current.relative_humidity_2m),
    weatherCode: weather.current.weather_code,
    forecast: weather.daily.time.map((date, index) => ({
      day: formatWeekday(date),
      max: Math.round(weather.daily.temperature_2m_max[index]),
      min: Math.round(weather.daily.temperature_2m_min[index]),
      description: getWeatherDescription(weather.daily.weather_code[index]),
      weatherCode: weather.daily.weather_code[index],
    })),
  };
}

async function searchWeather(city) {
  activeRequest?.abort();
  const request = new AbortController();
  activeRequest = request;
  setLoading(true);
  setStatus(`Buscando o clima de ${city}...`);

  try {
    const location = await findLocation(city, request.signal);
    const weather = await findWeather(
      location.latitude,
      location.longitude,
      request.signal,
    );

    renderWeather(normalizeWeather(location, weather));
    setStatus('Clima atualizado com sucesso.');
  } catch (error) {
    if (error.name !== 'AbortError') {
      const message = error instanceof TypeError
        ? 'Nao foi possivel conectar. Verifique sua internet e tente novamente.'
        : error.message;
      setStatus(message, true);
    }
  } finally {
    if (activeRequest === request) {
      setLoading(false);
    }
  }
}

weatherForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const city = cityInput.value.trim();
  if (!city) {
    cityInput.focus();
    return;
  }

  await searchWeather(city);
});

searchWeather('Rio de Janeiro');
