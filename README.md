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
4. O JavaScript mostra temperatura, sensacao termica, umidade, vento, maxima e minima do dia, condicao atual e previsao de 5 dias.

Ao abrir a pagina, o navegador solicita permissao para usar a localizacao atual. As coordenadas sao usadas somente para consultar o clima e identificar a cidade; elas nao sao armazenadas pela aplicacao. Se a permissao for negada, a busca manual continua disponivel.

A busca tambem oferece sugestoes de cidades enquanto o usuario digita. E possivel escolher uma sugestao com mouse, toque ou pelas teclas de seta e Enter.

## Como usar

1. Instale as dependencias com `npm install`.
2. Inicie o servidor local com `npm run dev`.
3. Abra no navegador o endereco exibido no terminal, normalmente `http://localhost:5173`.
4. Digite o nome de uma cidade e selecione `Buscar clima`.

Para gerar a versao de producao, use `npm run build`. Os arquivos finais serao criados na pasta `dist`.

E necessario estar conectado a internet para consultar os dados.

## API utilizada

- Geocoding API: `https://geocoding-api.open-meteo.com/v1/search`
- Forecast API: `https://api.open-meteo.com/v1/forecast`
- Reverse Geocoding API: `https://api.bigdatacloud.net/data/reverse-geocode-client`
