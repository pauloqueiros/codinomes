// Gerencia a interface do usuário

import { gameState } from './gameState.js';

// Controla a visibilidade das telas
export function showScreen(screenToShow, screens) {
  try {
    // Oculta todas as telas
    Object.values(screens).forEach(screen => {
      if (screen) {
        screen.classList.add('d-none');
      }
    });
    
    // Mostra a tela solicitada
    if (screenToShow) {
      screenToShow.classList.remove('d-none');
    }
  } catch (error) {
    console.error('Error switching screens:', error);
  }
}

// Adiciona membro à equipe
export function addTeamMember(container, player, currentPlayerId) {
  const memberElement = document.createElement('div');
  memberElement.className = `team-member ${player.role}`;
  if (player.id === currentPlayerId) {
    memberElement.classList.add('current-player');
  }
  // Usar o username em vez do ID
  memberElement.textContent = `${player.username} (${player.role})`;
  container.appendChild(memberElement);
}

// Atualiza os painéis das equipes
export function updateTeamPanels(room, elements) {
  // Atualiza membros da equipe vermelha
  if (elements.redTeamGameMembers) {
    elements.redTeamGameMembers.innerHTML = '';
    room.redTeam.forEach(player => {
      addTeamMember(elements.redTeamGameMembers, player, gameState.playerId);
    });
  }
  
  // Atualiza membros da equipe azul
  if (elements.blueTeamGameMembers) {
    elements.blueTeamGameMembers.innerHTML = '';
    room.blueTeam.forEach(player => {
      addTeamMember(elements.blueTeamGameMembers, player, gameState.playerId);
    });
  }
  
  // Atualiza controles do jogo
  updateGameControls(room, elements);
}

// Atualiza os controles do jogo
export function updateGameControls(room, elements) {
  // Mostrar/ocultar botões de controle com base no estado do jogo
  const startButton = elements.startGameBtn;
  if (startButton) {
    startButton.style.display = room.gameState === 'playing' ? 'none' : 'block';
  }
  
  // Adicionar botão de reset - Visível apenas durante o jogo e apenas para spymasters
  if (elements.resetGameBtn) {
    if (room.gameState === 'playing' && gameState.isSpymaster) {
      elements.resetGameBtn.classList.remove('hidden');
    } else {
      elements.resetGameBtn.classList.add('hidden');
    }
  }
  
  // Desabilitar botões de troca de equipe quando o jogador já é um spymaster
  if (gameState.isSpymaster) {
    // Desabilitar todos os botões de troca de equipe
    if (elements.joinRedBtn) {
      elements.joinRedBtn.disabled = true;
      elements.joinRedBtn.title = 'Spymasters cannot change teams';
    }
    
    if (elements.joinBlueBtn) {
      elements.joinBlueBtn.disabled = true;
      elements.joinBlueBtn.title = 'Spymasters cannot change teams';
    }
    
    if (elements.redSpymasterBtn) {
      elements.redSpymasterBtn.disabled = true;
      elements.redSpymasterBtn.title = 'You are already a spymaster';
    }
    
    if (elements.blueSpymasterBtn) {
      elements.blueSpymasterBtn.disabled = true;
      elements.blueSpymasterBtn.title = 'You are already a spymaster';
    }
  }
  
  // Desabilitar apenas os botões de spymaster quando o jogo já começou
  else if (room.gameState === 'playing') {
    if (elements.redSpymasterBtn) {
      elements.redSpymasterBtn.disabled = true;
      elements.redSpymasterBtn.title = 'Game already started';
    }
    
    if (elements.blueSpymasterBtn) {
      elements.blueSpymasterBtn.disabled = true;
      elements.blueSpymasterBtn.title = 'Game already started';
    }
  }
}

// Atualiza o tabuleiro do jogo
export function updateGameBoard(room, elements) {
  if (!room || !room.currentTurn) {
    console.error('Invalid room data');
    return;
  }

  // Update turn indicator diretamente (sem o container game-info)
  if (elements.turnIndicator && room.currentTurn) {
    const turnText = elements.turnIndicator.querySelector('.turn-text') || elements.turnIndicator;
    turnText.textContent = `${room.currentTurn.toUpperCase()} TEAM'S TURN!`;
    elements.turnIndicator.className = 'badge text-uppercase fw-bold mb-2 ' + room.currentTurn;

    // Adicionar ícones baseados no time
    const teamIcon = room.currentTurn === 'red' ? 'fire' : 'water';
    if (!elements.turnIndicator.querySelector('.turn-text')) {
      elements.turnIndicator.innerHTML = `
        <i class="fas fa-${teamIcon} me-2"></i>
        <span class="turn-text">${room.currentTurn.toUpperCase()} TEAM'S TURN!</span>
        <i class="fas fa-${teamIcon} ms-2"></i>
      `;
    } else {
      const icons = elements.turnIndicator.querySelectorAll('i');
      if (icons && icons.length >= 2) {
        icons[0].className = `fas fa-${teamIcon} me-2`;
        icons[1].className = `fas fa-${teamIcon} ms-2`;
      }
    }
  }

  // Show/hide spymaster controls
  if (elements.spymasterControls) {
    if (gameState.isSpymaster && gameState.playerTeam === room.currentTurn) {
      elements.spymasterControls.classList.remove('hidden');
    } else {
      elements.spymasterControls.classList.add('hidden');
    }
  }

  // Show/hide end turn button - only visible to operatives of current team
  if (elements.endTurnBtn) {
    const isCurrentTeamOperative = 
      gameState.playerTeam === room.currentTurn && 
      gameState.playerRole === 'operative';
    
    // Only show the end turn button if there's an active clue
    const hasActiveClue = room.currentClue != null;
    
    if (isCurrentTeamOperative && hasActiveClue) {
      elements.endTurnBtn.classList.remove('hidden');
    } else {
      elements.endTurnBtn.classList.add('hidden');
    }
  }

  // Aplicar visão de spymaster
  if (elements.gameBoard) {
    if (gameState.isSpymaster) {
      elements.gameBoard.classList.add('spymaster-view');
      document.body.classList.add('spymaster-view');
    } else {
      elements.gameBoard.classList.remove('spymaster-view');
      document.body.classList.remove('spymaster-view');
    }
  }

  // Show current clue if available
  if (elements.currentClue && elements.clueText && elements.clueNumber && room.currentClue) {
    elements.currentClue.classList.remove('hidden');
    elements.clueText.textContent = room.currentClue.word || '';
    elements.clueNumber.textContent = room.currentClue.number || '';
  } else if (elements.currentClue) {
    elements.currentClue.classList.add('hidden');
  }

  // Update team sidebars
  updateGameTeamPanels(room, elements);

  // Update clue history
  updateClueHistory(room.clueHistory, elements);

  // Clear existing board
  if (elements.gameBoard && room.cards) {
    elements.gameBoard.innerHTML = '';
    
    // Create cards
    room.cards.forEach((card, index) => {
      const cardElement = document.createElement('div');
      cardElement.className = 'card';
      cardElement.dataset.index = index;
      cardElement.dataset.team = card.team; // Adicionar atributo de equipe para uso em CSS
      
      const cardInner = document.createElement('div');
      cardInner.className = 'card-inner';
      
      // Add team class to all cards
      cardElement.classList.add(card.team);
      
      // Configurar a URL da imagem - Corrigindo para usar uma URL segura
      // Usar a CDN jsdelivr em vez da URL original (que pode ter restrições de CORS)
      const imageUrl = `https://cdn.jsdelivr.net/gh/samdemaeyer/codenames-pictures@main/public/images/cards/card-${card.imageId}.jpg`;
      
      // Definir a imagem de fundo e garantir que seja carregada corretamente
      cardInner.style.backgroundImage = `url('${imageUrl}')`;
      
      // Adicionar manipulador de erro para casos em que a imagem não carrega
      const backupImage = document.createElement('img');
      backupImage.src = imageUrl;
      backupImage.style.display = 'none';
      backupImage.onerror = () => {
        console.error(`Failed to load image: ${imageUrl}`);
        // Usar uma imagem de fallback se a original não carregar
        cardInner.style.backgroundImage = "url('/images/card-fallback.jpg')";
        cardInner.style.backgroundColor = "#e0e0e0"; // Cor de fundo de fallback
        cardInner.innerText = "Image " + card.imageId;
        cardInner.style.display = "flex";
        cardInner.style.alignItems = "center";
        cardInner.style.justifyContent = "center";
        cardInner.style.color = "#666";
        cardInner.style.padding = "10px";
        cardInner.style.textAlign = "center";
      };
      
      cardElement.appendChild(cardInner);
      cardElement.appendChild(backupImage);
      
      // Show revealed cards
      if (card.revealed) {
        cardElement.classList.add('revealed');
        
        // Adicionar um elemento de "check" para indicar que a carta foi revelada
        const checkMark = document.createElement('div');
        checkMark.className = `revealed-mark ${card.team}`;
        checkMark.innerHTML = card.team === 'assassin' ? 
          '<i class="fas fa-skull-crossbones"></i>' : 
          '<i class="fas fa-check-circle"></i>';
        checkMark.style.position = 'absolute';
        checkMark.style.top = '10px';
        checkMark.style.right = '10px';
        checkMark.style.color = 'white';
        checkMark.style.fontSize = '24px';
        checkMark.style.textShadow = '0 0 5px rgba(0,0,0,0.5)';
        checkMark.style.zIndex = '5';
        cardElement.appendChild(checkMark);
      }
      
      // Add click event if player is operative and it's their team's turn
      if (gameState.playerTeam === room.currentTurn && gameState.playerRole === 'operative' && !card.revealed) {
        cardElement.addEventListener('click', () => {
          window.socket.emit('select-card', index);
        });
        
        // Adicionar classe para indicar que é clicável
        cardElement.classList.add('clickable');
      }
      
      if (elements.gameBoard) elements.gameBoard.appendChild(cardElement);
    });

    // Adjust card proportions with improved aspect ratio
    if (elements.gameBoard) {
      const availableHeight = elements.gameBoard.clientHeight;
      const availableWidth = elements.gameBoard.clientWidth;
      
      const cardWidth = availableWidth / 5;
      const cardHeight = availableHeight / 5;
      
      const cards = elements.gameBoard.querySelectorAll('.card');
      cards.forEach(card => {
        // Reduzir o ratio para diminuir a altura das cartas
        const optimalRatio = Math.min(cardHeight / cardWidth * 95, 75); // Reduzido de 105/80 para 95/75
        card.style.paddingTop = `${optimalRatio}%`;
      });
    }
    
    // Ajustar largura dos controles do spymaster para acompanhar o tabuleiro
    if (elements.spymasterControls && elements.gameBoard) {
      const boardWidth = elements.gameBoard.offsetWidth;
      elements.spymasterControls.style.width = `${boardWidth}px`;
      
      // Ajustar também outros elementos de controle para acompanhar o tabuleiro
      if (elements.currentClue) {
        elements.currentClue.style.width = `${boardWidth}px`;
      }
      
      if (elements.gameControls) {
        elements.gameControls.style.width = `${boardWidth}px`;
      }
      
      // CORRIGIDO: Calcular altura corretamente, garantindo que seja um valor positivo
      // Primeiro medir a altura dos controles
      const controlsHeight = (elements.spymasterControls.offsetHeight || 0) + 
                            (elements.currentClue?.offsetHeight || 0) + 20; // 20px de margem
      
      // Verificar se o valor é válido antes de aplicar
      if (controlsHeight > 0) {
        // Garantir que a altura final seja um valor positivo
        const finalHeight = Math.max(100, window.innerHeight - controlsHeight - 60);
        elements.gameBoard.style.maxHeight = `${finalHeight}px`;
      } else {
        // Valor de fallback seguro
        elements.gameBoard.style.maxHeight = '70vh';
      }
    }
  }
}

// Atualiza os painéis das equipes no jogo
export function updateGameTeamPanels(room, elements) {
  if (!room || !room.cards) return;

  // Clear existing members
  if (elements.redTeamGameMembers) elements.redTeamGameMembers.innerHTML = '';
  if (elements.blueTeamGameMembers) elements.blueTeamGameMembers.innerHTML = '';

  // Reset status
  if (elements.redTeamStatus) elements.redTeamStatus.innerHTML = '';
  if (elements.blueTeamStatus) elements.blueTeamStatus.innerHTML = '';

  // Count revealed cards
  const redCardsTotal = room.cards.filter(card => card.team === 'red').length;
  const blueCardsTotal = room.cards.filter(card => card.team === 'blue').length;
  const redCardsRevealed = room.cards.filter(card => card.team === 'red' && card.revealed).length;
  const blueCardsRevealed = room.cards.filter(card => card.team === 'blue' && card.revealed).length;

  // Update team members - agora com limite de altura e ordenação de spymasters primeiro
  if (room.redTeam && elements.redTeamGameMembers) {
    // Organizar com spymasters no topo
    const sortedMembers = [...room.redTeam].sort((a, b) => 
      a.role === 'spymaster' ? -1 : b.role === 'spymaster' ? 1 : 0
    );
    
    sortedMembers.forEach(player => {
      addTeamMember(elements.redTeamGameMembers, player, gameState.playerId);
    });
  }

  if (room.blueTeam && elements.blueTeamGameMembers) {
    // Organizar com spymasters no topo
    const sortedMembers = [...room.blueTeam].sort((a, b) => 
      a.role === 'spymaster' ? -1 : b.role === 'spymaster' ? 1 : 0
    );
    
    sortedMembers.forEach(player => {
      addTeamMember(elements.blueTeamGameMembers, player, gameState.playerId);
    });
  }

  // Update team status - agora com layout melhorado
  if (elements.redTeamStatus) {
    const redStatusElement = document.createElement('div');
    redStatusElement.innerHTML = `<strong>Cards:</strong> ${redCardsRevealed}/${redCardsTotal}`;
    elements.redTeamStatus.appendChild(redStatusElement);
    
    // Adicionar indicador de turno se necessário
    if (room.currentTurn === 'red') {
      const turnElement = document.createElement('div');
      turnElement.className = 'current-turn';
      turnElement.innerHTML = '<strong>CURRENT TURN</strong>';
      elements.redTeamStatus.appendChild(turnElement);
    }
  }

  if (elements.blueTeamStatus) {
    const blueStatusElement = document.createElement('div');
    blueStatusElement.innerHTML = `<strong>Cards:</strong> ${blueCardsRevealed}/${blueCardsTotal}`;
    elements.blueTeamStatus.appendChild(blueStatusElement);
    
    // Adicionar indicador de turno se necessário
    if (room.currentTurn === 'blue') {
      const turnElement = document.createElement('div');
      turnElement.className = 'current-turn';
      turnElement.innerHTML = '<strong>CURRENT TURN</strong>';
      elements.blueTeamStatus.appendChild(turnElement);
    }
  }
}

// Atualiza o histórico de dicas
export function updateClueHistory(clueHistory, elements) {
  if (!elements.clueHistoryList) return;
  
  elements.clueHistoryList.innerHTML = '';

  if (!clueHistory || clueHistory.length === 0) {
    const emptyMessage = document.createElement('p');
    emptyMessage.textContent = 'No clues have been given yet.';
    emptyMessage.className = 'empty-history-message';
    elements.clueHistoryList.appendChild(emptyMessage);
    return;
  }

  [...clueHistory].reverse().forEach(clue => {
    const clueItem = document.createElement('div');
    clueItem.className = `clue-history-item ${clue.team}`;
    
    const clueContent = document.createElement('div');
    clueContent.className = 'clue-content';
    clueContent.textContent = `${clue.team.toUpperCase()}: "${clue.word}" (${clue.number})`;
    
    const clueTime = document.createElement('div');
    clueTime.className = 'clue-timestamp';
    const timestamp = new Date(clue.timestamp);
    clueTime.textContent = timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    clueItem.appendChild(clueContent);
    clueItem.appendChild(clueTime);
    elements.clueHistoryList.appendChild(clueItem);
  });
}

// Atualiza a tela final
export function updateEndScreen(room, elements, screens) {
  if (elements.winnerDisplay) {
    elements.winnerDisplay.textContent = `${room.winner.toUpperCase()} team wins!`;
  }
  showScreen(screens.end, screens);
}

// Atualiza o status do jogo
export function updateGameStatus(room, elements) {
  if (!elements.gameStatus) return;

  if (!gameState.playerTeam) {
    elements.gameStatus.textContent = 'Choose a team to play';
    elements.gameStatus.className = 'alert alert-info text-center mb-2';
  } else if (room.gameState === 'waiting') {
    if (room.redTeam.length === 0 || room.blueTeam.length === 0) {
      elements.gameStatus.textContent = 'Waiting for players in both teams';
      elements.gameStatus.className = 'alert alert-warning text-center mb-2';
    } else if (!room.redSpy || !room.blueSpy) {
      elements.gameStatus.textContent = 'Each team needs a spymaster to start';
      elements.gameStatus.className = 'alert alert-warning text-center mb-2';
    } else {
      elements.gameStatus.textContent = 'Ready to start game';
      elements.gameStatus.className = 'alert alert-success text-center mb-2';
    }
  }
}
