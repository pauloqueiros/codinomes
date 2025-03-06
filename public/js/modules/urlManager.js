// Gerencia a manipulação de URLs

/**
 * Parse os parâmetros da URL atual
 * @returns {Object} Objeto contendo os parâmetros da URL
 */
export function parseUrlParams() {
  const params = {};
  const searchParams = new URLSearchParams(window.location.search);
  
  for (const [key, value] of searchParams) {
    params[key] = value;
  }
  
  console.log('URL params parsed:', params);
  return params;
}

/**
 * Gera uma URL para compartilhar a sala
 * @param {string} roomId - ID da sala
 * @returns {string} URL completa para compartilhamento
 */
export function generateShareableUrl(roomId) {
  const url = new URL(window.location.href);
  url.search = `?room=${roomId}`;
  return url.toString();
}

/**
 * Copia a URL para a área de transferência
 * @param {string} url - URL a ser copiada
 * @returns {Promise<boolean>} Resultado da operação de cópia
 */
export async function copyToClipboard(url) {
  try {
    await navigator.clipboard.writeText(url);
    return true;
  } catch (err) {
    console.error('Failed to copy URL: ', err);
    return false;
  }
}

/**
 * Atualiza a URL atual sem recarregar a página
 * @param {string} roomId - ID da sala
 */
export function updateUrlWithRoom(roomId) {
  const url = new URL(window.location.href);
  url.searchParams.set('room', roomId);
  window.history.replaceState({}, '', url);
  console.log(`URL updated with room: ${roomId}`);
}

/**
 * Limpa os parâmetros da URL
 */
export function clearUrlParams() {
  window.history.replaceState({}, '', window.location.pathname);
  console.log('URL parameters cleared');
}
