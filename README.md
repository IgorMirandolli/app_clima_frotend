# Clima Agora

App de clima feita com HTML, CSS e JavaScript puro. A interface usa dados reais da API Open-Meteo e nao precisa de chave de acesso.

## Estrutura

- `index.html` - estrutura da interface
- `style.css` - estilos e responsividade
- `app.js` - busca de cidades, integracao com a API e atualizacao da interface

## Fluxo da busca

1. O usuario informa uma cidade.
2. A Geocoding API encontra a latitude e a longitude.
3. A Forecast API consulta o clima das coordenadas encontradas.
4. O JavaScript mostra temperatura, umidade, condicao atual e previsao de 5 dias.

## Como usar

1. Abra `index.html` no navegador ou use a extensao Live Server do VS Code.
2. Digite o nome de uma cidade e selecione `Buscar clima`.

E necessario estar conectado a internet para consultar os dados.

## API utilizada

- Geocoding API: `https://geocoding-api.open-meteo.com/v1/search`
- Forecast API: `https://api.open-meteo.com/v1/forecast`
