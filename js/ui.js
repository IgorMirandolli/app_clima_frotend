import { formatLocationDetails } from './weather.js';

export const elements = {
  weatherForm: document.getElementById('weather-form'),
  cityInput: document.getElementById('city-input'),
  searchButton: document.getElementById('search-button'),
  citySuggestions: document.getElementById('city-suggestions'),
};

const weatherElements = {
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
};

const searchButtonLabel = elements.searchButton.querySelector('span');

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

function getWeatherIcon(code) {
  let weatherKind = 'rain';

  if (code === 0 || code === 1) weatherKind = 'clear';
  if (code === 2 || code === 3) weatherKind = 'cloudy';
  if (code === 45 || code === 48) weatherKind = 'fog';
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) {
    weatherKind = 'snow';
  }
  if (code >= 95) weatherKind = 'storm';

  return weatherIcons[weatherKind];
}

function createForecastCard(item) {
  return `
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
  `;
}

export function renderWeather(data) {
  weatherElements.locationName.textContent = data.city;
  weatherElements.weatherDescription.textContent = data.description;
  weatherElements.temperatureValue.textContent = data.temperature;
  weatherElements.humidityValue.textContent = `${data.humidity}%`;
  weatherElements.feelsLikeValue.textContent = `${data.feelsLike}\u00B0`;
  weatherElements.windValue.textContent = `${data.windSpeed} km/h`;
  weatherElements.todayRangeValue.textContent = `${data.todayMax}\u00B0 / ${data.todayMin}\u00B0`;
  weatherElements.currentWeatherIcon.innerHTML = getWeatherIcon(data.weatherCode);
  weatherElements.forecastList.innerHTML = data.forecast
    .map(createForecastCard)
    .join('');
}

export function setLoading(isLoading) {
  elements.cityInput.disabled = isLoading;
  elements.searchButton.disabled = isLoading;
  searchButtonLabel.textContent = isLoading ? 'Buscando...' : 'Buscar clima';
  elements.weatherForm.setAttribute('aria-busy', String(isLoading));
}

export function setStatus(message, isError = false) {
  weatherElements.searchStatus.textContent = message;
  weatherElements.searchStatus.classList.toggle('is-error', isError);
}

export function setSuggestionsVisibility(isVisible) {
  elements.citySuggestions.hidden = !isVisible;
  elements.cityInput.setAttribute('aria-expanded', String(isVisible));

  if (!isVisible) {
    elements.cityInput.removeAttribute('aria-activedescendant');
  }
}

export function clearSuggestions() {
  elements.citySuggestions.replaceChildren();
}

export function renderSuggestionMessage(message) {
  const item = document.createElement('li');
  item.className = 'city-suggestions__message';
  item.textContent = message;
  elements.citySuggestions.replaceChildren(item);
  setSuggestionsVisibility(true);
}

export function renderCitySuggestions(locations, query) {
  clearSuggestions();

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
    details.textContent = formatLocationDetails(location);

    button.append(name, details);
    item.append(button);
    elements.citySuggestions.append(item);
  });

  setSuggestionsVisibility(true);
}

export function highlightSuggestion(index) {
  const buttons = [...elements.citySuggestions.querySelectorAll('.city-suggestion')];

  buttons.forEach((button, buttonIndex) => {
    button.setAttribute('aria-selected', String(buttonIndex === index));
  });

  const activeButton = buttons[index];
  if (!activeButton) return;

  elements.cityInput.setAttribute('aria-activedescendant', activeButton.id);
  activeButton.scrollIntoView({ block: 'nearest' });
}
