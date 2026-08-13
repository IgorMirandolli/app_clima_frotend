const weatherForm = document.getElementById('weather-form');
const cityInput = document.getElementById('city-input');
const searchButton = document.getElementById('search-button');
const searchButtonLabel = searchButton.querySelector('span');
const citySuggestions = document.getElementById('city-suggestions');

const ui = {
  locationName: document.getElementById('location-name'),
  weatherDescription: document.getElementById('weather-description'),
  temperatureValue: document.getElementById('temperature-value'),
  humidityValue: document.getElementById('humidity-value'),
  feelsLikeValue: document.getElementById('feels-like-value'),
  windValue: document.getElementById('wind-value'),
  todayRangeValue: document.getElementById('today-range-value'),
  currentWeatherIcon: document.getElementById('current-weather-icon'),
  forecastList: document.getElementById('forecast-list'),
  searchStatus: document.getElementById('search-status'),
  citySuggestions,
};

const API_URLS = {
  geocoding: 'https://geocoding-api.open-meteo.com/v1/search',
  forecast: 'https://api.open-meteo.com/v1/forecast',
  reverseGeocoding: 'https://api.bigdatacloud.net/data/reverse-geocode-client',
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
let suggestionRequest;
let suggestionTimer;
let suggestions = [];
let activeSuggestionIndex = -1;
let selectedLocation;
let manualSearchStarted = false;
let preferredCountryCode = navigator.language.split('-')[1]?.toUpperCase();

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

function normalizeSearchText(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR');
}

function getUniqueLocationParts(parts) {
  return parts
    .filter(Boolean)
    .filter((item, index, items) => items.indexOf(item) === index);
}

function formatLocationLabel(location) {
  return getUniqueLocationParts([
    location.name,
    location.admin1,
    location.country,
  ]).join(', ');
}

function sortLocationSuggestions(locations) {
  const uniqueLocations = locations.filter((location, index, items) => {
    const locationKey = [location.name, location.admin1, location.country].join('|');
    return items.findIndex((item) => (
      [item.name, item.admin1, item.country].join('|') === locationKey
    )) === index;
  });

  return uniqueLocations.sort((first, second) => {
    const firstIsPreferred = first.country_code === preferredCountryCode;
    const secondIsPreferred = second.country_code === preferredCountryCode;

    if (firstIsPreferred !== secondIsPreferred) {
      return Number(secondIsPreferred) - Number(firstIsPreferred);
    }

    return (second.population ?? 0) - (first.population ?? 0);
  });
}

function setSuggestionsVisibility(isVisible) {
  ui.citySuggestions.hidden = !isVisible;
  cityInput.setAttribute('aria-expanded', String(isVisible));

  if (!isVisible) {
    cityInput.removeAttribute('aria-activedescendant');
    activeSuggestionIndex = -1;
  }
}

function closeSuggestions(clearItems = false) {
  setSuggestionsVisibility(false);

  if (clearItems) {
    suggestions = [];
    ui.citySuggestions.replaceChildren();
  }
}

function renderSuggestionMessage(message) {
  suggestions = [];
  const item = document.createElement('li');
  item.className = 'city-suggestions__message';
  item.textContent = message;
  ui.citySuggestions.replaceChildren(item);
  setSuggestionsVisibility(true);
}

function renderSuggestions(locations, query) {
  suggestions = locations;
  activeSuggestionIndex = -1;
  ui.citySuggestions.replaceChildren();

  if (!locations.length) {
    renderSuggestionMessage(`Nenhuma cidade comecando com "${query}".`);
    return;
  }

  locations.forEach((location, index) => {
    const item = document.createElement('li');
    const button = document.createElement('button');
    const name = document.createElement('strong');
    const details = document.createElement('span');

    button.type = 'button';
    button.id = `city-suggestion-${index}`;
    button.className = 'city-suggestion';
    button.dataset.index = String(index);
    button.setAttribute('role', 'option');
    button.setAttribute('aria-selected', 'false');
    name.textContent = location.name;
    details.textContent = getUniqueLocationParts([
      location.admin1,
      location.country,
    ]).join(' - ');

    button.append(name, details);
    item.append(button);
    ui.citySuggestions.append(item);
  });

  setSuggestionsVisibility(true);
}

function setActiveSuggestion(index) {
  const buttons = [...ui.citySuggestions.querySelectorAll('.city-suggestion')];

  if (!buttons.length) return;

  activeSuggestionIndex = (index + buttons.length) % buttons.length;
  buttons.forEach((button, buttonIndex) => {
    button.setAttribute(
      'aria-selected',
      String(buttonIndex === activeSuggestionIndex),
    );
  });

  const activeButton = buttons[activeSuggestionIndex];
  cityInput.setAttribute('aria-activedescendant', activeButton.id);
  activeButton.scrollIntoView({ block: 'nearest' });
}

function renderWeather(data) {
  ui.locationName.textContent = data.city;
  ui.weatherDescription.textContent = data.description;
  ui.temperatureValue.textContent = data.temperature;
  ui.humidityValue.textContent = `${data.humidity}%`;
  ui.feelsLikeValue.textContent = `${data.feelsLike}\u00B0`;
  ui.windValue.textContent = `${data.windSpeed} km/h`;
  ui.todayRangeValue.textContent = `${data.todayMax}\u00B0 / ${data.todayMin}\u00B0`;
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

async function findLocations(city, count, signal) {
  const params = new URLSearchParams({
    name: city,
    count: String(count),
    language: 'pt',
    format: 'json',
  });
  const data = await fetchJson(`${API_URLS.geocoding}?${params}`, signal);

  return data.results ?? [];
}

async function findLocation(city, signal) {
  const locations = await findLocations(city, 1, signal);

  if (!locations.length) {
    throw new Error('Cidade nao encontrada. Confira o nome e tente novamente.');
  }

  return locations[0];
}

async function findLocationByCoordinates(latitude, longitude, signal) {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    localityLanguage: 'pt',
  });
  const data = await fetchJson(`${API_URLS.reverseGeocoding}?${params}`, signal);

  return {
    name: data.city || data.locality || 'Sua localizacao',
    admin1: data.principalSubdivision,
    country: data.countryName,
    country_code: data.countryCode,
    latitude,
    longitude,
  };
}

async function findWeather(latitude, longitude, signal) {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current: 'temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min',
    timezone: 'auto',
    forecast_days: '5',
  });

  return fetchJson(`${API_URLS.forecast}?${params}`, signal);
}

function normalizeWeather(location, weather) {
  return {
    city: formatLocationLabel(location),
    description: getWeatherDescription(weather.current.weather_code),
    temperature: Math.round(weather.current.temperature_2m),
    humidity: Math.round(weather.current.relative_humidity_2m),
    feelsLike: Math.round(weather.current.apparent_temperature),
    windSpeed: Math.round(weather.current.wind_speed_10m),
    todayMax: Math.round(weather.daily.temperature_2m_max[0]),
    todayMin: Math.round(weather.daily.temperature_2m_min[0]),
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

function getRequestErrorMessage(error) {
  return error instanceof TypeError
    ? 'Nao foi possivel conectar. Verifique sua internet e tente novamente.'
    : error.message;
}

async function loadLocationSuggestions(query) {
  suggestionRequest?.abort();
  const request = new AbortController();
  suggestionRequest = request;
  renderSuggestionMessage('Buscando cidades...');

  try {
    const locations = await findLocations(query, 100, request.signal);
    const normalizedQuery = normalizeSearchText(query);
    const prefixMatches = sortLocationSuggestions(locations
      .filter((location) => (
        normalizeSearchText(location.name).startsWith(normalizedQuery)
      )))
      .slice(0, 6);

    if (suggestionRequest === request) {
      renderSuggestions(prefixMatches, query);
    }
  } catch (error) {
    if (error.name !== 'AbortError' && suggestionRequest === request) {
      renderSuggestionMessage('Nao foi possivel carregar as sugestoes.');
    }
  }
}

async function searchWeatherAtLocation(location, successMessage = 'Clima atualizado com sucesso.') {
  activeRequest?.abort();
  const request = new AbortController();
  activeRequest = request;
  setLoading(true);
  setStatus(`Buscando o clima de ${location.name}...`);

  try {
    const weather = await findWeather(
      location.latitude,
      location.longitude,
      request.signal,
    );

    renderWeather(normalizeWeather(location, weather));
    setStatus(successMessage);
    return true;
  } catch (error) {
    if (error.name !== 'AbortError') {
      setStatus(getRequestErrorMessage(error), true);
    }
    return false;
  } finally {
    if (activeRequest === request) {
      setLoading(false);
    }
  }
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
    return true;
  } catch (error) {
    if (error.name !== 'AbortError') {
      setStatus(getRequestErrorMessage(error), true);
    }
    return false;
  } finally {
    if (activeRequest === request) {
      setLoading(false);
    }
  }
}

async function searchWeatherFromCoordinates(latitude, longitude) {
  activeRequest?.abort();
  const request = new AbortController();
  activeRequest = request;
  setLoading(true);
  setStatus('Localizacao encontrada. Buscando o clima...');

  try {
    const locationRequest = findLocationByCoordinates(
      latitude,
      longitude,
      request.signal,
    ).catch(() => ({
      name: 'Sua localizacao',
      latitude,
      longitude,
    }));
    const weatherRequest = findWeather(latitude, longitude, request.signal);
    const [location, weather] = await Promise.all([
      locationRequest,
      weatherRequest,
    ]);

    preferredCountryCode = location.country_code || preferredCountryCode;
    renderWeather(normalizeWeather(location, weather));
    setStatus('Clima da sua localizacao atualizado.');
    return true;
  } catch (error) {
    if (error.name !== 'AbortError') {
      setStatus(getRequestErrorMessage(error), true);
    }
    return false;
  } finally {
    if (activeRequest === request) {
      setLoading(false);
    }
  }
}

function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      maximumAge: 10 * 60 * 1000,
      timeout: 10000,
    });
  });
}

async function loadInitialWeather() {
  if (!('geolocation' in navigator)) {
    await searchWeather('Rio de Janeiro');
    setStatus('Geolocalizacao indisponivel. Pesquise sua cidade.', true);
    return;
  }

  setStatus('Permita o acesso a localizacao para mostrar o clima da sua cidade.');

  try {
    const position = await getCurrentPosition();

    if (manualSearchStarted) return;

    await searchWeatherFromCoordinates(
      position.coords.latitude,
      position.coords.longitude,
    );
  } catch (error) {
    if (manualSearchStarted) return;

    await searchWeather('Rio de Janeiro');

    const message = error.code === 1
      ? 'Localizacao nao autorizada. Pesquise sua cidade.'
      : 'Nao foi possivel detectar sua localizacao. Pesquise sua cidade.';
    setStatus(message, true);
  }
}

async function selectSuggestion(index) {
  const location = suggestions[index];

  if (!location) return;

  manualSearchStarted = true;
  selectedLocation = location;
  preferredCountryCode = location.country_code || preferredCountryCode;
  cityInput.value = formatLocationLabel(location);
  suggestionRequest?.abort();
  closeSuggestions(true);
  await searchWeatherAtLocation(location);
}

cityInput.addEventListener('input', () => {
  manualSearchStarted = true;
  selectedLocation = undefined;
  clearTimeout(suggestionTimer);

  const query = cityInput.value.trim();

  if (query.length < 2) {
    suggestionRequest?.abort();
    closeSuggestions(true);
    return;
  }

  suggestionTimer = setTimeout(() => {
    loadLocationSuggestions(query);
  }, 280);
});

cityInput.addEventListener('keydown', (event) => {
  if (ui.citySuggestions.hidden) return;

  if (event.key === 'ArrowDown') {
    event.preventDefault();
    setActiveSuggestion(activeSuggestionIndex + 1);
  }

  if (event.key === 'ArrowUp') {
    event.preventDefault();
    const previousIndex = activeSuggestionIndex < 0
      ? suggestions.length - 1
      : activeSuggestionIndex - 1;
    setActiveSuggestion(previousIndex);
  }

  if (event.key === 'Enter' && activeSuggestionIndex >= 0) {
    event.preventDefault();
    selectSuggestion(activeSuggestionIndex);
  }

  if (event.key === 'Escape') {
    closeSuggestions();
  }
});

cityInput.addEventListener('focus', () => {
  if (suggestions.length && cityInput.value.trim().length >= 2) {
    setSuggestionsVisibility(true);
  }
});

ui.citySuggestions.addEventListener('click', (event) => {
  const button = event.target.closest('.city-suggestion');

  if (button) {
    selectSuggestion(Number(button.dataset.index));
  }
});

document.addEventListener('pointerdown', (event) => {
  if (!weatherForm.contains(event.target)) {
    closeSuggestions();
  }
});

weatherForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const city = cityInput.value.trim();
  if (!city) {
    cityInput.focus();
    return;
  }

  manualSearchStarted = true;
  closeSuggestions(true);

  if (
    selectedLocation
    && city === formatLocationLabel(selectedLocation)
  ) {
    await searchWeatherAtLocation(selectedLocation);
    return;
  }

  await searchWeather(city);
});

loadInitialWeather();
