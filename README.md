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

## Funcionamento do Jogo

### Inicialização e Configuração

1. **Inicialização do Servidor**
   - O servidor é iniciado em `src/index.js`
   - Express configura o servidor HTTP
   - Socket.IO é configurado para conexões em tempo real

2. **Gerenciamento de Estado**
   - `src/gameManager.js` mantém o estado global do jogo
   - Estados das salas são armazenados em um Map
   - Cada sala possui seu próprio estado de jogo independente

3. **Conexão de Jogadores**
   - Quando um jogador se conecta, um evento `connection` é disparado
   - O cliente envia um evento `joinRoom` com nome de usuário e sala
   - O servidor valida e adiciona o jogador à sala especificada

### Geração e Estrutura do Jogo

1. **Criação do Tabuleiro**
   - Função `createGame()` gera um novo estado de jogo
   - 25 cartas são selecionadas aleatoriamente do conjunto de imagens
   - Distribuição das cartas: 9 vermelhas, 8 azuis, 7 neutras, 1 assassina

2. **Estrutura do Estado do Jogo**
   ```javascript
   {
     board: [Array de 25 objetos de carta],
     currentTeam: 'red',  // Time que começa (sempre vermelho)
     redCards: 9,         // Cartas restantes do time vermelho
     blueCards: 8,        // Cartas restantes do time azul
     winner: null,        // Equipe vencedora (null até o fim do jogo)
     gameStarted: false,  // Indica se o jogo começou
     teams: {
       red: { spymaster: null, operatives: [] },
       blue: { spymaster: null, operatives: [] }
     }
   }
   ```

### Fluxo do Jogo

1. **Início da Partida**
   - O jogo inicia automaticamente quando ambos os times têm um Spymaster
   - Função `startGame()` é chamada para finalizar a preparação
   - Time vermelho sempre começa (possui uma carta a mais)

2. **Mecânica de Turnos**
   - Spymaster fornece uma dica via chat ou verbalmente
   - Função `makeGuess(roomId, cardIndex, team)` processa tentativas
   - `checkGameEnd()` é chamada após cada jogada para verificar condições de vitória

3. **Processamento de Jogadas**
   - Quando um operativo clica em uma carta:
     - Se a carta pertence ao time atual: continua jogando
     - Se a carta é neutra: passa a vez
     - Se a carta é do time adversário: passa a vez e reduz contador do adversário
     - Se a carta é assassina: time atual perde imediatamente

4. **Sincronização em Tempo Real**
   - Após cada ação, o servidor emite um evento `gameStateUpdate`
   - Todos os clientes na sala recebem o estado atualizado
   - Interface é renderizada de acordo com o papel do jogador (Spymaster/Operativo)

5. **Fim de Jogo**
   - Jogo termina quando todas as cartas de um time são reveladas
   - Jogo termina imediatamente se a carta assassina for revelada
   - Evento `gameOver` notifica todos os jogadores do resultado

### Sistema de Salas

1. **Gestão de Salas**
   - Função `createRoom(roomId)` inicializa uma nova sala
   - Cada sala mantém seu próprio estado de jogo
   - Jogadores podem entrar/sair sem afetar outras salas

2. **Ciclo de Vida da Sala**
   - Sala é criada quando primeiro jogador entra
   - Sala é destruída quando o último jogador sai
   - Função `resetGame(roomId)` permite reiniciar uma partida


### Diretivas de implementação.

Para evitar que alterações quebrem funcionalidades já implementadas, siga estas diretrizes:

1 - Preservar funcionalidades existentes
  Ao modificar uma função, sempre verificar onde ela já é usada.
  Se precisar alterar uma função utilizada em várias partes do código, criar uma versão nova ao invés de modificar a original diretamente.

2 - Seguir a estrutura do código
  Toda a lógica do jogo deve ficar no gameManager.js.
  A comunicação via WebSockets deve ficar isolada no socketHandler.js.
  Funções genéricas ou de utilidade devem estar no utils.js.

3 - Manter a compatibilidade entre cliente e servidor
  Alterações no formato das mensagens WebSocket devem ser refletidas nos dois lados.
  Se adicionar novos eventos WebSocket, garantir que o cliente e o servidor os tratem corretamente.
  Não modificar eventos existentes sem validar seu impacto no fluxo atual do jogo.

4 - Escrever código modular e reutilizável
  Evitar alterar grandes blocos de código diretamente. Em vez disso, criar pequenas funções reutilizáveis.
  Evitar duplicação de código extraindo lógicas comuns para utils.js.

5 - Garantir que o fluxo do jogo não seja interrompido
  Antes de modificar regras do jogo, verificar o impacto na experiência do jogador.
  Se uma funcionalidade estiver funcionando corretamente, evitar alterações desnecessárias.

6 - Evitar que eventos WebSocket fiquem descontrolados
  Sempre remover listeners desnecessários ao desconectar um jogador.
  Garantir que eventos como on('disconnect') e on('reconnect') estejam funcionando corretamente.
  Documentar novas funções e variáveis importantes
  Se adicionar uma nova função, incluir um comentário explicando o que ela faz.

7 - Evitar mudanças no comportamento de funções já testadas
  Se for necessário refatorar código existente, garantir que o comportamento final permaneça o mesmo.
  Se uma função já validada for modificada, rodar testes antes de confirmar a alteração.