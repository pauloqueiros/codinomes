/**
 * Módulo para gerar nomes de sala aleatórios e memoráveis
 */

// Arrays de palavras para compor nomes de sala
const adjectives = [
  'red', 'blue', 'green', 'funny', 'happy', 'quick', 'brave', 'silent', 
  'wild', 'calm', 'smart', 'shiny', 'magic', 'super', 'crazy', 'mighty',
  'flying', 'swift', 'clever', 'wise', 'gentle', 'proud', 'sneaky'
];

const nouns = [
  'lion', 'tiger', 'bear', 'wolf', 'eagle', 'shark', 'dragon', 'panda',
  'robot', 'ninja', 'pirate', 'wizard', 'knight', 'ranger', 'hunter', 
  'captain', 'master', 'hero', 'agent', 'shadow', 'rocket', 'fox'
];

/**
 * Gera um número aleatório com base no timestamp atual 
 * Usa Math.random() apenas como fator adicional
 * @returns {number} - Um número que servirá como semente
 */
function getRandomSeed() {
  return Date.now() + Math.floor(Math.random() * 1000);
}

/**
 * Seleciona um item aleatório de um array
 * @param {Array} array - Array de itens
 * @param {number} seed - Semente para aleatoriedade
 * @returns {string} - Item selecionado
 */
function getRandomItem(array, seed) {
  const index = (seed % array.length + Math.floor(Math.random() * array.length)) % array.length;
  return array[index];
}

/**
 * Gera um número aleatório entre min e max (inclusive)
 * @param {number} min - Valor mínimo
 * @param {number} max - Valor máximo
 * @returns {number} - Número gerado
 */
function getRandomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Gera um nome de sala aleatório no formato [adjetivo]-[substantivo]-[número]
 * @returns {string} - Nome da sala gerado
 */
export function generateRoomName() {
  const seed = getRandomSeed();
  const adjective = getRandomItem(adjectives, seed);
  const noun = getRandomItem(nouns, seed + 1);
  const number = getRandomNumber(1, 99);
  
  return `${adjective}-${noun}-${number}`;
}
