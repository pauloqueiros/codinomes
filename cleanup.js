const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Lista de arquivos e diretórios Angular a remover
const angularFiles = [
  'angular.json',
  'tsconfig.json',
  'tsconfig.app.json',
  'tsconfig.spec.json',
  'karma.conf.js',
  '.browserslistrc',
  'src/app',
  'src/environments',
  'src/assets',
  'src/main.ts',
  'src/polyfills.ts',
  'src/styles.scss',
  'e2e'
];

// Função para remover arquivo ou diretório
function remove(filePath) {
  const fullPath = path.join(__dirname, filePath);
  
  try {
    if (fs.existsSync(fullPath)) {
      const stats = fs.statSync(fullPath);
      
      if (stats.isDirectory()) {
        console.log(`Removendo diretório: ${filePath}`);
        // Para diretórios, usamos fs.rmdirSync com {recursive: true}
        // ou a função execSync para usar comandos do sistema
        if (process.platform === 'win32') {
          execSync(`rmdir /s /q "${fullPath}"`);
        } else {
          execSync(`rm -rf "${fullPath}"`);
        }
      } else {
        console.log(`Removendo arquivo: ${filePath}`);
        fs.unlinkSync(fullPath);
      }
    } else {
      console.log(`Nada para remover: ${filePath} (não existe)`);
    }
  } catch (err) {
    console.error(`Erro ao remover ${filePath}:`, err);
  }
}

// Limpar arquivos Angular
console.log("Iniciando limpeza de arquivos Angular...");
angularFiles.forEach(remove);
console.log("Limpeza concluída!");

console.log("\nProjeto atualizado para conter apenas os arquivos necessários do Node.js/Express.");
console.log("Estrutura atual do projeto:");
console.log(`
codenames-pictures/
│
├── public/               # Arquivos estáticos
│   ├── css/              # Folhas de estilo
│   │   └── style.css
│   ├── js/               # JavaScript do cliente
│   │   └── app.js
│   └── index.html        # Arquivo HTML principal
│
├── src/                  # Código do servidor
│   ├── index.js          # Ponto de entrada
│   └── gameManager.js    # Lógica do jogo
│
├── package.json          # Dependências do projeto
└── README.md             # Documentação
`);
