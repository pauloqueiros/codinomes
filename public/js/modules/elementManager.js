// Gerencia e recupera os elementos do DOM

// Função para obter todos os elementos do DOM que o app precisa
export function getElements() {
  const elements = {
    // Containers de tela
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

  // Log para debugging de elementos críticos
  console.log("Elementos críticos obtidos:");
  console.log("- joinRedBtn:", elements.joinRedBtn);
  console.log("- joinBlueBtn:", elements.joinBlueBtn);
  console.log("- redSpymasterBtn:", elements.redSpymasterBtn);
  console.log("- blueSpymasterBtn:", elements.blueSpymasterBtn);

  return elements;
}

// Adicionar função de reinicialização de elementos para garantir que temos os elementos
// corretos após as telas serem carregadas dinamicamente
export function refreshElements() {
  return getElements();
}
