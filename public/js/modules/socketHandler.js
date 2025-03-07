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
    console.log('Conectado ao servidor com ID de socket:', socket.id);
    gameState.playerId = socket.id;
    
    // Definir username antes de tentar reconexão
    setDefaultUsername(socket);
    
    // Tentar reconectar à sessão anterior após breve delay para garantir que o socket está pronto
    setTimeout(() => {
      attemptReconnection(socket, screens);
    }, 300);
  });
  
  // Handler para reconexão bem-sucedida
  socket.on('room-rejoined', (data) => {
    console.log('Reconectado com sucesso à sala:', data);
    gameState.currentRoom = data.roomId;
    gameState.playerTeam = data.team;
    gameState.playerRole = data.role;
    gameState.isSpymaster = data.role === 'spymaster';
    
    // Salvar sessão atualizada
    saveGameSession();
    
    try {
      showScreen(screens.game, screens);
      notify.success(`Bem-vindo novamente! Você voltou ao jogo como ${data.role === 'spymaster' ? 'espião-mestre' : 'operativo'} no time ${data.team === 'red' ? 'vermelho' : 'azul'}.`, 'Jogo Restaurado');
      console.log(`Reconectado com sucesso à sala ${data.roomId}`);
    } catch (error) {
      console.error('Erro ao processar room-rejoined:', error);
    }
  });
  
  // Username configurado
  socket.on('username-set', (data) => {
    gameState.username = data.username;
    console.log('Nome de usuário definido para:', data.username);
    saveGameSession();
  });
  
  // Mensagem de erro
  socket.on('error', (data) => {
    console.error('Erro recebido do servidor:', data);
    
    // Se for erro de reconexão, limpar sessão
    if (data.type === 'rejoin-error') {
      console.log('Erro de reconexão, limpando sessão');
      clearGameSession();
    }
    
    // Se a sala não existir, redirecionar para a tela de boas-vindas para criar nova sala
    if (data.type === 'room-not-found') {
      // Limpar o parâmetro da URL
      window.history.replaceState({}, '', window.location.pathname);
      
      // Exibir notificação personalizada
      notify.error(
        'A sala que você tentou acessar não existe. Por favor, crie um novo jogo.',
        'Sala Não Encontrada'
      );
      
      clearGameSession();
      showScreen(screens.welcome, screens);
      return;
    }
    
    // Mostrar outras mensagens de erro com notificação
    notify.error(data.message, 'Erro');
  });
  
  // Sala criada
  socket.on('room-created', (data) => {
    gameState.currentRoom = data.roomId;
    try {
      console.log("Evento de sala criada recebido. Mostrando tela de jogo...");
      
      // Verificar se a tela do jogo existe
      if (!screens.game) {
        console.error("Tela de jogo não encontrada no objeto screens");
        // Tentar buscar diretamente
        screens.game = document.getElementById('game-screen-container');
        if (!screens.game) {
          console.error("Não foi possível encontrar a tela de jogo pelo ID");
          return;
        }
      }
      
      // Verificar screens antes de chamar showScreen
      console.log("Objeto screens:", Object.keys(screens));
      
      // Mostrar a tela do jogo
      showScreen(screens.game, screens);
      console.log("A tela de jogo agora deve estar visível");
      
      saveGameSession();
      
      // Substituir o elemento temporário por uma notificação
      showShareNotification(data.roomId);
    } catch (error) {
      console.error('Erro ao processar room-created:', error);
    }
  });
  
  // Sala foi acessada
  socket.on('room-joined', (data) => {
    gameState.currentRoom = data.roomId;
    try {
      console.log("Evento de sala acessada recebido:", data);
      
      // Garantir que qualquer modal anterior seja removido
      const existingModal = document.querySelector('.username-modal');
      if (existingModal) {
        existingModal.remove();
      }
      
      // Verificar se o usuário já tem um nome configurado
      const fromDirectLink = new URLSearchParams(window.location.search).has('room');
      const hasUsername = !!gameState.username;
      
      console.log('Sala acessada - por link direto:', fromDirectLink, 'tem nome de usuário:', hasUsername);
      
      if (!hasUsername || fromDirectLink) {
        // Solicitar username antes de mostrar a tela do jogo
        promptForUsername(socket, data.roomId, screens);
      } else {
        // Verificar se screens.game existe
        if (!screens.game) {
          console.error("Tela de jogo não encontrada");
          screens.game = document.getElementById('game-screen-container');
          if (!screens.game) {
            console.error("Não foi possível encontrar a tela de jogo no DOM");
            return;
          }
        }
        
        // Se já tem username, mostrar a tela do jogo normalmente
        console.log("Mostrando tela de jogo...");
        showScreen(screens.game, screens);
        
        saveGameSession();
        
        // Notificar o usuário
        notify.success(`Você entrou na sala ${data.roomId}`, 'Sala Acessada');
        
        // Atualizar URL com o roomId para facilitar reconexões
        import('./urlManager.js').then(({ updateUrlWithRoom }) => {
          updateUrlWithRoom(data.roomId);
        });
      }
    } catch (error) {
      console.error('Erro ao processar room-joined:', error);
    }
  });
  
  // Jogador entrou na sala
  socket.on('player-joined', (data) => {
    console.log(`Jogador ${data.playerId} entrou na sala`);
  });
  
  // Jogador saiu da sala
  socket.on('player-left', (data) => {
    console.log(`Jogador ${data.playerId} saiu da sala`);
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
      console.error('Erro ao atualizar estado do jogo:', error);
    }
  });
  
  // Jogo iniciado
  socket.on('game-started', () => {
    try {
      showScreen(screens.game, screens);
    } catch (error) {
      console.error('Erro ao processar game-started:', error);
    }
  });
  
  // Jogo encerrado
  socket.on('game-ended', (data) => {
    try {
      console.log('Evento de fim de jogo recebido:', data);
      
      // SOLUÇÃO DE EMERGÊNCIA: Criar elemento da tela final dinamicamente se não existir
      let endScreen = screens.end;
      
      if (!endScreen) {
        console.warn('Tela final não encontrada no objeto screens, criando fallback');
        endScreen = document.getElementById('end-screen-container');
        
        if (!endScreen) {
          // Se ainda não encontrou, criar um elemento de forma emergencial
          console.warn('Criando elemento de tela final de emergência');
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
                    <h1 class="display-4 mb-4" id="emergency-winner-display">TIME ${data.winner.toUpperCase() === 'RED' ? 'VERMELHO' : 'AZUL'} VENCE!</h1>
                    
                    <div class="mt-4">
                      <button id="emergency-play-again-btn" class="btn btn-success btn-lg me-3">
                        <i class="fas fa-redo me-2"></i>Jogar Novamente
                      </button>
                      <button id="emergency-return-btn" class="btn btn-primary btn-lg">
                        <i class="fas fa-home me-2"></i>Voltar ao Lobby
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
        console.log('Tela final exibida');
      }
      
      // Notificar sobre o final do jogo
      const winnerTeam = data.winner === 'red' ? 'VERMELHO' : 'AZUL';
      notify.success(`Fim de jogo! Time ${winnerTeam} venceu!`, 'Jogo Finalizado');
    } catch (error) {
      console.error('Erro ao processar game-ended:', error, error.stack);
      
      // FALLBACK EXTREMO: Mostrar alerta no caso de erro catastrófico
      const winnerTeam = data.winner === 'red' ? 'VERMELHO' : 'AZUL';
      alert(`Fim de jogo! Time ${winnerTeam} venceu! Clique OK para jogar novamente.`);
      socket.emit('play-again', { room: gameState.currentRoom });
    }
  });

  // Handler para reset do jogo (jogar novamente)
  socket.on('game-reset', (data) => {
    try {
      console.log('Reset de jogo recebido:', data);
      
      // Limpar cargo do jogador mas manter no time
      gameState.playerRole = null;
      gameState.isSpymaster = false;
      
      // Atualizar a sessão salva
      saveGameSession();
      
      // Voltar para a tela de jogo (não a tela final)
      showScreen(screens.game, screens);
      
      // Notificar o usuário
      notify.success('O jogo foi reiniciado. Escolha sua função para jogar novamente!', 'Novo Jogo');
    } catch (error) {
      console.error('Erro ao processar game-reset:', error);
    }
  });
  
  // Handler para retornar ao lobby
  socket.on('return-to-lobby', (data) => {
    try {
      console.log('Retorno ao lobby recebido:', data);
      
      // Limpar time e cargo do jogador
      gameState.playerTeam = null;
      gameState.playerRole = null;
      gameState.isSpymaster = false;
      
      // Atualizar a sessão salva
      saveGameSession();
      
      // Voltar para a tela de jogo (que agora mostrará o lobby)
      showScreen(screens.game, screens);
      
      // Notificar o usuário
      notify.success('Voltou para o lobby. Escolha um time para jogar!', 'Lobby do Jogo');
    } catch (error) {
      console.error('Erro ao processar return-to-lobby:', error);
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
      console.log('Tentando reconectar à sessão anterior de jogo:', savedSession);
      
      // Verificar se temos todos os dados necessários
      if (savedSession.room && savedSession.team && savedSession.role) {
        // Tenta reconectar à sala
        socket.emit('rejoin-room', {
          roomId: savedSession.room,
          team: savedSession.team,
          role: savedSession.role
        });
      } else {
        console.warn('Dados de sessão incompletos, não é possível reconectar', savedSession);
        clearGameSession();
      }
    } else {
      // Sessão muito antiga, limpar
      console.log('Sessão muito antiga, limpando');
      clearGameSession();
    }
  }
}

// Função para atualizar o estado do jogo com base no socket
function updateGameState(room, elements, screens) {
  // Verificar se o estado do jogo é válido
  if (!room) {
    console.error('Dados de sala inválidos recebidos');
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
        `Link copiado para a área de transferência: ${shareUrl}` : 
        `Compartilhe este link com amigos: ${shareUrl}`;
      
      notify.success(message, 'Jogo Criado!', 10000);
    });
  });
}

/**
 * Mostra um modal para o usuário escolher seu username
 * @param {object} socket - Cliente Socket.io
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
      <h3>Escolha Seu Codinome</h3>
      <p>Antes de entrar no jogo, por favor escolha um nome de usuário:</p>
      <div class="form-group mb-3">
        <input type="text" id="modal-username-input" class="form-control" 
               placeholder="Digite seu codinome" maxlength="15">
      </div>
      <button id="modal-username-submit" class="btn btn-primary w-100">
        <i class="fas fa-sign-in-alt me-2"></i>Entrar no Jogo
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
      notify.success(`Você entrou na sala ${roomId} como ${username}`, 'Sala Acessada');
    } else {
      // Adiciona classe de animação de shake
      usernameInput.classList.add('shake-animation');
      setTimeout(() => usernameInput.classList.remove('shake-animation'), 500);
      
      notify.warning('Por favor, digite um nome de usuário', 'Nome Necessário');
    }
  }
  
  // Adicionar referência às animações que devem estar definidas em CSS
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
