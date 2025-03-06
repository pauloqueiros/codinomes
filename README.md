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
