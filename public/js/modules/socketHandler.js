// Gerencia as comunicações via socket

import { gameState, setDefaultUsername, loadGameSession, saveGameSession, clearGameSession, setUsername } from './gameState.js';
import { 
  showScreen, 
  updateTeamPanels, 
  updateGameBoard, 
  updateGameStatus,
  updateEndScreen
} from './uiManager.js';
import { notify } from './notificationManager.js';
import { generateShareableUrl, copyToClipboard } from './urlManager.js';

// Configura os handlers de socket
export function setupSocketHandlers(socket, elements, screens) {
  // Armazenar o socket no objeto window para acesso global
  window.socket = socket;
  
  // Conexão estabelecida
  socket.on('connect', () => {
    console.log('Connected to server with socket ID:', socket.id);
    gameState.playerId = socket.id;
    
    // Definir username antes de tentar reconexão
    setDefaultUsername(socket);
    
    // Tentar reconectar à sessão anterior após breve delay para garantir que o socket está pronto
    setTimeout(() => {
      attemptReconnection(socket, screens);
    }, 300);
  });
  
  // Handle para reconexão bem-sucedida
  socket.on('room-rejoined', (data) => {
    console.log('Successfully rejoined room:', data);
    gameState.currentRoom = data.roomId;
    gameState.playerTeam = data.team;
    gameState.playerRole = data.role;
    gameState.isSpymaster = data.role === 'spymaster';
    
    // Salvar sessão atualizada
    saveGameSession();
    
    try {
      showScreen(screens.game, screens);
      notify.success(`Welcome back! You've rejoined the game as ${data.role} in the ${data.team} team.`, 'Game Restored');
      console.log(`Successfully rejoined room ${data.roomId}`);
    } catch (error) {
      console.error('Error handling room-rejoined:', error);
    }
  });
  
  // Username configurado
  socket.on('username-set', (data) => {
    gameState.username = data.username;
    console.log('Username set to:', data.username);
    saveGameSession();
  });
  
  // Mensagem de erro
  socket.on('error', (data) => {
    console.error('Received error from server:', data);
    
    // Se for erro de reconexão, limpar sessão
    if (data.type === 'rejoin-error') {
      console.log('Rejoin error, clearing session');
      clearGameSession();
    }
    
    // Se a sala não existir, redirecionar para a tela de boas-vindas para criar nova sala
    if (data.type === 'room-not-found') {
      // Limpar o parâmetro da URL
      window.history.replaceState({}, '', window.location.pathname);
      
      // Exibir notificação personalizada
      notify.error(
        'The room you tried to join does not exist. Please create a new game.',
        'Room Not Found'
      );
      
      clearGameSession();
      showScreen(screens.welcome, screens);
      return;
    }
    
    // Mostrar outras mensagens de erro com notificação
    notify.error(data.message, 'Error');
  });
  
  // Sala criada
  socket.on('room-created', (data) => {
    gameState.currentRoom = data.roomId;
    try {
      console.log("Room created event received. Showing game screen...");
      
      // Verificar se a tela do jogo existe
      if (!screens.game) {
        console.error("Game screen not found in screens object");
        // Tentar buscar diretamente
        screens.game = document.getElementById('game-screen-container');
        if (!screens.game) {
          console.error("Could not find game screen by ID");
          return;
        }
      }
      
      // Verificar screens antes de chamar showScreen
      console.log("Screens object:", Object.keys(screens));
      
      // Mostrar a tela do jogo
      showScreen(screens.game, screens);
      console.log("Game screen should now be visible");
      
      saveGameSession();
      
      // Substituir o elemento temporário por uma notificação
      showShareNotification(data.roomId);
    } catch (error) {
      console.error('Error handling room-created:', error);
    }
  });
  
  // Sala foi acessada
  socket.on('room-joined', (data) => {
    gameState.currentRoom = data.roomId;
    try {
      console.log("Room joined event received:", data);
      
      // Garantir que qualquer modal anterior seja removido
      const existingModal = document.querySelector('.username-modal');
      if (existingModal) {
        existingModal.remove();
      }
      
      // Verificar se o usuário já tem um nome configurado
      const fromDirectLink = new URLSearchParams(window.location.search).has('room');
      const hasUsername = !!gameState.username;
      
      console.log('Room joined - fromDirectLink:', fromDirectLink, 'hasUsername:', hasUsername);
      
      if (!hasUsername || fromDirectLink) {
        // Solicitar username antes de mostrar a tela do jogo
        promptForUsername(socket, data.roomId, screens);
      } else {
        // Verificar se screens.game existe
        if (!screens.game) {
          console.error("Game screen not found");
          screens.game = document.getElementById('game-screen-container');
          if (!screens.game) {
            console.error("Could not find game screen in DOM");
            return;
          }
        }
        
        // Se já tem username, mostrar a tela do jogo normalmente
        console.log("Showing game screen...");
        showScreen(screens.game, screens);
        
        saveGameSession();
        
        // Notificar o usuário
        notify.success(`You've joined room ${data.roomId}`, 'Room Joined');
        
        // Atualizar URL com o roomId para facilitar reconexões
        import('./urlManager.js').then(({ updateUrlWithRoom }) => {
          updateUrlWithRoom(data.roomId);
        });
      }
    } catch (error) {
      console.error('Error handling room-joined:', error);
    }
  });
  
  // Jogador entrou na sala
  socket.on('player-joined', (data) => {
    console.log(`Player ${data.playerId} joined the room`);
  });
  
  // Jogador saiu da sala
  socket.on('player-left', (data) => {
    console.log(`Player ${data.playerId} left the room`);
    // Se o jogador atual saiu, limpa a sessão
    if (data.playerId === gameState.playerId) {
      clearGameSession();
    }
  });
  
  // Atualizou estado do jogo
  socket.on('game-state', (data) => {
    try {
      updateGameState(data.room, elements, screens);
    } catch (error) {
      console.error('Error updating game state:', error);
    }
  });
  
  // Jogo iniciado
  socket.on('game-started', () => {
    try {
      showScreen(screens.game, screens);
    } catch (error) {
      console.error('Error handling game-started:', error);
    }
  });
  
  // Jogo encerrado
  socket.on('game-ended', (data) => {
    try {
      console.log('Game ended event received:', data);
      
      // SOLUÇÃO DE EMERGÊNCIA: Criar elemento da tela final dinamicamente se não existir
      let endScreen = screens.end;
      
      if (!endScreen) {
        console.warn('End screen not found in screens object, creating fallback');
        endScreen = document.getElementById('end-screen-container');
        
        if (!endScreen) {
          // Se ainda não encontrou, criar um elemento de forma emergencial
          console.warn('Creating emergency end screen element');
          endScreen = document.createElement('div');
          endScreen.id = 'emergency-end-screen';
          endScreen.className = 'container py-5';
          document.body.appendChild(endScreen);
          
          // Adicionar HTML básico
          endScreen.innerHTML = `
            <div class="row justify-content-center">
              <div class="col-md-8">
                <div class="card shadow">
                  <div class="card-body text-center">
                    <h1 class="display-4 mb-4" id="emergency-winner-display">${data.winner.toUpperCase()} TEAM WINS!</h1>
                    
                    <div class="mt-4">
                      <button id="emergency-play-again-btn" class="btn btn-success btn-lg me-3">
                        <i class="fas fa-redo me-2"></i>Play Again
                      </button>
                      <button id="emergency-return-btn" class="btn btn-primary btn-lg">
                        <i class="fas fa-home me-2"></i>Return to Lobby
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          `;
          
          // Adicionar handlers de emergência
          document.getElementById('emergency-play-again-btn')?.addEventListener('click', () => {
            socket.emit('play-again', { room: gameState.currentRoom });
          });
          
          document.getElementById('emergency-return-btn')?.addEventListener('click', () => {
            socket.emit('return-lobby', { room: gameState.currentRoom });
          });
        }
      }
      
      // Ocultar outras telas
      Object.values(screens).forEach(screen => {
        if (screen) {
          screen.classList.add('d-none');
        }
      });
      
      // Mostrar a tela de fim de jogo
      if (endScreen) {
        endScreen.classList.remove('d-none');
        console.log('End screen displayed');
      }
      
      // Notificar sobre o final do jogo
      notify.success(`Game Over! ${data.winner.toUpperCase()} team wins!`, 'Game Ended');
    } catch (error) {
      console.error('Error handling game-ended:', error, error.stack);
      
      // FALLBACK EXTREMO: Mostrar alerta no caso de erro catastrófico
      alert(`Game over! ${data.winner.toUpperCase()} team wins! Click OK to play again.`);
      socket.emit('play-again', { room: gameState.currentRoom });
    }
  });

  // Handler para reset do jogo (jogar novamente)
  socket.on('game-reset', (data) => {
    try {
      console.log('Game reset received:', data);
      
      // Limpar cargo do jogador mas manter no time
      gameState.playerRole = null;
      gameState.isSpymaster = false;
      
      // Atualizar a sessão salva
      saveGameSession();
      
      // Voltar para a tela de jogo (não a tela final)
      showScreen(screens.game, screens);
      
      // Notificar o usuário
      notify.success('Game has been reset. Choose your role to play again!', 'New Game');
    } catch (error) {
      console.error('Error handling game-reset:', error);
    }
  });
  
  // Handler para retornar ao lobby
  socket.on('return-to-lobby', (data) => {
    try {
      console.log('Return to lobby received:', data);
      
      // Limpar time e cargo do jogador
      gameState.playerTeam = null;
      gameState.playerRole = null;
      gameState.isSpymaster = false;
      
      // Atualizar a sessão salva
      saveGameSession();
      
      // Voltar para a tela de jogo (que agora mostrará o lobby)
      showScreen(screens.game, screens);
      
      // Notificar o usuário
      notify.success('Returned to lobby. Choose a team to play!', 'Game Lobby');
    } catch (error) {
      console.error('Error handling return-to-lobby:', error);
    }
  });
}

/**
 * Tenta reconectar a uma sessão anterior
 */
function attemptReconnection(socket, screens) {
  // Verificar se existe uma sessão salva e reconectar
  const savedSession = loadGameSession();
  if (savedSession) {
    // Verificar se a sessão é recente (menos de 24 horas)
    const sessionAge = new Date().getTime() - savedSession.timestamp;
    const maxAge = 24 * 60 * 60 * 1000; // 24 horas em milissegundos
    
    if (sessionAge < maxAge) {
      console.log('Attempting to reconnect to previous game session:', savedSession);
      
      // Verificar se temos todos os dados necessários
      if (savedSession.room && savedSession.team && savedSession.role) {
        // Tenta reconectar à sala
        socket.emit('rejoin-room', {
          roomId: savedSession.room,
          team: savedSession.team,
          role: savedSession.role
        });
      } else {
        console.warn('Incomplete session data, cannot reconnect', savedSession);
        clearGameSession();
      }
    } else {
      // Sessão muito antiga, limpar
      console.log('Session too old, clearing');
      clearGameSession();
    }
  }
}

// Função para atualizar o estado do jogo com base no socket
function updateGameState(room, elements, screens) {
  // Verificar se o estado do jogo é válido
  if (!room) {
    console.error('Invalid room data received');
    return;
  }
  
  // Salvar o ID da sala atual
  if (room.id && !gameState.currentRoom) {
    gameState.currentRoom = room.id;
    saveGameSession(); // Salvar sessão quando recebemos ID válido
  }

  if (room.gameState === 'playing') {
    updateGameBoard(room, elements);
  } else if (room.gameState === 'ended') {
    updateEndScreen(room, elements, screens);
  } else {
    updateTeamPanels(room, elements);
    updateGameStatus(room, elements);
  }
}

// Função atualizada para mostrar notificação de compartilhamento
function showShareNotification(roomId) {
  // Importar apenas as funções necessárias
  import('./urlManager.js').then(({ generateShareableUrl, copyToClipboard }) => {
    const shareUrl = generateShareableUrl(roomId);
    
    // Copiar link para área de transferência e mostrar notificação
    copyToClipboard(shareUrl).then(success => {
      const message = success ? 
        `Link copied to clipboard: ${shareUrl}` : 
        `Share this link with friends: ${shareUrl}`;
      
      notify.success(message, 'Game Created!', 10000);
    });
  });
}

/**
 * Mostra um modal para o usuário escolher seu username
 * @param {object} socket - Socket.io client
 * @param {string} roomId - ID da sala
 * @param {object} screens - Referências para as telas do jogo
 */
function promptForUsername(socket, roomId, screens) {
  // Remover qualquer modal existente primeiro
  const existingModal = document.querySelector('.username-modal');
  if (existingModal) {
    existingModal.remove();
  }

  // Criar o modal de forma dinâmica
  const modal = document.createElement('div');
  modal.className = 'username-modal';
  modal.innerHTML = `
    <div class="username-modal-content">
      <h3>Choose Your Codename</h3>
      <p>Before joining the game, please choose a username:</p>
      <div class="form-group mb-3">
        <input type="text" id="modal-username-input" class="form-control" 
               placeholder="Enter your codename" maxlength="15">
      </div>
      <button id="modal-username-submit" class="btn btn-primary w-100">
        <i class="fas fa-sign-in-alt me-2"></i>Join Game
      </button>
    </div>
  `;
  
  // Adicionar estilos inline para garantir que o modal funcione
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1050;
    backdrop-filter: blur(5px);
  `;
  
  // Estilizar o conteúdo do modal
  const modalContent = modal.querySelector('.username-modal-content');
  modalContent.style.cssText = `
    background-color: white;
    padding: 2rem;
    border-radius: 1rem;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
    width: 90%;
    max-width: 400px;
    animation: modal-slide-in 0.3s ease;
  `;
  
  // Adicionar o modal ao body
  document.body.appendChild(modal);
  
  // Focar o input
  const usernameInput = document.getElementById('modal-username-input');
  if (usernameInput) {
    usernameInput.focus();
    
    // Usar o username salvo anteriormente como valor padrão, se existir
    const savedUsername = localStorage.getItem('codenames-username');
    if (savedUsername) {
      usernameInput.value = savedUsername;
    }
    
    // Permitir submissão com Enter
    usernameInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        submitUsername();
      }
    });
  }
  
  // Configurar evento de clique no botão
  const submitButton = document.getElementById('modal-username-submit');
  if (submitButton) {
    submitButton.addEventListener('click', submitUsername);
  }
  
  // Função para processar o username
  function submitUsername() {
    const username = usernameInput.value.trim();
    
    if (username) {
      // Definir o username
      setUsername(username, socket);
      
      // Remover o modal
      modal.remove();
      
      // Mostrar a tela do jogo
      showScreen(screens.game, screens);
      saveGameSession();
      
      // Notificar o usuário
      notify.success(`You've joined room ${roomId} as ${username}`, 'Room Joined');
    } else {
      // Shake animation no input para indicar erro
      usernameInput.classList.add('shake-animation');
      setTimeout(() => usernameInput.classList.remove('shake-animation'), 500);
      
      notify.warning('Please enter a username', 'Username Required');
    }
  }
  
  // Adicionar estilo da animação ao head
  const style = document.createElement('style');
  style.textContent = `
    @keyframes modal-slide-in {
      from {
        transform: translateY(-20px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1);
      }
    }
    
    @keyframes shake-animation {
      0% { transform: translateX(0); }
      25% { transform: translateX(10px); }
      50% { transform: translateX(-10px); }
      75% { transform: translateX(10px); }
      100% { transform: translateX(0); }
    }
    
    .shake-animation {
      animation: shake-animation 0.5s;
    }
    
    @keyframes btn-pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.1); box-shadow: 0 0 15px rgba(0,123,255,0.7); }
      100% { transform: scale(1); }
    }
    
    .btn-pulse {
      animation: btn-pulse 1s infinite;
    }
  `;
  document.head.appendChild(style);
}
