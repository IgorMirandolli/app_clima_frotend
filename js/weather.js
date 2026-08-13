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

function getUniqueLocationParts(parts) {
  return parts
    .filter(Boolean)
    .filter((item, index, items) => items.indexOf(item) === index);
}

export function formatLocationLabel(location) {
  return getUniqueLocationParts([
    location.name,
    location.admin1,
    location.country,
  ]).join(', ');
}

export function formatLocationDetails(location) {
  return getUniqueLocationParts([
    location.admin1,
    location.country,
  ]).join(' - ');
}

export function filterCitySuggestions(locations, query, preferredCountryCode) {
  const normalizedQuery = query
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR');

  const prefixMatches = locations.filter((location) => (
    location.name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLocaleLowerCase('pt-BR')
      .startsWith(normalizedQuery)
  ));

  const uniqueLocations = prefixMatches.filter((location, index, items) => {
    const locationKey = formatLocationLabel(location);
    return items.findIndex((item) => (
      formatLocationLabel(item) === locationKey
    )) === index;
  });

  return uniqueLocations
    .sort((first, second) => {
      const firstIsPreferred = first.country_code === preferredCountryCode;
      const secondIsPreferred = second.country_code === preferredCountryCode;

      if (firstIsPreferred !== secondIsPreferred) {
        return Number(secondIsPreferred) - Number(firstIsPreferred);
      }

      return (second.population ?? 0) - (first.population ?? 0);
    })
    .slice(0, 6);
}

export function normalizeWeather(location, weather) {
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
