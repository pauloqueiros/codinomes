/**
 * Constantes centralizadas para o jogo Codenames Pictures
 * Este arquivo contém todas as constantes do jogo para facilitar manutenção e consistência
 */

// Configurações do tabuleiro
const BOARD = {
  ROWS: 5,
  COLUMNS: 5,
  TOTAL_CARDS: 25, // 5x5 grid
};

// Distribuição de cartas por tipo
const CARD_DISTRIBUTION = {
  RED: 9,
  BLUE: 8,
  NEUTRAL: 7,
  ASSASSIN: 1,
};

// Tipos de cartas
const CARD_TYPES = {
  RED: 'red',
  BLUE: 'blue',
  NEUTRAL: 'neutral',
  ASSASSIN: 'assassin',
};

// Estados do jogo
const GAME_STATES = {
  WAITING: 'waiting',
  PLAYING: 'playing',
  ENDED: 'ended',
};

// Funções/papéis dos jogadores
const PLAYER_ROLES = {
  SPYMASTER: 'spymaster',
  OPERATIVE: 'operative',
};

// Times
const TEAMS = {
  RED: 'red',
  BLUE: 'blue',
};

// Configurações de imagens
const IMAGES = {
  TOTAL_AVAILABLE: 279, // Total de imagens disponíveis para o jogo
  MIN_ID: 1,            // ID mínimo das imagens
};

// Configurações de tempo
const TIMES = {
  CLEANUP_INTERVAL: 60 * 60 * 1000, // 1 hora para limpeza de salas vazias
  GAME_END_NOTIFICATION_DELAY: 500, // Delay para notificação de fim de jogo
};

module.exports = {
  BOARD,
  CARD_DISTRIBUTION,
  CARD_TYPES,
  GAME_STATES,
  PLAYER_ROLES,
  TEAMS,
  IMAGES,
  TIMES,
};