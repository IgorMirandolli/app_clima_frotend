const weatherForm = document.getElementById('weather-form');
const cityInput = document.getElementById('city-input');

const ui = {
  locationName: document.getElementById('location-name'),
  weatherDescription: document.getElementById('weather-description'),
  temperatureValue: document.getElementById('temperature-value'),
  humidityValue: document.getElementById('humidity-value'),
  feelsLikeValue: document.getElementById('feels-like-value'),
  windValue: document.getElementById('wind-value'),
  forecastList: document.getElementById('forecast-list'),
};

const demoWeather = {
  city: 'Rio de Janeiro',
  description: 'Parcialmente nublado',
  temperature: 27,
  humidity: 68,
  feelsLike: 29,
  wind: 14,
  forecast: [
    { day: 'Seg', max: 28, min: 22, description: 'Sol entre nuvens' },
    { day: 'Ter', max: 26, min: 21, description: 'Chance de chuva' },
    { day: 'Qua', max: 25, min: 20, description: 'Nublado' },
    { day: 'Qui', max: 29, min: 23, description: 'Tempo aberto' },
    { day: 'Sex', max: 30, min: 24, description: 'Quente e seco' },
  ],
};

function renderWeather(data) {
  ui.locationName.textContent = data.city;
  ui.weatherDescription.textContent = data.description;
  ui.temperatureValue.textContent = data.temperature;
  ui.humidityValue.textContent = `${data.humidity}%`;
  ui.feelsLikeValue.textContent = `${data.feelsLike}\u00B0C`;
  ui.windValue.textContent = `${data.wind} km/h`;

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

weatherForm.addEventListener('submit', (event) => {
  event.preventDefault();

  const city = cityInput.value.trim();
  if (!city) {
    cityInput.focus();
    return;
  }

  renderWeather({
    ...demoWeather,
    city,
  });

  weatherForm.reset();
  cityInput.focus();
});

renderWeather(demoWeather);
