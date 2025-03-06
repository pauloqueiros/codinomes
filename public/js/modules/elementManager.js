// Gerencia as referências aos elementos do DOM

// Função para obter todos os elementos do DOM que o app precisa
export function getElements() {
  console.log("Getting element references...");
  
  const elements = {
    // Containers de tela - IMPORTANTE: Usar apenas os IDs corretos
    welcomeScreen: document.getElementById('welcome-screen-container'),
    gameScreen: document.getElementById('game-screen-container'),
    endScreen: document.getElementById('end-screen-container'),
    
    // Elementos da tela de boas-vindas
    createRoomBtn: document.getElementById('create-room-btn'),
    roomIdInput: document.getElementById('room-id-input'),
    usernameInput: document.getElementById('username-input'),
    
    // Elementos de equipe
    redTeamMembers: document.getElementById('red-team-members'),
    blueTeamMembers: document.getElementById('blue-team-members'),
    joinRedBtn: document.getElementById('join-red-btn'),
    joinBlueBtn: document.getElementById('join-blue-btn'),
    redSpymasterBtn: document.getElementById('red-spymaster-btn'),
    blueSpymasterBtn: document.getElementById('blue-spymaster-btn'),
    redTeamGameMembers: document.getElementById('red-team-game-members'),
    blueTeamGameMembers: document.getElementById('blue-team-game-members'),
    redTeamStatus: document.getElementById('red-team-status'),
    blueTeamStatus: document.getElementById('blue-team-status'),
    
    // Elementos do jogo
    startGameBtn: document.getElementById('start-game-btn'),
    gameBoard: document.getElementById('game-board'),
    turnIndicator: document.getElementById('turn-indicator'),
    endTurnBtn: document.getElementById('end-turn-btn'),
    resetGameBtn: document.getElementById('reset-game-btn'), // Novo botão de reset
    currentClue: document.getElementById('current-clue'),
    clueText: document.getElementById('clue-text'),
    clueNumber: document.getElementById('clue-number'),
    spymasterControls: document.getElementById('spymaster-controls'),
    clueInput: document.getElementById('clue-input'),
    clueNumberInput: document.getElementById('clue-number-input'),
    submitClueBtn: document.getElementById('submit-clue-btn'),
    clueHistoryList: document.getElementById('clue-history-list'),
    
    // Elementos da tela final
    winnerDisplay: document.getElementById('winner-display'),
    playAgainBtn: document.getElementById('play-again-btn'),
    returnLobbyBtn: document.getElementById('return-lobby-btn'),
    returnHomeBtn: document.getElementById('return-home-btn'),
    
    // Elementos de status
    gameStatus: document.getElementById('game-status'),
    playerStatus: document.getElementById('player-status'),
  };

  // Debug extensivo para elementos críticos
  console.log("--- CRITICAL ELEMENT CHECKS ---");
  console.log("Welcome screen:", elements.welcomeScreen ? "FOUND" : "NOT FOUND");
  console.log("Game screen:", elements.gameScreen ? "FOUND" : "NOT FOUND");
  console.log("End screen:", elements.endScreen ? "FOUND" : "NOT FOUND");
  
  // Se não encontrou alguma tela, tentar encontrar de outras formas
  if (!elements.welcomeScreen) {
    elements.welcomeScreen = findScreenElement('welcome');
  }
  
  if (!elements.gameScreen) {
    elements.gameScreen = findScreenElement('game');
  }
  
  if (!elements.endScreen) {
    elements.endScreen = findScreenElement('end');
  }
  
  return elements;
}

// Função auxiliar para encontrar elementos de tela de várias maneiras
function findScreenElement(screenName) {
  const possibleIds = [
    `${screenName}-screen-container`, 
    `${screenName}-screen`,
    `${screenName}ScreenContainer`,
    `${screenName}Screen`
  ];
  
  for (const id of possibleIds) {
    const element = document.getElementById(id);
    if (element) {
      console.log(`Found ${screenName} screen with ID: ${id}`);
      return element;
    }
  }
  
  // Último recurso: buscar por classe ou atributo
  const byClass = document.querySelector(`.${screenName}-screen`);
  if (byClass) {
    console.log(`Found ${screenName} screen by class`);
    return byClass;
  }
  
  console.error(`Could not find ${screenName} screen element`);
  return null;
}

// Função para atualizar referências aos elementos após componentes serem carregados
export function refreshElements() {
  console.log("Refreshing element references...");
  return getElements();
}
