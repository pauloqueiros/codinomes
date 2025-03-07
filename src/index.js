const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const gameManager = require('./gameManager');
const { TIMES } = require('./constants');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Inicializar gameManager com io
gameManager.initialize(io);

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, '../public')));

// Definir tipo MIME para arquivos .js e definir cabeçalhos CORS
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

// Rotas
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Gerenciamento de conexão Socket.io
io.on('connection', (socket) => {
  console.log('Usuário conectado:', socket.id);
  
  // Lidar com definição de nome de usuário
  socket.on('set-username', (username) => {
    const setName = gameManager.setUsername(socket, username);
    socket.emit('username-set', { username: setName });
  });
  
  // Lidar com criação de sala
  socket.on('create-room', (roomId) => {
    gameManager.createRoom(roomId, socket);
  });
  
  // Lidar com entrada em sala
  socket.on('join-room', (roomId) => {
    gameManager.joinRoom(roomId, socket);
  });
  
  // Nova função para reconectar a uma sala
  socket.on('rejoin-room', (data) => {
    gameManager.rejoinRoom(data, socket);
  });
  
  // Lidar com entrada em equipe
  socket.on('join-team', (data) => {
    gameManager.joinTeam(data.room, socket, data.team, data.role);
  });
  
  // Lidar com início do jogo
  socket.on('start-game', (data) => {
    gameManager.startGame(data.room, socket);
  });
  
  // Lidar com dicas do mestre-espião
  socket.on('give-clue', (data) => {
    gameManager.giveClue(data.room, socket, data.clue, data.number);
  });
  
  // Lidar com fim de turno
  socket.on('end-turn', (data) => {
    gameManager.endTurn(data.room, socket);
  });
  
  // Lidar com jogar novamente
  socket.on('play-again', (data) => {
    gameManager.resetGame(data.room, socket);
  });
  
  // Lidar com retorno ao lobby
  socket.on('return-to-lobby', (data) => {
    gameManager.returnToLobby(data.room, socket);
  });
  
  // Lidar com seleção de carta
  socket.on('select-card', (cardIndex) => {
    gameManager.handleCardSelection(socket, cardIndex);
  });
  
  // Adicionar novo evento socket
  socket.on('leave-room', (data) => {
    gameManager.leaveRoom(socket);
  });
  
  // Lidar com reinicialização do jogo
  socket.on('reset-game', (data) => {
    gameManager.resetGame(data.room, socket);
  });
  
  // Lidar com desconexão
  socket.on('disconnect', () => {
    console.log('Usuário desconectado:', socket.id);
    gameManager.handleDisconnect(socket);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
