/**
 * Funções de utilidade reutilizáveis para o Codenames Pictures
 * Este arquivo contém funções genéricas usadas em várias partes do código
 */

const { IMAGES } = require('./constants');

/**
 * Gera um número aleatório dentro de um intervalo
 * @param {number} min - Valor mínimo (inclusivo)
 * @param {number} max - Valor máximo (inclusivo)
 * @returns {number} - Número aleatório gerado
 */
function getRandomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Embaralha um array de forma aleatória (algoritmo de Fisher-Yates)
 * @param {Array} array - Array a ser embaralhado
 * @returns {Array} - Cópia embaralhada do array original
 */
function shuffleArray(array) {
  const shuffled = [...array]; // Cria uma cópia para não modificar o original
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Gera um conjunto único de IDs de imagem aleatórios
 * @param {number} count - Quantidade de IDs a gerar
 * @returns {Set} - Conjunto de IDs únicos
 */
function generateUniqueImageIds(count) {
  const usedIds = new Set();
  
  while (usedIds.size < count) {
    const imageId = getRandomNumber(IMAGES.MIN_ID, IMAGES.TOTAL_AVAILABLE);
    usedIds.add(imageId);
  }
  
  return usedIds;
}

/**
 * Sanitiza um nome de usuário
 * @param {string|any} username - Nome de usuário a ser sanitizado
 * @param {string} fallbackPrefix - Prefixo para nome padrão se username for inválido
 * @param {string} uniqueId - ID único para adicionar ao nome padrão
 * @param {number} maxLength - Comprimento máximo do nome
 * @returns {string} - Nome sanitizado
 */
function sanitizeUsername(username, fallbackPrefix = 'Player', uniqueId = '', maxLength = 15) {
  return typeof username === 'string' ? 
      username.trim().substring(0, maxLength) : 
      `${fallbackPrefix}_${uniqueId}`;
}

/**
 * Verifica se um jogador existe em uma sala
 * @param {Object} room - Objeto da sala
 * @param {string} socketId - ID do socket a procurar
 * @returns {Object|null} - Jogador encontrado ou null
 */
function findPlayerInRoom(room, socketId) {
  if (!room || !socketId) return null;
  return room.players.find(p => p.id === socketId);
}

/**
 * Verifica se um jogador pertence a um time específico
 * @param {Object} room - Objeto da sala
 * @param {string} socketId - ID do socket a verificar
 * @param {string} team - Time a verificar ('red' ou 'blue')
 * @returns {boolean} - Verdadeiro se o jogador pertence ao time
 */
function isPlayerInTeam(room, socketId, team) {
  if (!room || !team) return false;
  
  if (team === 'red') {
    return room.redTeam.some(p => p.id === socketId);
  } else if (team === 'blue') {
    return room.blueTeam.some(p => p.id === socketId);
  }
  
  return false;
}

/**
 * Verifica se um jogador é spymaster
 * @param {Object} room - Objeto da sala
 * @param {string} socketId - ID do socket a verificar
 * @returns {boolean} - Verdadeiro se o jogador é spymaster
 */
function isSpymaster(room, socketId) {
  if (!room) return false;
  return room.redSpy === socketId || room.blueSpy === socketId;
}

/**
 * Conta o número de cartas por tipo que ainda não foram reveladas
 * @param {Array} cards - Array de cartas do jogo
 * @param {string} teamColor - Cor do time ('red', 'blue')
 * @returns {Object} - Contagem de cartas restantes por time
 */
function countRemainingCards(cards) {
  return {
    red: cards.filter(card => card.team === 'red' && !card.revealed).length,
    blue: cards.filter(card => card.team === 'blue' && !card.revealed).length
  };
}

module.exports = {
  getRandomNumber,
  shuffleArray,
  generateUniqueImageIds,
  sanitizeUsername,
  findPlayerInRoom,
  isPlayerInTeam,
  isSpymaster,
  countRemainingCards
};