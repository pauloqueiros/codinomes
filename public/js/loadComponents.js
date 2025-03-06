async function loadComponent(elementId, componentPath, replacements = {}) {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`Element with id "${elementId}" not found`);
    }

    const response = await fetch(`components/${componentPath}`);
    if (!response.ok) {
      throw new Error(`Failed to load ${componentPath}: ${response.statusText}`);
    }

    let html = await response.text();
    
    // Replace any placeholders with actual values
    Object.keys(replacements).forEach(key => {
      const regex = new RegExp(`%${key}%`, 'g');
      html = html.replace(regex, replacements[key]);
    });
    
    element.innerHTML = html;
  } catch (error) {
    console.error(`Error loading component ${componentPath}:`, error);
  }
}

async function initializeComponents() {
  try {
    // Carregar componentes em ordem específica
    await loadComponent('welcome-screen-container', 'welcome-screen.html');
    
    // Carregar componentes do jogo
    const gameComponents = await Promise.all([
      loadComponent('red-team-container', 'team-panel.html', {
        TEAM: 'red',
        TEAM_NAME: 'Red',
        COLOR: 'danger',
        ICON: 'fire' // Adicionando o ícone correto
      }),
      loadComponent('game-center', 'game-board.html'),
      loadComponent('blue-team-container', 'team-panel.html', {
        TEAM: 'blue',
        TEAM_NAME: 'Blue',
        COLOR: 'primary',
        ICON: 'water' // Adicionando o ícone correto
      })
    ]);
    
    // Carregar tela final
    await loadComponent('end-screen-container', 'end-screen.html');
    
    console.log('All components loaded successfully');
    return true;
  } catch (error) {
    console.error('Error initializing components:', error);
    return false;
  }
}
