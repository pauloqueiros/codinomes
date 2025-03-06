// Arquivo principal - coordena a inicialização do jogo

import { gameState } from './modules/gameState.js';
import { setupSocketHandlers } from './modules/socketHandler.js';
import { setupEventListeners } from './modules/eventHandler.js';
import { showScreen } from './modules/uiManager.js';
import { getElements, refreshElements } from './modules/elementManager.js';
import { parseUrlParams } from './modules/urlManager.js';
import { notify } from './modules/notificationManager.js';

// Função principal de inicialização
async function initializeGame() {
  console.log("Inicializando jogo...");
  
  try {
    // Carrega os componentes HTML
    const componentsLoaded = await initializeComponents();
    if (!componentsLoaded) {
      notify.error("Failed to load game components", "Initialization Error");
      return;
    }
    
    // Obtém referências aos elementos do DOM
    const elements = getElements();
    
    // Define os containers de tela
    const screens = {
      welcome: elements.welcomeScreen,
      game: elements.gameScreen,
      end: elements.endScreen,
    };
    
    // Verifica se as telas essenciais existem
    if (!screens.welcome || !screens.game || !screens.end) {
      console.error('Missing one or more required screen elements');
      notify.error("Critical game screens are missing", "Initialization Error");
      return;
    }
    
    // Cria uma conexão socket.io
    const socket = io();
    
    // Configura handlers de socket - eles lidarão com a reconexão automática
    setupSocketHandlers(socket, elements, screens);
    
    // Configura a interface com base nos parâmetros da URL
    const urlParams = parseUrlParams();
    
    // Mostrar tela de boas-vindas inicialmente
    showScreen(screens.welcome, screens);
    
    // Se temos um room ID na URL, preencher o campo e configurar para entrar na sala
    if (urlParams.room) {
      console.log(`Room detected in URL: ${urlParams.room}`);
      
      // Armazenar o ID da sala no input oculto
      if (elements.roomIdInput) {
        elements.roomIdInput.value = urlParams.room;
      }
      
      // Aguardar um momento para garantir que os event listeners estão prontos
      setTimeout(() => {
        // Entrar na sala automaticamente após carregar a página
        socket.emit('join-room', urlParams.room);
      }, 500);
    }
    
    // Garantir que os elementos sejam atualizados após as telas serem carregadas
    setTimeout(() => {
      const updatedElements = refreshElements();
      // Configura event listeners com elementos atualizados
      setupEventListeners(updatedElements, screens);
    }, 300);
    
    return { elements, screens };
  } catch (error) {
    console.error("Erro durante inicialização:", error);
    notify.error("Failed to initialize the game", "Critical Error");
    return null;
  }
}

// Inicializa o jogo quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
  initializeGame()
    .then(result => {
      if (result) {
        const { elements, screens } = result;
        console.log('Jogo inicializado com sucesso');
        
        // Ajusta layout com base no tamanho da tela
        const adjustLayout = () => {
          const gameBoard = elements.gameBoard;
          if (gameBoard) {
            const screenHeight = window.innerHeight;
            if (screenHeight < 700) {
              gameBoard.style.gap = '4px';
              document.documentElement.style.setProperty('--card-scale', '0.9');
            } else if (screenHeight < 800) {
              gameBoard.style.gap = '6px';
              document.documentElement.style.setProperty('--card-scale', '0.95');
            } else {
              gameBoard.style.gap = '8px';
              document.documentElement.style.setProperty('--card-scale', '1');
            }
            
            // ADICIONADO: Garantir que o tabuleiro tenha uma altura adequada inicialmente
            gameBoard.style.maxHeight = `${Math.max(500, window.innerHeight - 200)}px`;
          }
        };
        
        // Ajusta o layout inicialmente e quando a janela for redimensionada
        adjustLayout();
        window.addEventListener('resize', adjustLayout);
        
        // Também reajustar após um pequeno delay para garantir que todos os elementos estão renderizados
        setTimeout(adjustLayout, 500);
        
        // Armazena estado global para debugging
        window.gameState = gameState;
      }
    })
    .catch(error => {
      console.error('Erro ao inicializar o jogo:', error);
      notify.error("Failed to initialize the game", "Critical Error");
    });
});
