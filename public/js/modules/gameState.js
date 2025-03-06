// Gerencia o estado do jogo

// Estado do jogo
export const gameState = {
  currentRoom: null,
  playerId: null,
  playerTeam: null,
  playerRole: null,
  isSpymaster: false,
  username: '',
  sessionId: null,
};

// Salva o estado da sessão atual no localStorage
export function saveGameSession() {
  if (gameState.currentRoom) {
    const sessionData = {
      room: gameState.currentRoom,
      team: gameState.playerTeam,
      role: gameState.playerRole,
      username: gameState.username,
      timestamp: new Date().getTime(),
      playerId: gameState.playerId // Salvar também o playerId
    };
    localStorage.setItem('codenames-session', JSON.stringify(sessionData));
    
    // Sempre salvar o username separadamente para facilitar recuperação
    if (gameState.username) {
      localStorage.setItem('codenames-username', gameState.username);
    }
    
    console.log('Game session saved:', sessionData);
  }
}

// Carrega uma sessão de jogo salva
export function loadGameSession() {
  const sessionData = localStorage.getItem('codenames-session');
  if (sessionData) {
    try {
      const parsedData = JSON.parse(sessionData);
      
      // Verificar se a sessão tem todos os dados necessários
      if (parsedData.room && parsedData.timestamp) {
        // Atualizar o estado do jogo com os dados da sessão
        if (parsedData.username) gameState.username = parsedData.username;
        if (parsedData.team) gameState.playerTeam = parsedData.team;
        if (parsedData.role) gameState.playerRole = parsedData.role;
        if (parsedData.role === 'spymaster') gameState.isSpymaster = true;
        
        return parsedData;
      } else {
        console.warn('Incomplete session data found');
        clearGameSession();
        return null;
      }
    } catch (e) {
      console.error('Error parsing saved session', e);
      clearGameSession();
      return null;
    }
  }
  return null;
}

// Limpa dados da sessão salva
export function clearGameSession() {
  localStorage.removeItem('codenames-session');
  console.log('Game session cleared');
  
  // Não limpar o username para permitir login mais fácil
  // localStorage.removeItem('codenames-username');
}

// Reset do estado do jogo
export function resetGameState() {
  gameState.currentRoom = null;
  gameState.playerTeam = null;
  gameState.playerRole = null;
  gameState.isSpymaster = false;
  clearGameSession();
}

// Atualiza o estado do jogador
export function updatePlayerState(team, role) {
  gameState.playerTeam = team;
  gameState.playerRole = role;
  gameState.isSpymaster = role === 'spymaster';
  saveGameSession();
}

// Gerencia o username
export function setUsername(name, socket) {
  if (name && name.trim()) {
    const trimmedName = name.trim();
    socket.emit('set-username', trimmedName);
    gameState.username = trimmedName;
    
    // Salvar username e sessão
    localStorage.setItem('codenames-username', trimmedName);
    saveGameSession();
    
    return trimmedName;
  }
  return null;
}

// Define um username padrão
export function setDefaultUsername(socket) {
  const storedName = localStorage.getItem('codenames-username');
  
  if (storedName) {
    // Se estamos entrando via link direto, apenas armazenar localmente mas não enviar
    // para o servidor ainda - vamos pedir confirmação pelo modal
    const fromDirectLink = new URLSearchParams(window.location.search).has('room');
    
    if (!fromDirectLink) {
      gameState.username = storedName;
      socket.emit('set-username', storedName);
    }
    return storedName;
  } else if (gameState.playerId) {
    const defaultName = `Player-${gameState.playerId.substr(0, 5)}`;
    
    // Apenas definir um nome padrão se não estamos entrando via link
    const fromDirectLink = new URLSearchParams(window.location.search).has('room');
    if (!fromDirectLink) {
      gameState.username = defaultName;
      socket.emit('set-username', defaultName);
      localStorage.setItem('codenames-username', defaultName);
    }
    
    return defaultName;
  }
  
  return null;
}

// Garante que o username está configurado
export function ensureUsernameIsSet(socket) {
  const usernameInput = document.getElementById('username-input');
  
  if (!gameState.username && usernameInput?.value.trim()) {
    setUsername(usernameInput.value.trim(), socket);
  }
  
  // Armazena no localStorage para visitas futuras
  if (gameState.username) {
    localStorage.setItem('codenames-username', gameState.username);
  }
}
