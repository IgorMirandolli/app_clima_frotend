# Clima Agora

Aplicacao web de previsao do tempo desenvolvida para portfolio com HTML, CSS e JavaScript puro. O projeto identifica a localizacao do usuario ou permite pesquisar uma cidade para exibir dados meteorologicos atuais e a previsao dos proximos cinco dias.

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=111111)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white)

## Demonstracao

- Repositorio: [github.com/IgorMirandolli/app_clima_frotend](https://github.com/IgorMirandolli/app_clima_frotend)
- Deploy: ainda nao publicado.

Depois da publicacao, substitua a linha acima pelo link da aplicacao online. Para incluir uma captura no README, salve a imagem como `docs/preview.png` e adicione:

```md
![Preview do Clima Agora](./docs/preview.png)
```

## Funcionalidades

- Localizacao automatica com a Geolocation API do navegador.
- Busca de cidades com sugestoes enquanto o usuario digita.
- Navegacao das sugestoes com mouse, toque ou teclado.
- Temperatura atual e sensacao termica.
- Umidade e velocidade do vento.
- Temperaturas maxima e minima do dia.
- Condicao meteorologica com icone dinamico.
- Previsao organizada para os proximos cinco dias.
- Estados de carregamento, sucesso e erro.
- Layout responsivo para desktop, tablet e celular.
- Lista vertical no mobile, sem rolagem lateral.

## Tecnologias

- **HTML5** para a estrutura semantica e acessivel.
- **CSS3** com Grid, Flexbox, variaveis, animacoes e media queries.
- **JavaScript ES Modules** para separar responsabilidades.
- **Fetch API** para as requisicoes HTTP.
- **Geolocation API** para obter a localizacao autorizada pelo usuario.
- **Vite** como servidor de desenvolvimento e ferramenta de build.
- **Open-Meteo** para geocodificacao, clima atual e previsao.
- **BigDataCloud** para converter coordenadas em nome de cidade.

## Como rodar localmente

### Requisitos

- Git.
- Node.js `20.19+` ou `22.12+`.
- Conexao com a internet para consultar as APIs.

### Instalacao

```bash
git clone https://github.com/IgorMirandolli/app_clima_frotend.git
cd app_clima_frotend
npm install
npm run dev
```

Abra o endereco exibido pelo Vite, normalmente:

```text
http://localhost:5173
```

O navegador pode solicitar permissao para acessar a localizacao. Caso ela seja negada, a busca manual continua funcionando.

## Scripts

| Comando | Descricao |
| --- | --- |
| `npm run dev` | Inicia o servidor de desenvolvimento. |
| `npm run build` | Gera os arquivos otimizados na pasta `dist`. |
| `npm run preview` | Visualiza localmente o build de producao. |

## Estrutura

```text
app_clima_frotend/
|-- app.js          # Eventos e fluxo principal
|-- index.html      # Estrutura da pagina
|-- style.css       # Design e responsividade
|-- js/
|   |-- api.js      # Requisicoes de cidade e clima
|   |-- errors.js   # Tipos e mensagens de erro
|   |-- ui.js       # Renderizacao da interface e dos cards
|   `-- weather.js  # Normalizacao dos dados meteorologicos
|-- package.json
`-- README.md
```

## Fluxo da aplicacao

1. A aplicacao solicita a localizacao do usuario.
2. As coordenadas sao convertidas em uma localidade legivel.
3. A Open-Meteo recebe latitude e longitude e retorna os dados do clima.
4. Os dados sao normalizados e apresentados na interface.
5. Em uma busca manual, a cidade selecionada fornece novas coordenadas e reinicia o fluxo.

## APIs

| Servico | Uso no projeto |
| --- | --- |
| [Open-Meteo Geocoding](https://open-meteo.com/en/docs/geocoding-api) | Pesquisa e sugestoes de cidades. |
| [Open-Meteo Forecast](https://open-meteo.com/en/docs) | Clima atual e previsao de cinco dias. |
| [BigDataCloud Reverse Geocoding](https://www.bigdatacloud.com/docs/free-api) | Identificacao da cidade pelas coordenadas. |

Nenhuma chave de API fica exposta no projeto. Por isso, esta versao funciona somente com frontend e nao exige backend.

## Privacidade

A localizacao depende da permissao do usuario. As coordenadas nao sao armazenadas pela aplicacao, mas sao enviadas aos servicos meteorologicos para identificar a cidade e consultar a previsao.

## Autor

Desenvolvido por [Igor Mirandolli](https://github.com/IgorMirandolli).
