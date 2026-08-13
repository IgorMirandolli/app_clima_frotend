export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export class CityNotFoundError extends Error {
  constructor() {
    super('Cidade nao encontrada. Confira o nome e tente novamente.');
    this.name = 'CityNotFoundError';
  }
}

export function isAbortError(error) {
  return error?.name === 'AbortError';
}

export function getRequestErrorMessage(error) {
  if (error instanceof CityNotFoundError || error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof TypeError) {
    return 'Nao foi possivel conectar. Verifique sua internet e tente novamente.';
  }

  return 'Ocorreu um erro inesperado. Tente novamente.';
}

export function getGeolocationErrorMessage(error) {
  return error.code === 1
    ? 'Localizacao nao autorizada. Pesquise sua cidade.'
    : 'Nao foi possivel detectar sua localizacao. Pesquise sua cidade.';
}
