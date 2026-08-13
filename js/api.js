import { ApiError, CityNotFoundError } from './errors.js';

const API_URLS = {
  geocoding: 'https://geocoding-api.open-meteo.com/v1/search',
  forecast: 'https://api.open-meteo.com/v1/forecast',
  reverseGeocoding: 'https://api.bigdatacloud.net/data/reverse-geocode-client',
};

async function fetchJson(url, signal) {
  const response = await fetch(url, { signal });

  if (!response.ok) {
    throw new ApiError('A API nao respondeu corretamente.', response.status);
  }

  return response.json();
}

export async function searchCities(city, count, signal) {
  const params = new URLSearchParams({
    name: city,
    count: String(count),
    language: 'pt',
    format: 'json',
  });
  const data = await fetchJson(`${API_URLS.geocoding}?${params}`, signal);

  return data.results ?? [];
}

export async function searchCity(city, signal) {
  const locations = await searchCities(city, 1, signal);

  if (!locations.length) {
    throw new CityNotFoundError();
  }

  return locations[0];
}

export async function reverseGeocode(latitude, longitude, signal) {
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

export async function fetchWeather(latitude, longitude, signal) {
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
