const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const gameManager = require('./gameManager');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Inicializar gameManager com io
gameManager.initialize(io);

// Serve static files
app.use(express.static(path.join(__dirname, '../public')));

// Set MIME type for .js files and define CORS headers
app.use((req, res, next) => {
  if (req.url.endsWith('.js')) {
    res.type('application/javascript');
  } else if (req.url.endsWith('.jpg') || req.url.endsWith('.jpeg')) {
    res.type('image/jpeg');
  } else if (req.url.endsWith('.png')) {
    res.type('image/png');
  }
  
  // Adicionar headers CORS para permitir acesso a recursos externos
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  
  next();
});

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  // Handle username setting
  socket.on('set-username', (username) => {
    const sanitizedUsername = typeof username === 'string' ? 
        username.trim().substring(0, 15) : // Limit length and trim if it's a string
        `Player_${socket.id.substr(0, 5)}`; // Fallback if username is not a string
    const setName = gameManager.setUsername(socket, sanitizedUsername);
    socket.emit('username-set', { username: setName });
  });
  
  // Handle room creation
  socket.on('create-room', (roomId) => {
    gameManager.createRoom(roomId, socket);
  });
  
  // Handle room joining
  socket.on('join-room', (roomId) => {
    gameManager.joinRoom(roomId, socket);
  });
  
  // Nova função para reconectar a uma sala
  socket.on('rejoin-room', (data) => {
    gameManager.rejoinRoom(data, socket);
  });
  
  // Handle team joining
  socket.on('join-team', (data) => {
    gameManager.joinTeam(data.room, socket, data.team, data.role);
  });
  
  // Handle game start
  socket.on('start-game', (data) => {
    gameManager.startGame(data.room, socket);
  });
  
  // Handle clues from spymaster
  socket.on('give-clue', (data) => {
    gameManager.giveClue(data.room, socket, data.clue, data.number);
  });
  
  // Handle end turn
  socket.on('end-turn', (data) => {
    gameManager.endTurn(data.room, socket);
  });
  
  // Handle play again
  socket.on('play-again', (data) => {
    gameManager.resetGame(data.room, socket);
  });
  
  // Handle return to lobby
  socket.on('return-to-lobby', (data) => {
    gameManager.returnToLobby(data.room, socket);
  });
  
  // Handle card selection
  socket.on('select-card', (cardIndex) => {
    gameManager.handleCardSelection(socket, cardIndex);
  });
  
  // Adicionar novo evento socket
  socket.on('leave-room', (data) => {
    gameManager.leaveRoom(socket);
  });
  
  // Handle reset game
  socket.on('reset-game', (data) => {
    gameManager.resetGame(data.room, socket);
  });
  
  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    gameManager.handleDisconnect(socket);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
