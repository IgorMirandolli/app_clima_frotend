import {
  fetchWeather,
  reverseGeocode,
  searchCities,
  searchCity,
} from './js/api.js';
import {
  getGeolocationErrorMessage,
  getRequestErrorMessage,
  isAbortError,
} from './js/errors.js';
import {
  clearSuggestions,
  elements,
  highlightSuggestion,
  renderCitySuggestions,
  renderSuggestionMessage,
  renderWeather,
  setLoading,
  setStatus,
  setSuggestionsVisibility,
} from './js/ui.js';
import {
  filterCitySuggestions,
  formatLocationLabel,
  normalizeWeather,
} from './js/weather.js';

let activeWeatherRequest;
let activeSuggestionRequest;
let suggestionTimer;
let suggestions = [];
let activeSuggestionIndex = -1;
let selectedLocation;
let manualSearchStarted = false;
let preferredCountryCode = navigator.language.split('-')[1]?.toUpperCase();

function closeSuggestions(clearItems = false) {
  setSuggestionsVisibility(false);
  activeSuggestionIndex = -1;

  if (clearItems) {
    suggestions = [];
    clearSuggestions();
  }
}

function setActiveSuggestion(index) {
  if (!suggestions.length) return;

  activeSuggestionIndex = (index + suggestions.length) % suggestions.length;
  highlightSuggestion(activeSuggestionIndex);
}

async function runWeatherSearch(statusMessage, getData, successMessage) {
  activeWeatherRequest?.abort();
  const request = new AbortController();
  activeWeatherRequest = request;
  setLoading(true);
  setStatus(statusMessage);

  try {
    const { location, weather } = await getData(request.signal);
    preferredCountryCode = location.country_code || preferredCountryCode;
    renderWeather(normalizeWeather(location, weather));
    setStatus(successMessage);
    return true;
  } catch (error) {
    if (!isAbortError(error)) {
      setStatus(getRequestErrorMessage(error), true);
    }
    return false;
  } finally {
    if (activeWeatherRequest === request) {
      setLoading(false);
    }
  }
}

function searchWeatherAtLocation(location, successMessage = 'Clima atualizado com sucesso.') {
  return runWeatherSearch(
    `Buscando o clima de ${location.name}...`,
    async (signal) => ({
      location,
      weather: await fetchWeather(location.latitude, location.longitude, signal),
    }),
    successMessage,
  );
}

function searchWeatherByCity(city) {
  return runWeatherSearch(
    `Buscando o clima de ${city}...`,
    async (signal) => {
      const location = await searchCity(city, signal);
      const weather = await fetchWeather(
        location.latitude,
        location.longitude,
        signal,
      );

      return { location, weather };
    },
    'Clima atualizado com sucesso.',
  );
}

function searchWeatherByCoordinates(latitude, longitude) {
  return runWeatherSearch(
    'Localizacao encontrada. Buscando o clima...',
    async (signal) => {
      const locationRequest = reverseGeocode(latitude, longitude, signal)
        .catch(() => ({ name: 'Sua localizacao', latitude, longitude }));
      const weatherRequest = fetchWeather(latitude, longitude, signal);
      const [location, weather] = await Promise.all([
        locationRequest,
        weatherRequest,
      ]);

      return { location, weather };
    },
    'Clima da sua localizacao atualizado.',
  );
}

async function loadLocationSuggestions(query) {
  activeSuggestionRequest?.abort();
  const request = new AbortController();
  activeSuggestionRequest = request;
  suggestions = [];
  renderSuggestionMessage('Buscando cidades...');

  try {
    const locations = await searchCities(query, 100, request.signal);
    const matches = filterCitySuggestions(
      locations,
      query,
      preferredCountryCode,
    );

    if (activeSuggestionRequest === request) {
      suggestions = matches;
      activeSuggestionIndex = -1;
      renderCitySuggestions(matches, query);
    }
  } catch (error) {
    if (!isAbortError(error) && activeSuggestionRequest === request) {
      suggestions = [];
      renderSuggestionMessage('Nao foi possivel carregar as sugestoes.');
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
    await searchWeatherByCity('Rio de Janeiro');
    setStatus('Geolocalizacao indisponivel. Pesquise sua cidade.', true);
    return;
  }

  setStatus('Permita o acesso a localizacao para mostrar o clima da sua cidade.');

  try {
    const position = await getCurrentPosition();

    if (manualSearchStarted) return;

    await searchWeatherByCoordinates(
      position.coords.latitude,
      position.coords.longitude,
    );
  } catch (error) {
    if (manualSearchStarted) return;

    await searchWeatherByCity('Rio de Janeiro');
    setStatus(getGeolocationErrorMessage(error), true);
  }
}

async function selectSuggestion(index) {
  const location = suggestions[index];

  if (!location) return;

  manualSearchStarted = true;
  selectedLocation = location;
  preferredCountryCode = location.country_code || preferredCountryCode;
  elements.cityInput.value = formatLocationLabel(location);
  activeSuggestionRequest?.abort();
  closeSuggestions(true);
  await searchWeatherAtLocation(location);
}

elements.cityInput.addEventListener('input', () => {
  manualSearchStarted = true;
  selectedLocation = undefined;
  clearTimeout(suggestionTimer);

  const query = elements.cityInput.value.trim();

  if (query.length < 2) {
    activeSuggestionRequest?.abort();
    closeSuggestions(true);
    return;
  }

  suggestionTimer = setTimeout(() => {
    loadLocationSuggestions(query);
  }, 280);
});

elements.cityInput.addEventListener('keydown', (event) => {
  if (elements.citySuggestions.hidden) return;

  if (event.key === 'ArrowDown') {
    event.preventDefault();
    setActiveSuggestion(activeSuggestionIndex + 1);
  }

  if (event.key === 'ArrowUp') {
    event.preventDefault();
    setActiveSuggestion(
      activeSuggestionIndex < 0
        ? suggestions.length - 1
        : activeSuggestionIndex - 1,
    );
  }

  if (event.key === 'Enter' && activeSuggestionIndex >= 0) {
    event.preventDefault();
    selectSuggestion(activeSuggestionIndex);
  }

  if (event.key === 'Escape') {
    closeSuggestions();
  }
});

elements.cityInput.addEventListener('focus', () => {
  if (suggestions.length && elements.cityInput.value.trim().length >= 2) {
    setSuggestionsVisibility(true);
  }
});

elements.citySuggestions.addEventListener('click', (event) => {
  const button = event.target.closest('.city-suggestion');

  if (button) {
    selectSuggestion(Number(button.dataset.index));
  }
});

document.addEventListener('pointerdown', (event) => {
  if (!elements.weatherForm.contains(event.target)) {
    closeSuggestions();
  }
});

elements.weatherForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const city = elements.cityInput.value.trim();
  if (!city) {
    elements.cityInput.focus();
    return;
  }

  manualSearchStarted = true;
  activeSuggestionRequest?.abort();
  closeSuggestions(true);

  if (selectedLocation && city === formatLocationLabel(selectedLocation)) {
    await searchWeatherAtLocation(selectedLocation);
    return;
  }

  await searchWeatherByCity(city);
});

loadInitialWeather();
