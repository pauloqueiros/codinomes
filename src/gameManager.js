const rooms = new Map();

// Adicionar io como parâmetro do módulo
let io;

// Inicialização do gestor do jogo
function initialize(socketIo) {
  io = socketIo;
  
  console.log("Game Manager initialized");
  
  // Limpeza periódica de salas vazias a cada hora
  setInterval(() => {
    let roomsRemoved = 0;
    
    for (const [roomId, room] of rooms.entries()) {
      if (room.players.length === 0) {
        rooms.delete(roomId);
        roomsRemoved++;
      }
    }
    
    if (roomsRemoved > 0) {
      console.log(`Cleaned up ${roomsRemoved} empty rooms. Total rooms: ${rooms.size}`);
    }
  }, 60 * 60 * 1000); // 1 hora
}

function createRoom(roomId, socket) {
  if (rooms.has(roomId)) {
    socket.emit('error', { message: 'Room already exists' });
    return;
  }
  
  // Get username from socket data or use default
  const username = socket.data.username || `Player-${socket.id.substr(0, 5)}`;
  
  // Determine first team (should be the team with 9 cards)
  const cardsDistribution = generateCards();
  const redCards = cardsDistribution.filter(card => card.team === 'red').length;
  const initialTurn = redCards === 9 ? 'red' : 'blue';
  
  const newRoom = {
    id: roomId,
    players: [{ id: socket.id, username, team: null, role: null }],
    gameState: 'waiting', // waiting, playing, ended
    cards: cardsDistribution,
    currentTurn: initialTurn, // The team with 9 cards goes first
    redTeam: [],
    blueTeam: [],
    redSpy: null,
    blueSpy: null,
    currentClue: null,
    clueHistory: [] // Store history of clues
  };
  
  rooms.set(roomId, newRoom);
  socket.join(roomId);
  socket.emit('room-created', { roomId });
  socket.emit('game-state', { room: newRoom });
}

function joinRoom(roomId, socket) {
  const room = rooms.get(roomId);
  
  if (!room) {
    socket.emit('error', { 
      message: 'Room does not exist', 
      type: 'room-not-found' 
    });
    return;
  }
  
  // Get username from socket data or use default
  const username = socket.data.username || `Player-${socket.id.substr(0, 5)}`;
  
  room.players.push({ id: socket.id, username, team: null, role: null });
  socket.join(roomId);
  socket.emit('room-joined', { roomId });
  
  // Broadcast updated state to all in room
  socket.to(roomId).emit('player-joined', { playerId: socket.id, username });
  socket.emit('game-state', { room });
}

function joinTeam(roomId, socket, team, role) {
  const room = rooms.get(roomId);
  
  if (!room) {
    socket.emit('error', { message: 'Room does not exist' });
    return;
  }
  
  // Encontrar jogador
  const player = room.players.find(p => p.id === socket.id);
  if (!player) {
    socket.emit('error', { message: 'Player not found in room' });
    return;
  }

  // Verificar se o jogador já é um spymaster (em qualquer equipe)
  if (player.role === 'spymaster') {
    socket.emit('error', { message: 'Spymasters cannot change teams' });
    return;
  }

  // Se o jogo já começou, apenas permitir entrar como operativo (não como spymaster)
  if (room.gameState === 'playing' && role === 'spymaster') {
    socket.emit('error', { message: 'Cannot join as spymaster after game has started' });
    return;
  }

  // Verificar se já existe um spymaster neste time
  if (role === 'spymaster') {
    if (team === 'red' && room.redSpy) {
      socket.emit('error', { message: 'Red team already has a spymaster' });
      return;
    }
    if (team === 'blue' && room.blueSpy) {
      socket.emit('error', { message: 'Blue team already has a spymaster' });
      return;
    }
  }

  // Remover jogador do time anterior
  if (player.team === 'red') {
    room.redTeam = room.redTeam.filter(p => p.id !== socket.id);
  } else if (player.team === 'blue') {
    room.blueTeam = room.blueTeam.filter(p => p.id !== socket.id);
  }

  // Atualizar jogador
  player.team = team;
  player.role = role;

  // Adicionar ao novo time
  if (team === 'red') {
    room.redTeam.push({ id: socket.id, username: player.username, role });
    if (role === 'spymaster') {
      room.redSpy = socket.id;
    }
  } else if (team === 'blue') {
    room.blueTeam.push({ id: socket.id, username: player.username, role });
    if (role === 'spymaster') {
      room.blueSpy = socket.id;
    }
  }

  // Se ambos os times têm spymaster e o jogo ainda não começou, iniciar o jogo automaticamente
  if (room.gameState !== 'playing' && room.redSpy && room.blueSpy) {
    startGame(roomId, socket);
  } else {
    // Broadcast do estado atualizado
    io.to(roomId).emit('game-state', { room });
  }
}

function startGame(roomId, socket) {
  const room = rooms.get(roomId);
  
  if (!room) {
    socket.emit('error', { message: 'Room does not exist' });
    return;
  }
  
  // Verificar se ambos os times têm pelo menos um jogador
  if (room.redTeam.length === 0 || room.blueTeam.length === 0) {
    socket.emit('error', { message: 'Both teams need at least one player' });
    return;
  }
  
  // Verificar se ambos os times têm um spymaster
  if (!room.redSpy || !room.blueSpy) {
    socket.emit('error', { message: 'Both teams need a spymaster' });
    return;
  }
  
  room.gameState = 'playing';
  
  // Notificar todos os jogadores
  io.to(roomId).emit('game-started');
  io.to(roomId).emit('game-state', { room });
}

function endTurn(roomId, socket) {
  const room = rooms.get(roomId);
  
  if (!room) {
    socket.emit('error', { message: 'Room does not exist' });
    return;
  }
  
  // Find player in the room
  const player = room.players.find(p => p.id === socket.id);
  if (!player) {
    socket.emit('error', { message: 'Player not found in room' });
    return;
  }
  
  // Check if it's player's team turn
  if (player.team !== room.currentTurn) {
    socket.emit('error', { message: 'Not your team\'s turn' });
    return;
  }
  
  // Check if player is operative
  if (player.role !== 'operative') {
    socket.emit('error', { message: 'Only operatives can end turn' });
    return;
  }
  
  // Não resetamos a dica aqui - ela permanece no objeto room.currentClue
  // Isso permite que continue no histórico, mas o frontend decidirá se deve mostrar ou não
  // baseado no turno atual
  
  // Switch turns
  room.currentTurn = room.currentTurn === 'red' ? 'blue' : 'red';
  
  console.log(`Turn switched to ${room.currentTurn}. Current clue remains in history.`);
  
  // Broadcast updated game state
  io.to(roomId).emit('game-state', { room });
}

function resetGame(roomId, socket) {
  const room = rooms.get(roomId);
  
  if (!room) {
    socket.emit('error', { message: 'Room does not exist' });
    return;
  }
  
  // Reset game state
  room.gameState = 'waiting';
  room.cards = generateCards();
  
  // Determine first team (should be the team with 9 cards)
  const redCards = room.cards.filter(card => card.team === 'red').length;
  room.currentTurn = redCards === 9 ? 'red' : 'blue';
  
  room.winner = null;
  room.currentClue = null;
  room.clueHistory = []; // Clear clue history
  
  // Reset spymaster roles but keep teams
  room.redSpy = null;
  room.blueSpy = null;
  
  // Reset player roles but keep them in teams
  for (const player of room.redTeam) {
    player.role = null;
  }
  
  for (const player of room.blueTeam) {
    player.role = null;
  }
  
  // Update all players in the room
  room.players.forEach(player => {
    // Find if player is in red or blue team and reset role
    if (room.redTeam.some(p => p.id === player.id)) {
      player.role = null;
      player.team = 'red';
    } else if (room.blueTeam.some(p => p.id === player.id)) {
      player.role = null;
      player.team = 'blue';
    } else {
      player.role = null;
      player.team = null;
    }
  });
  
  // Broadcast updated game state to all players
  io.to(roomId).emit('game-reset', { room });
  io.to(roomId).emit('game-state', { room });
}

// Nova função para lidar com retorno ao lobby (similar a resetGame mas limpa os times)
function returnToLobby(roomId, socket) {
  const room = rooms.get(roomId);
  
  if (!room) {
    socket.emit('error', { message: 'Room does not exist' });
    return;
  }
  
  // Reset game state
  room.gameState = 'waiting';
  room.cards = generateCards();
  
  // Determine first team (should be the team with 9 cards)
  const redCards = room.cards.filter(card => card.team === 'red').length;
  room.currentTurn = redCards === 9 ? 'red' : 'blue';
  
  room.winner = null;
  room.currentClue = null;
  room.clueHistory = []; // Clear clue history
  
  // Reset teams completely
  room.redTeam = [];
  room.blueTeam = [];
  room.redSpy = null;
  room.blueSpy = null;
  
  // Reset all player team and role assignments
  for (const player of room.players) {
    player.team = null;
    player.role = null;
  }
  
  // Broadcast updated game state to all players
  io.to(roomId).emit('return-to-lobby', { room });
  io.to(roomId).emit('game-state', { room });
}

function handleCardSelection(socket, cardIndex) {
  // Find which room this socket is in
  for (const [roomId, room] of rooms.entries()) {
    const player = room.players.find(p => p.id === socket.id);
    
    if (player) {
      console.log(`Player ${player.username} selected card ${cardIndex} in room ${roomId}`);
      
      // Check if valid move
      if (room.gameState !== 'playing') {
        console.log('Invalid move: Game is not in playing state');
        return;
      }
      
      if (player.team !== room.currentTurn) {
        console.log('Invalid move: Not this player\'s team turn');
        return;
      }
      
      if (!room.cards[cardIndex] || room.cards[cardIndex].revealed) {
        console.log('Invalid move: Card already revealed or does not exist');
        return;
      }
      
      // Reveal card
      room.cards[cardIndex].revealed = true;
      const cardTeam = room.cards[cardIndex].team;
      console.log(`Card ${cardIndex} revealed. Team: ${cardTeam}`);
      
      // Check game ending conditions with improved logging
      const gameEnded = checkGameEnd(room);
      console.log(`Game ended check: ${gameEnded}`);
      
      // Se o jogo não acabou, continuar normalmente
      if (!gameEnded) {
        // Switch turns if card doesn't belong to current team
        if (cardTeam !== room.currentTurn) {
          room.currentTurn = room.currentTurn === 'red' ? 'blue' : 'red';
          console.log(`Turn switched to: ${room.currentTurn}`);
        }
        
        // Broadcast updated state
        io.to(roomId).emit('game-state', { room });
      }
      
      break;
    }
  }
}

function handleDisconnect(socket) {
  for (const [roomId, room] of rooms.entries()) {
    const playerIndex = room.players.findIndex(p => p.id === socket.id);
    
    if (playerIndex !== -1) {
      const player = room.players[playerIndex];
      
      // Remove from teams if part of one
      if (player.team === 'red') {
        room.redTeam = room.redTeam.filter(p => p.id !== socket.id);
        if (room.redSpy === socket.id) {
          room.redSpy = null;
        }
      } else if (player.team === 'blue') {
        room.blueTeam = room.blueTeam.filter(p => p.id !== socket.id);
        if (room.blueSpy === socket.id) {
          room.blueSpy = null;
        }
      }
      
      // Remove player
      room.players.splice(playerIndex, 1);
      
      // If no players left, remove the room
      if (room.players.length === 0) {
        rooms.delete(roomId);
      } else {
        // Notify remaining players
        socket.to(roomId).emit('player-left', { playerId: socket.id });
        socket.to(roomId).emit('game-state', { room });
      }
      break;
    }
  }
}

function giveClue(roomId, socket, clue, number) {
  const room = rooms.get(roomId);
  
  if (!room) {
    socket.emit('error', { message: 'Room does not exist' });
    return;
  }
  
  // Find player in the room
  const player = room.players.find(p => p.id === socket.id);
  if (!player) {
    socket.emit('error', { message: 'Player not found in room' });
    return;
  }
  
  // Check if player is spymaster
  if (player.role !== 'spymaster') {
    socket.emit('error', { message: 'Only spymasters can give clues' });
    return;
  }
  
  // Check if it's player's team turn
  if (player.team !== room.currentTurn) {
    socket.emit('error', { message: 'Not your team\'s turn' });
    return;
  }
  
  // Set current clue
  const newClue = {
    word: clue,
    number: number,
    team: player.team,
    timestamp: new Date().toISOString()
  };
  
  room.currentClue = newClue;
  
  // Add to clue history
  room.clueHistory.push(newClue);
  
  // Broadcast updated game state
  io.to(roomId).emit('game-state', { room });
}

function generateCards() {
  // Generate cards with correct distribution according to official rules
  const cards = [];
  const teams = [
    // 9 red cards
    'red', 'red', 'red', 'red', 'red', 'red', 'red', 'red', 'red',
    // 8 blue cards
    'blue', 'blue', 'blue', 'blue', 'blue', 'blue', 'blue', 'blue',
    // 7 neutral cards
    'neutral', 'neutral', 'neutral', 'neutral', 'neutral', 'neutral', 'neutral',
    // 1 assassin card
    'assassin'
  ];
  
  // Shuffle teams
  for (let i = teams.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [teams[i], teams[j]] = [teams[j], teams[i]];
  }
  
  // Generate unique random numbers for images between 1-279
  const usedImageNumbers = new Set();
  function getUniqueRandomImage() {
    let imageId;
    do {
      imageId = Math.floor(Math.random() * 279) + 1; // 1-279 range
    } while (usedImageNumbers.has(imageId));
    usedImageNumbers.add(imageId);
    return imageId;
  }
  
  // Create a total of 25 cards (5x5 grid) as per official rules
  for (let i = 0; i < 25; i++) {
    cards.push({
      id: i,
      imageId: getUniqueRandomImage(),
      team: teams[i],
      revealed: false
    });
  }
  
  return cards;
}

function checkGameEnd(room) {
  // Check if assassin card was revealed
  const assassinRevealed = room.cards.find(card => card.team === 'assassin' && card.revealed);
  if (assassinRevealed) {
    // Set winner to opposite team of current turn
    room.winner = room.currentTurn === 'red' ? 'blue' : 'red';
    room.gameState = 'ended';
    
    console.log(`Game ended due to assassin card. Winner: ${room.winner}`);
    
    // Emitir mais informações de diagnóstico
    const roomData = {
      id: room.id,
      winner: room.winner,
      gameState: room.gameState,
      redTeamSize: room.redTeam.length,
      blueTeamSize: room.blueTeam.length
    };
    console.log('Room state at game end:', roomData);
    
    // Emitir estado do jogo para todos, com log claro
    console.log('Emitting game-state event for room', room.id);
    io.to(room.id).emit('game-state', { room });
    
    // Depois de um pequeno atraso, emitir o evento game-ended
    console.log('Scheduling game-ended event for room', room.id);
    setTimeout(() => {
      console.log('Emitting game-ended event for room', room.id);
      io.to(room.id).emit('game-ended', { 
        winner: room.winner,
        byAssassin: true,
        roomId: room.id // Adicionado o ID da sala para debug
      });
    }, 500);
    
    return true;
  }
  
  // Check if any team revealed all their cards
  const redCardsTotal = room.cards.filter(card => card.team === 'red').length;
  const blueCardsTotal = room.cards.filter(card => card.team === 'blue').length;
  const redCardsRevealed = room.cards.filter(card => card.team === 'red' && card.revealed).length;
  const blueCardsRevealed = room.cards.filter(card => card.team === 'blue' && card.revealed).length;
  
  // Update cards left in the room object for the UI
  room.cardsLeft = {
    red: redCardsTotal - redCardsRevealed,
    blue: blueCardsTotal - blueCardsRevealed
  };
  
  if (redCardsRevealed === redCardsTotal) {
    room.winner = 'red';
    room.gameState = 'ended';
    
    console.log(`Game ended due to all red cards revealed. Winner: ${room.winner}`);
    
    // Emitir explicitamente o estado do jogo para todos
    io.to(room.id).emit('game-state', { room });
    
    // Atrasar o envio do evento game-ended para garantir que o estado do jogo seja processado primeiro
    setTimeout(() => {
      io.to(room.id).emit('game-ended', { winner: 'red' });
    }, 500);
    
    return true;
  }
  
  if (blueCardsRevealed === blueCardsTotal) {
    room.winner = 'blue';
    room.gameState = 'ended';
    
    console.log(`Game ended due to all blue cards revealed. Winner: ${room.winner}`);
    
    // Emitir explicitamente o estado do jogo para todos
    io.to(room.id).emit('game-state', { room });
    
    // Atrasar o envio do evento game-ended para garantir que o estado do jogo seja processado primeiro
    setTimeout(() => {
      io.to(room.id).emit('game-ended', { winner: 'blue' });
    }, 500);
    
    return true;
  }
  
  return false;
}

function setUsername(socket, username) {
  // Store the username in the socket data
  socket.data.username = username || `Player-${socket.id.substr(0, 5)}`;
  
  // Update username in any rooms the player is in
  for (const [roomId, room] of rooms.entries()) {
    const player = room.players.find(p => p.id === socket.id);
    if (player) {
      player.username = socket.data.username;
      
      // Update in teams if applicable
      const redTeamPlayer = room.redTeam.find(p => p.id === socket.id);
      if (redTeamPlayer) {
        redTeamPlayer.username = socket.data.username;
      }
      
      const blueTeamPlayer = room.blueTeam.find(p => p.id === socket.id);
      if (blueTeamPlayer) {
        blueTeamPlayer.username = socket.data.username;
      }
      
      // Broadcast updated state to all in room
      socket.to(roomId).emit('game-state', { room });
      socket.emit('game-state', { room });
    }
  }
  
  return socket.data.username;
}

// Adicionar função para lidar com saída da sala
function leaveRoom(socket) {
    for (const [roomId, room] of rooms.entries()) {
        const playerIndex = room.players.findIndex(p => p.id === socket.id);
        if (playerIndex !== -1) {
            handlePlayerLeave(socket, room, roomId);
            break;
        }
    }
}

function handlePlayerLeave(socket, room, roomId) {
    const player = room.players.find(p => p.id === socket.id);
    if (player.team === 'red') {
        room.redTeam = room.redTeam.filter(p => p.id !== socket.id);
        if (room.redSpy === socket.id) room.redSpy = null;
    } else if (player.team === 'blue') {
        room.blueTeam = room.blueTeam.filter(p => p.id !== socket.id);
        if (room.blueSpy === socket.id) room.blueSpy = null;
    }
    
    room.players = room.players.filter(p => p.id !== socket.id);
    socket.leave(roomId);
    
    if (room.players.length === 0) {
        rooms.delete(roomId);
    } else {
        io.to(roomId).emit('game-state', { room });
    }
}

// Adicionar uma nova função para lidar com reconexões
function rejoinRoom(data, socket) {
  const { roomId, team, role } = data;
  const room = rooms.get(roomId);
  
  if (!room) {
    socket.emit('error', { 
      message: 'Room no longer exists', 
      type: 'room-not-found' 
    });
    return;
  }
  
  // Get username from socket data or use default
  const username = socket.data.username || `Player-${socket.id.substr(0, 5)}`;
  
  console.log(`Player ${username} (${socket.id}) attempting to rejoin room ${roomId} as ${team} ${role}`);
  
  // Adicionar jogador à sala
  let playerExists = false;
  
  // Procurar se o jogador já estava na sala pelo username
  for (let i = 0; i < room.players.length; i++) {
    if (room.players[i].username === username) {
      // Atualizar ID do jogador (o anterior foi desconectado)
      room.players[i].id = socket.id;
      console.log(`Player found and updated: ${username}`);
      playerExists = true;
      break;
    }
  }
  
  // Se o jogador não existia, adiciona-o
  if (!playerExists) {
    room.players.push({ id: socket.id, username, team, role });
    console.log(`New player added: ${username}`);
  }
  
  // Adicionar ao time correto ou atualizar
  if (team === 'red') {
    // Verificar se já existe no time
    const existingIndex = room.redTeam.findIndex(p => p.username === username);
    
    if (existingIndex === -1) {
      // Adicionar novo jogador
      room.redTeam.push({ id: socket.id, username, role });
    } else {
      // Atualizar ID do jogador existente
      room.redTeam[existingIndex].id = socket.id;
    }
    
    // Verificar se era spymaster
    if (role === 'spymaster') {
      room.redSpy = socket.id;
    }
  } else if (team === 'blue') {
    // Verificar se já existe no time
    const existingIndex = room.blueTeam.findIndex(p => p.username === username);
    
    if (existingIndex === -1) {
      // Adicionar novo jogador
      room.blueTeam.push({ id: socket.id, username, role });
    } else {
      // Atualizar ID do jogador existente
      room.blueTeam[existingIndex].id = socket.id;
    }
    
    // Verificar se era spymaster
    if (role === 'spymaster') {
      room.blueSpy = socket.id;
    }
  }
  
  // Juntar-se à sala
  socket.join(roomId);
  
  // Emitir evento de rejoin
  socket.emit('room-rejoined', { 
    roomId, 
    team,
    role
  });
  
  // Enviar estado do jogo para o jogador reconectado
  socket.emit('game-state', { room });
  
  // Notificar outros jogadores
  socket.to(roomId).emit('player-joined', { 
    playerId: socket.id,
    username,
    rejoined: true
  });
  
  console.log(`Player ${username} successfully rejoined room ${roomId}`);
}

module.exports = {
  initialize,
  createRoom,
  joinRoom,
  joinTeam,
  startGame,
  endTurn,
  resetGame,
  returnToLobby,  // Exportar nova função
  giveClue,
  handleCardSelection,
  handleDisconnect,
  setUsername,
  leaveRoom,
  rejoinRoom  // Exportar nova função
};
