# Codenames Pictures

Uma implementação web do popular jogo de tabuleiro "Codenames Pictures" usando Node.js e Socket.IO.

## Características Principais

- 🎮 Jogo em tempo real usando WebSocket
- 🎨 Interface moderna e responsiva
- 🌓 Tema escuro por padrão
- 📱 Layout adaptável para desktop e mobile
- 🔄 Atualizações em tempo real do estado do jogo
- 👥 Sistema de equipes dinâmico
- 🕵️ Roles específicos (Spymaster/Operativo)

## Como Jogar

1. Digite seu nome de usuário
2. Crie uma nova sala ou entre em uma existente
3. Escolha sua equipe (Vermelho ou Azul)
4. Se desejar ser Spymaster, clique no botão correspondente
   - O jogo começa automaticamente quando ambas as equipes têm um Spymaster
   - O Spymaster não pode trocar de função depois de escolhido
5. Spymasters dão dicas usando uma palavra e um número
6. Operativos tentam adivinhar as imagens de sua equipe baseados nas dicas

## Regras

- Tabuleiro 5x5 com distribuição de cartas:
  - 🔴 9 cartas vermelhas
  - 🔵 8 cartas azuis
  - ⚪ 7 cartas neutras
  - ⚫ 1 carta assassina
- Time vermelho (9 cartas) começa
- Spymaster pode ver todas as cores
- Acertar carta da equipe adversária passa a vez
- Revelar a carta assassina resulta em derrota imediata

## Tecnologias

- **Frontend:**
  - HTML5/CSS3
  - JavaScript (ES6+)
  - Bootstrap 5
  - Socket.IO Client

- **Backend:**
  - Node.js
  - Express
  - Socket.IO

## Setup Local

1. Clone o repositório:
```bash
git clone https://github.com/seu-usuario/codenames-pictures.git
```

2. Instale as dependências:
```bash
cd codenames-pictures
npm install
```

3. Inicie o servidor:
```bash
npm start
```

4. Acesse `http://localhost:3000` no navegador

## Estrutura do Projeto

```
codenames-pictures/
│
├── public/               # Static files
│   ├── css/              # Stylesheets
│   │   └── style.css
│   ├── js/               # Client-side JavaScript
│   │   └── app.js
│   └── index.html        # Main HTML file
│
├── src/                  # Server-side code
│   ├── index.js          # Entry point
│   └── gameManager.js    # Game logic
│
├── package.json          # Project dependencies
└── README.md             # Documentation
```

## Future Improvements

- User authentication
- Custom picture uploads
- Game history and statistics
- Mobile-responsive design
- Better error handling and reconnection logic
-------------------------------------------------------------------------------------
GitHub Copilot: Vou adicionar a documentação que criei ao README existente, traduzindo-a para Português do Brasil.

### [README.md](file:///c%3A/Users/paulo/workspace/code2/codenames-pictures/README.md)

```markdown
# Codenames Pictures

## Documentação do Sistema

### Visão Geral do Sistema

Codenames Pictures é uma adaptação digital do popular jogo de tabuleiro onde duas equipes competem para identificar os cartões de imagens de sua equipe com base em dicas dadas pelo espião-chefe (spymaster) da equipe. O sistema consiste em um backend Node.js usando Express e Socket.IO para comunicação em tempo real, e um frontend JavaScript vanilla para a interface do jogo.

### Arquitetura do Frontend

#### Componentes Principais

O frontend está organizado em arquivos JavaScript modulares que lidam com diferentes aspectos da aplicação:

- **app.js**: Ponto de entrada que inicializa o jogo e coordena os componentes
- **loadComponents.js**: Carrega dinamicamente os componentes HTML na página
- **modules/**: Diretório contendo módulos especializados:
  - **elementManager.js**: Gerencia referências aos elementos do DOM
  - **eventHandler.js**: Configura os listeners de eventos da UI
  - **gameState.js**: Gerencia o estado do jogo do lado do cliente
  - **notificationManager.js**: Lida com notificações na UI
  - **socketHandler.js**: Gerencia a comunicação Socket.IO
  - **uiManager.js**: Controla atualizações da UI e transições de tela
  - **urlManager.js**: Processa parâmetros de URL
  - **roomNameGenerator.js**: Gera nomes aleatórios para salas

#### Gerenciamento de Estado

O estado do jogo é mantido em `gameState.js` através do objeto `gameState`:

```javascript
export const gameState = {
  currentRoom: null,
  playerId: null,
  playerTeam: null,
  playerRole: null,
  isSpymaster: false,
  username: '',
  sessionId: null,
};
```

Este estado é persistido no localStorage para permitir a recuperação da sessão do jogo entre recarregamentos de página ou desconexões.

#### Fluxo da UI

A aplicação possui três telas principais:
1. **Tela de Boas-vindas**: Para criação de salas, entrada e configuração de nome de usuário
2. **Tela do Jogo**: Onde o jogo principal é jogado
3. **Tela Final**: Mostrada quando uma equipe vence

As transições de tela são gerenciadas pela função `showScreen()` em `uiManager.js`.

### Arquitetura do Backend

#### Estrutura do Servidor

- **index.js**: Ponto de entrada principal que configura o servidor Express e Socket.IO
- **gameManager.js**: Lógica principal do jogo para gerenciar salas, jogadores e estado do jogo

#### Gerenciamento do Jogo

O backend mantém o estado do jogo usando um Map de objetos de sala:

```javascript
const rooms = new Map();
```

Cada objeto de sala contém:
- ID da sala
- Listas de jogadores em cada equipe
- Estado atual do jogo
- Grade de cartões
- Informação do turno atual
- Referências aos espião-chefes
- Histórico de dicas

#### Eventos de Socket

A comunicação entre cliente e servidor acontece via eventos Socket.IO:

**Eventos do Servidor para o Cliente:**
- `room-created`: Sala foi criada
- `room-joined`: Jogador entrou na sala
- `room-rejoined`: Jogador reconectou-se a uma sessão anterior
- `player-joined`: Outro jogador entrou na sala
- `player-left`: Um jogador saiu da sala
- `game-state`: Estado atualizado do jogo
- `game-started`: O jogo começou
- `game-ended`: O jogo terminou
- `error`: Informação de erro

**Eventos do Cliente para o Servidor:**
- `create-room`: Criar uma nova sala
- `join-room`: Entrar em uma sala existente
- `join-team`: Entrar em uma equipe (vermelha/azul)
- `set-username`: Definir nome de usuário do jogador
- `start-game`: Iniciar o jogo
- `give-clue`: O espião-chefe fornece uma dica
- `select-card`: O operativo seleciona um cartão
- `end-turn`: Encerra o turno da equipe atual
- `reset-game`: Reinicia o jogo para começar uma nova rodada
- `leave-room`: Sair da sala atual

### Fluxo do Jogo

#### Criação e Entrada em Salas

1. **Criação de Sala**:
   - Cliente chama `createRoom()` via socket.emit('create-room')
   - Servidor gera ID único da sala e cria objeto de sala
   - Servidor emite evento 'room-created'
   - Cliente atualiza URL com ID da sala e exibe UI para entrada na sala

2. **Entrada na Sala**:
   - Cliente chama `joinRoom()` via socket.emit('join-room')
   - Servidor verifica existência da sala e adiciona jogador
   - Servidor emite 'room-joined' com dados da sala
   - Cliente atualiza UI para mostrar equipes e esperar início do jogo

3. **Recuperação de Sessão**:
   - Ao carregar a página, cliente tenta recuperar sessão do localStorage
   - Se a sessão existe, cliente chama `attemptReconnection()`
   - Servidor valida sessão e emite 'room-rejoined'
   - Cliente restaura estado anterior do jogo

#### Seleção de Equipe

1. Jogador entra em uma equipe clicando nos botões de equipe
2. Servidor adiciona jogador à equipe e atualiza todos os clientes
3. Jogadores podem trocar de equipe até o jogo começar
4. Um jogador por equipe se torna espião-chefe

#### Fases do Jogo

1. **Fase de Configuração**:
   - Equipes devem ter pelo menos um jogador cada
   - Cada equipe deve designar um espião-chefe
   - Qualquer jogador pode iniciar o jogo quando os requisitos forem atendidos

2. **Fase de Jogo**:
   - Jogo alterna entre equipes dando dicas e adivinhando
   - Espião-chefe dá uma dica e número via `giveClue()`
   - Operativos da equipe selecionam cartões via `handleCardSelection()`
   - Equipe pode encerrar turno antes via `endTurn()`
   - Turno muda automaticamente após selecionar cartão incorreto

3. **Fase Final**:
   - Jogo termina quando uma equipe revela todos os seus cartões
   - Jogo termina se o cartão assassino for revelado
   - Vencedor é mostrado na tela final

#### Fim de Jogo

1. Servidor verifica condições de vitória após cada seleção de cartão
2. Quando as condições são atendidas, servidor emite 'game-ended' com vencedor
3. Clientes transitam para tela final
4. Jogadores podem escolher jogar novamente ou retornar ao lobby

### Fluxos de Funções-Chave

#### Fluxo de Manipulação de Socket

1. Conexão de socket estabelecida em `app.js`
2. Manipuladores de socket configurados em `setupSocketHandlers()`
3. Eventos de socket acionam atualizações de estado e mudanças na UI
4. Lógica de reconexão tenta restaurar sessões ao carregar a página

```
Cliente Conecta → setupSocketHandlers() → socket.on(eventos) → atualizações de estado/UI
```

#### Fluxo de Atualização do Estado do Jogo

1. Servidor emite evento 'game-state' com dados atualizados da sala
2. Cliente recebe atualização em `socket.on('game-state')`
3. Cliente chama `updateGameState()` para processar dados
4. Com base no estado do jogo, funções apropriadas de atualização da UI são chamadas

```
Ação do Servidor → emit('game-state') → updateGameState() → updateGameBoard()/updateTeamPanels()/etc.
```

#### Fluxo de Atualização da UI

1. Evento do servidor aciona atualização de estado do cliente
2. Cliente chama `updateGameBoard()` para atualizar grade de cartões
3. Cliente chama `updateGameTeamPanels()` para atualizar UI da equipe
4. Cliente chama `updateGameControls()` para estado dos botões
5. Cliente chama `updateClueHistory()` para registro de dicas

### Persistência de Dados

#### Persistência do Lado do Cliente

O jogo usa localStorage para persistir dados da sessão:

```javascript
// Salvar sessão
function saveGameSession() {
  const sessionData = {
    currentRoom: gameState.currentRoom,
    playerTeam: gameState.playerTeam,
    playerRole: gameState.playerRole,
    username: gameState.username,
    timestamp: Date.now()
  };
  localStorage.setItem('codenames-session', JSON.stringify(sessionData));
}

// Carregar sessão
function loadGameSession() {
  const savedData = localStorage.getItem('codenames-session');
  if (savedData) {
    try {
      return JSON.parse(savedData);
    } catch (e) {
      console.error('Falha ao analisar sessão salva:', e);
      return null;
    }
  }
  return null;
}
```

#### Persistência do Lado do Servidor

O servidor mantém o estado do jogo em memória usando o Map de salas. Uma rotina de limpeza remove salas inativas:

```javascript
setInterval(() => {
  let roomsRemoved = 0;
  
  for (const [roomId, room] of rooms.entries()) {
    if (room.players.length === 0) {
      rooms.delete(roomId);
      roomsRemoved++;
    }
  }
  
  if (roomsRemoved > 0) {
    console.log(`Limpou ${roomsRemoved} salas vazias. Total de salas: ${rooms.size}`);
  }
}, 60 * 60 * 1000); // 1 hora
```

### Detalhes Técnicos

#### Estrutura do Cartão

Cada objeto de cartão contém:
- `imageId`: Identificador único para a imagem
- `team`: A equipe a que o cartão pertence ('red', 'blue', 'neutral', 'assassin')
- `revealed`: Booleano indicando se o cartão foi revelado

#### Estrutura da Sala

```javascript
{
  id: 'room-id',
  players: [], // Todos os jogadores
  redTeam: [], // Jogadores da equipe vermelha
  blueTeam: [], // Jogadores da equipe azul
  redSpy: null, // ID do socket do espião-chefe da equipe vermelha
  blueSpy: null, // ID do socket do espião-chefe da equipe azul
  gameState: 'waiting', // 'waiting', 'playing', 'ended'
  cards: [], // Array de objetos de cartão
  currentTurn: 'red', // Turno da equipe atual
  currentClue: null, // Objeto da dica atual
  clueHistory: [], // Array de dicas passadas
  winner: null, // Equipe vencedora
  startingTeam: 'red', // Equipe que começou o jogo
  cardsLeft: {red: 0, blue: 0} // Cartões restantes para cada equipe
}
```

#### Estrutura do Jogador

```javascript
{
  id: 'socket-id',
  username: 'player-name',
  team: 'red', // ou 'blue'
  role: 'operative' // ou 'spymaster'
}
```

#### Sistema de Notificação

O aplicativo usa um sistema de notificação personalizado (`notificationManager.js`) em vez de alertas do navegador:

```javascript
export const notify = {
  success: (message, title = 'Sucesso', duration = 5000) => {
    showNotification({ type: 'success', title, message, duration });
  },
  error: (message, title = 'Erro', duration = 5000) => {
    showNotification({ type: 'error', title, message, duration });
  },
  // Mais tipos de notificação...
};
```

#### Gerenciamento de URL

O gerenciador de URL lida com compartilhamento e parâmetros:

```javascript
// Gerar URL para compartilhamento
export function generateShareableUrl(roomId) {
  const url = new URL(window.location.href);
  url.search = `?room=${roomId}`;
  return url.toString();
}

// Analisar parâmetros de URL
export function parseUrlParams() {
  const params = {};
  const searchParams = new URLSearchParams(window.location.search);
  
  for (const [key, value] of searchParams) {
    params[key] = value;
  }
  
  return params;
}
```

## Fluxograma de Chamadas de Função

Abaixo está um fluxograma simplificado das principais chamadas de função durante ações típicas do jogo:

```
1. Inicialização do Jogo
   app.js:initializeGame()
   ├── loadComponents.js:initializeComponents()
   ├── elementManager.js:getElements()
   ├── socket = io()
   ├── socketHandler.js:setupSocketHandlers(socket, elements, screens)
   │   └── socket.on('connect') → attemptReconnection()
   └── eventHandler.js:setupEventListeners(elements, screens)

2. Criação de Sala
   eventHandler.js: handler de clique createRoomBtn
   ├── generateRoomName()
   ├── socket.emit('create-room')
   ├── urlManager.js:updateUrlWithRoom()
   └── SERVIDOR: gameManager.js:createRoom()
       └── socket.emit('room-created')
           └── showShareNotification()

3. Entrada em Sala
   eventHandler.js: joinRoom()
   ├── socket.emit('join-room')
   ├── urlManager.js:updateUrlWithRoom()
   └── SERVIDOR: gameManager.js:joinRoom()
       └── socket.emit('room-joined')
           └── updateTeamPanels()

4. Seleção de Equipe
   eventHandler.js: handlers de clique de botão de equipe
   ├── socket.emit('join-team')
   └── SERVIDOR: gameManager.js:joinTeam()
       └── socket.emit('game-state')
           └── updateGameState()
               └── updateTeamPanels()

5. Início do Jogo
   eventHandler.js: handler de clique startGameBtn
   ├── socket.emit('start-game')
   └── SERVIDOR: gameManager.js:startGame()
       ├── generateCards()
       └── socket.emit('game-started')
           └── socket.emit('game-state')
               └── updateGameState()
                   └── updateGameBoard()

6. Fornecendo Dica (Espião-Chefe)
   eventHandler.js: handler de clique submitClueBtn
   ├── socket.emit('give-clue')
   └── SERVIDOR: gameManager.js:giveClue()
       └── socket.emit('game-state')
           └── updateGameState()
               ├── updateGameBoard()
               └── updateClueHistory()

7. Seleção de Cartão (Operativo)
   uiManager.js:updateGameBoard() → handler de clique de cartão
   ├── socket.emit('select-card')
   └── SERVIDOR: gameManager.js:handleCardSelection()
       ├── checkGameEnd()
       └── SE jogo terminou:
           └── socket.emit('game-ended')
               └── updateEndScreen()
           SENÃO:
           └── socket.emit('game-state')
               └── updateGameState()
                   └── updateGameBoard()

8. Encerrar Turno
   eventHandler.js: handler de clique endTurnBtn
   ├── socket.emit('end-turn')
   └── SERVIDOR: gameManager.js:endTurn()
       └── socket.emit('game-state')
           └── updateGameState()
               └── updateGameBoard()

9. Recuperação de Sessão
   socketHandler.js:attemptReconnection()
   ├── loadGameSession()
   ├── socket.emit('rejoin-room')
   └── SERVIDOR: gameManager.js:rejoinRoom()
       ├── socket.emit('room-rejoined')
       └── socket.emit('game-state')
           └── updateGameState()
```
```