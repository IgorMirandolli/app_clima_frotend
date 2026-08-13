const weatherForm = document.getElementById('weather-form');
const cityInput = document.getElementById('city-input');
const searchButton = document.getElementById('search-button');

const ui = {
  locationName: document.getElementById('location-name'),
  weatherDescription: document.getElementById('weather-description'),
  temperatureValue: document.getElementById('temperature-value'),
  humidityValue: document.getElementById('humidity-value'),
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

  ui.forecastList.innerHTML = data.forecast
    .map(
      (item) => `
        <article class="forecast-item">
          <span>${item.day}</span>
          <strong>${item.max}\u00B0 / ${item.min}\u00B0</strong>
          <p>${item.description}</p>
        </article>
      `,
    )
    .join('');
}

function setLoading(isLoading) {
  cityInput.disabled = isLoading;
  searchButton.disabled = isLoading;
  searchButton.textContent = isLoading ? 'Buscando...' : 'Buscar clima';
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
    forecast: weather.daily.time.map((date, index) => ({
      day: formatWeekday(date),
      max: Math.round(weather.daily.temperature_2m_max[index]),
      min: Math.round(weather.daily.temperature_2m_min[index]),
      description: getWeatherDescription(weather.daily.weather_code[index]),
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
