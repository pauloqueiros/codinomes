// Gerencia os eventos de interface do usuário

import { gameState, ensureUsernameIsSet, setUsername, saveGameSession, clearGameSession } from './gameState.js';
import { showScreen } from './uiManager.js';
import { generateShareableUrl, copyToClipboard, updateUrlWithRoom, parseUrlParams } from './urlManager.js';
import { generateRoomName } from './roomNameGenerator.js';
import { notify } from './notificationManager.js';

// Configura os event listeners
export function setupEventListeners(elements, screens) {
  // Helper function para adicionar event listeners com segurança
  function addSafeEventListener(element, event, handler) {
    if (element) {
      element.addEventListener(event, handler);
    } else {
      console.warn(`Element not found for event: ${event}`);
    }
  }

  // Garantir que temos acesso ao socket
  const socket = window.socket;
  if (!socket) {
    console.error("Socket não está disponível para configurar event listeners");
    notify.error("Connection issue detected", "Socket Error");
    return;
  }

  // Debug de elementos importantes
  console.log("Botão Red Team:", elements.joinRedBtn);
  console.log("Botão Blue Team:", elements.joinBlueBtn);
  console.log("Room ID Input:", elements.roomIdInput?.value);

  // Event listeners para criação de sala - agora com notificações
  addSafeEventListener(elements.createRoomBtn, 'click', (e) => {
    e.preventDefault();
    
    // Verificar se tem apelido configurado
    ensureUsernameIsSet(socket);
    
    // Gerar um nome de sala aleatório
    const roomId = generateRoomName();
    
    // Armazena o nome da sala no campo escondido
    if (elements.roomIdInput) {
      elements.roomIdInput.value = roomId;
    }
    
    // Criar sala e entrar
    socket.emit('create-room', roomId);
    
    // Atualiza a URL com o ID da sala para facilitar compartilhamento
    updateUrlWithRoom(roomId);
  });

  // Função para entrar em uma sala (usada tanto pelo botão quanto pela URL)
  function joinRoom(roomId) {
    if (!roomId) {
      notify.error('No room ID provided', 'Error');
      return;
    }
    
    console.log(`Attempting to join room: ${roomId}`);
    
    // Atualizar a URL para incluir o ID da sala (sem recarregar a página)
    updateUrlWithRoom(roomId);

    // Emitir evento para entrar na sala - não precisamos garantir username aqui
    // pois vamos solicitar depois, caso necessário
    socket.emit('join-room', roomId);
  }

  // Processar parâmetros da URL para entrar numa sala automaticamente
  const urlParams = parseUrlParams();
  if (urlParams.room && elements.roomIdInput) {
    console.log(`URL contains room ID: ${urlParams.room}`);
    elements.roomIdInput.value = urlParams.room;
    
    // Não entraremos na sala automaticamente aqui - isso é feito no app.js
    // para garantir que o socket está pronto
  }

  // Event listener para entrar em uma sala - agora usando a função joinRoom
  addSafeEventListener(elements.joinRoomBtn, 'click', (e) => {
    e.preventDefault();
    
    // Pegar o nome da sala do campo escondido
    const roomId = elements.roomIdInput?.value.trim();
    
    if (roomId) {
      joinRoom(roomId);
    } else {
      notify.error('Room ID not found. Please refresh the page or try a new invite link.', 'Error');
    }
  });

  // Botões de seleção de equipes com debug adicional
  addSafeEventListener(elements.joinRedBtn, 'click', (e) => {
    e.preventDefault();
    console.log("Botão Red Team clicado");
    
    if (!gameState.currentRoom) {
      notify.error("You're not in a room", "Error");
      return;
    }
    
    if (!gameState.playerTeam || gameState.playerRole !== 'spymaster') {
      console.log("Tentando entrar no time vermelho...");
      gameState.playerTeam = 'red';
      gameState.playerRole = 'operative';
      gameState.isSpymaster = false;
      socket.emit('join-team', { 
        room: gameState.currentRoom, 
        team: 'red', 
        role: 'operative' 
      });
      
      // Feedback visual
      notify.info("Joining red team as operative", "Team Change");
      saveGameSession();
    } else {
      notify.warning("You can't change teams as a spymaster", "Role Locked");
    }
  });

  addSafeEventListener(elements.joinBlueBtn, 'click', (e) => {
    e.preventDefault();
    console.log("Botão Blue Team clicado");
    
    if (!gameState.currentRoom) {
      notify.error("You're not in a room", "Error");
      return;
    }
    
    if (!gameState.playerTeam || gameState.playerRole !== 'spymaster') {
      console.log("Tentando entrar no time azul...");
      gameState.playerTeam = 'blue';
      gameState.playerRole = 'operative';
      gameState.isSpymaster = false;
      socket.emit('join-team', { 
        room: gameState.currentRoom, 
        team: 'blue', 
        role: 'operative' 
      });
      
      // Feedback visual
      notify.info("Joining blue team as operative", "Team Change");
      saveGameSession();
    } else {
      notify.warning("You can't change teams as a spymaster", "Role Locked");
    }
  });

  // Funções de spymaster com verificação adicional
  addSafeEventListener(elements.redSpymasterBtn, 'click', (e) => {
    e.preventDefault();
    console.log("Botão Red Spymaster clicado");
    
    if (!gameState.currentRoom) {
      notify.error("You're not in a room", "Error");
      return;
    }
    
    if (!gameState.isSpymaster) {
      console.log("Tentando se tornar spymaster vermelho...");
      gameState.playerTeam = 'red';
      gameState.playerRole = 'spymaster';
      gameState.isSpymaster = true;
      socket.emit('join-team', { 
        room: gameState.currentRoom, 
        team: 'red', 
        role: 'spymaster' 
      });
      
      // Feedback visual
      notify.info("You are now the Red Spymaster!", "Role Change");
      saveGameSession();
    } else {
      notify.warning("You're already a spymaster", "Role Locked");
    }
  });

  addSafeEventListener(elements.blueSpymasterBtn, 'click', (e) => {
    e.preventDefault();
    console.log("Botão Blue Spymaster clicado");
    
    if (!gameState.currentRoom) {
      notify.error("You're not in a room", "Error");
      return;
    }
    
    if (!gameState.isSpymaster) {
      console.log("Tentando se tornar spymaster azul...");
      gameState.playerTeam = 'blue';
      gameState.playerRole = 'spymaster';
      gameState.isSpymaster = true;
      socket.emit('join-team', { 
        room: gameState.currentRoom, 
        team: 'blue', 
        role: 'spymaster' 
      });
      
      // Feedback visual
      notify.info("You are now the Blue Spymaster!", "Role Change");
      saveGameSession();
    } else {
      notify.warning("You're already a spymaster", "Role Locked");
    }
  });

  // Botões de controle do jogo
  addSafeEventListener(elements.startGameBtn, 'click', (e) => {
    e.preventDefault();
    socket.emit('start-game', { room: gameState.currentRoom });
  });

  addSafeEventListener(elements.endTurnBtn, 'click', (e) => {
    e.preventDefault();
    socket.emit('end-turn', { room: gameState.currentRoom });
  });

  addSafeEventListener(elements.playAgainBtn, 'click', (e) => {
    e.preventDefault();
    socket.emit('play-again', { room: gameState.currentRoom });
  });

  addSafeEventListener(elements.returnLobbyBtn, 'click', (e) => {
    e.preventDefault();
    socket.emit('return-lobby', { room: gameState.currentRoom });
    showScreen(screens.welcome, screens);
  });

  addSafeEventListener(elements.submitClueBtn, 'click', (e) => {
    e.preventDefault();
    const clue = elements.clueInput?.value.trim();
    const number = parseInt(elements.clueNumberInput?.value, 10);
    
    if (clue && !isNaN(number)) {
      socket.emit('give-clue', {
        room: gameState.currentRoom,
        clue: clue,
        number: number
      });
      if (elements.clueInput) elements.clueInput.value = '';
      if (elements.clueNumberInput) elements.clueNumberInput.value = '1';
    } else {
      // Substituir o alert por notificação
      notify.warning('Please enter a valid clue and number', 'Invalid Clue');
    }
  });

  // Botão de retorno à tela inicial
  addSafeEventListener(elements.returnHomeBtn, 'click', (e) => {
    e.preventDefault();
    socket.emit('leave-room', { room: gameState.currentRoom });
    gameState.currentRoom = null;
    gameState.playerTeam = null;
    gameState.playerRole = null;
    gameState.isSpymaster = false;
    clearGameSession();  // Limpar sessão salva
    showScreen(screens.welcome, screens);
  });

  // Eventos de username - agora com suporte melhor para entrar em salas por URL
  // Remover a parte de auto-join após definir username, pois agora solicitamos isso com modal
  addSafeEventListener(elements.usernameInput, 'blur', () => {
    const username = elements.usernameInput?.value.trim();
    if (username) {
      setUsername(username, socket);
    }
  });
  
  addSafeEventListener(elements.usernameInput, 'keypress', (e) => {
    if (e.key === 'Enter') {
      // Quando o usuário pressiona Enter no campo de nome
      const username = elements.usernameInput?.value.trim();
      
      if (!username) {
        notify.warning('Please enter a username', 'Missing Information');
        return;
      }
      
      setUsername(username, socket);
      
      // Verificar se tem uma sala para entrar (da URL ou do input)
      const urlParams = parseUrlParams();
      const roomIdFromInput = elements.roomIdInput?.value.trim();
      
      if (urlParams.room || roomIdFromInput) {
        const roomToJoin = urlParams.room || roomIdFromInput;
        console.log(`Joining room after Enter press: ${roomToJoin}`);
        joinRoom(roomToJoin);
      } else {
        // Caso contrário, criar uma nova sala
        console.log('No room ID found, creating a new room');
        elements.createRoomBtn?.click();
      }
    }
  });
  
  // Botão para resetar o jogo
  addSafeEventListener(elements.resetGameBtn, 'click', (e) => {
    e.preventDefault();
    if (confirm('Are you sure you want to reset the game? This will start a new game with the same players.')) {
      socket.emit('reset-game', { room: gameState.currentRoom });
      notify.info('Game has been reset', 'Game Reset');
    }
  });

  // Botão para jogar novamente - na tela de fim de jogo
  if (elements.playAgainBtn) {
    elements.playAgainBtn.addEventListener('click', () => {
      if (window.socket && gameState.currentRoom) {
        console.log('Requesting game reset for room:', gameState.currentRoom);
        window.socket.emit('play-again', { room: gameState.currentRoom });
      }
    });
  }

  // Botão para retornar ao lobby - na tela de fim de jogo
  if (elements.returnLobbyBtn) {
    elements.returnLobbyBtn.addEventListener('click', () => {
      if (gameState.currentRoom) {
        console.log('Returning to lobby for room:', gameState.currentRoom);
        
        // Limpar definições de time/cargo, mas permanecer na sala
        gameState.playerTeam = null;
        gameState.playerRole = null;
        gameState.isSpymaster = false;
        
        // Solicitar ao servidor para retornar ao lobby
        if (window.socket) {
          window.socket.emit('return-to-lobby', { room: gameState.currentRoom });
        }
      }
    });
  }

  // Botão para voltar à tela inicial - na tela de fim de jogo
  if (elements.returnHomeBtn) {
    elements.returnHomeBtn.addEventListener('click', () => {
      // Limpar sessão do jogo atual e voltar para a tela inicial
      clearGameSession();
      
      // Sair da sala atual
      if (window.socket && gameState.currentRoom) {
        window.socket.emit('leave-room');
      }
      
      // Voltar para a tela inicial
      showScreen(screens.welcome, screens);
      
      // Limpar URL
      window.history.replaceState({}, document.title, window.location.pathname);
    });
  }

  // Expor a função joinRoom para poder ser chamada de outros módulos
  window.joinRoom = joinRoom;
}
