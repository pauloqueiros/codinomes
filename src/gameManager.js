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
  
  // Reset current clue when turn ends
  room.currentClue = null;
  
  // Switch turns
  room.currentTurn = room.currentTurn === 'red' ? 'blue' : 'red';
  
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
  room.currentTurn = 'red';
  room.winner = null;
  room.currentClue = null;
  room.clueHistory = []; // Clear clue history
  
  // Keep teams but reset game-specific data
  
  // Broadcast updated game state
  socket.to(roomId).emit('game-state', { room });
  socket.emit('game-state', { room });
}

function handleCardSelection(socket, cardIndex) {
  // Find which room this socket is in
  for (const [roomId, room] of rooms.entries()) {
    const player = room.players.find(p => p.id === socket.id);
    
    if (player) {
      // Check if valid move
      if (room.gameState !== 'playing') return;
      if (player.team !== room.currentTurn) return;
      if (room.cards[cardIndex].revealed) return;
      
      // Reveal card
      room.cards[cardIndex].revealed = true;
      
      // Check game ending conditions
      checkGameEnd(room);
      
      // Switch turns if card doesn't belong to current team
      if (room.cards[cardIndex].team !== room.currentTurn) {
        room.currentTurn = room.currentTurn === 'red' ? 'blue' : 'red';
      }
      
      // Broadcast updated state
      socket.to(roomId).emit('game-state', { room });
      socket.emit('game-state', { room });
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
  const redCardsLeft = room.cards.filter(card => card.team === 'red' && !card.revealed).length;
  const blueCardsLeft = room.cards.filter(card => card.team === 'blue' && !card.revealed).length;
  const assassinRevealed = room.cards.find(card => card.team === 'assassin' && card.revealed);
  
  if (redCardsLeft === 0) {
    room.gameState = 'ended';
    room.winner = 'red';
  } else if (blueCardsLeft === 0) {
    room.gameState = 'ended';
    room.winner = 'blue';
  } else if (assassinRevealed) {
    room.gameState = 'ended';
    room.winner = room.currentTurn === 'red' ? 'blue' : 'red';
  }
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
  giveClue,
  handleCardSelection,
  handleDisconnect,
  setUsername,
  leaveRoom,
  rejoinRoom  // Exportar nova função
};
