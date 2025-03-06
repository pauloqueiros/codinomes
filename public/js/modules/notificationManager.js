/**
 * Sistema de gerenciamento de notificações
 * Substitui os alertas padrão do navegador por notificações personalizadas
 */

// Cria o container de notificações se ele ainda não existir
function createNotificationContainer() {
  let container = document.getElementById('notification-container');
  
  if (!container) {
    container = document.createElement('div');
    container.id = 'notification-container';
    container.className = 'notification-container';
    document.body.appendChild(container);
  }
  
  return container;
}

/**
 * Exibe uma notificação na tela
 * @param {Object} options - Configurações da notificação
 * @param {string} options.type - Tipo da notificação: 'success', 'error', 'info', 'warning'
 * @param {string} options.title - Título da notificação
 * @param {string} options.message - Mensagem da notificação
 * @param {number} options.duration - Duração em ms (padrão: 5000ms)
 */
export function showNotification(options) {
  const container = createNotificationContainer();
  
  // Configurações padrão
  const settings = {
    type: 'info',
    title: '',
    message: '',
    duration: 5000,
    ...options
  };
  
  // Criar elemento de notificação
  const notification = document.createElement('div');
  notification.className = `notification ${settings.type}`;
  
  // Definir ícone com base no tipo
  let icon = 'info-circle';
  if (settings.type === 'success') icon = 'check-circle';
  if (settings.type === 'error') icon = 'exclamation-circle';
  if (settings.type === 'warning') icon = 'exclamation-triangle';
  
  // Criar conteúdo HTML
  notification.innerHTML = `
    <div class="notification-icon">
      <i class="fas fa-${icon}"></i>
    </div>
    <div class="notification-content">
      ${settings.title ? `<div class="notification-title">${settings.title}</div>` : ''}
      <div class="notification-message">${settings.message}</div>
    </div>
    <button class="notification-close">
      <i class="fas fa-times"></i>
    </button>
  `;
  
  // Adicionar ao container
  container.appendChild(notification);
  
  // Garantir que a animação seja executada
  setTimeout(() => {
    notification.style.opacity = 1;
    notification.style.transform = 'translateY(0)';
  }, 10);
  
  // Configurar botão de fechar
  const closeBtn = notification.querySelector('.notification-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      removeNotification(notification);
    });
  }
  
  // Auto remover após duração especificada
  if (settings.duration > 0) {
    setTimeout(() => {
      removeNotification(notification);
    }, settings.duration);
  }
  
  // Retorna o elemento para permitir manipulação adicional
  return notification;
}

/**
 * Remove uma notificação com animação
 * @param {HTMLElement} notification - O elemento de notificação
 */
function removeNotification(notification) {
  notification.classList.add('removing');
  
  // Esperar a animação terminar antes de remover do DOM
  setTimeout(() => {
    notification.remove();
    
    // Se não houver mais notificações, remover o container
    const container = document.getElementById('notification-container');
    if (container && !container.children.length) {
      container.remove();
    }
  }, 500); // 500ms é a duração da animação de saída
}

/**
 * Funções de conveniência para tipos específicos de notificação
 */
export const notify = {
  success: (message, title = 'Success', duration = 5000) => {
    return showNotification({ type: 'success', title, message, duration });
  },
  
  error: (message, title = 'Error', duration = 5000) => {
    return showNotification({ type: 'error', title, message, duration });
  },
  
  info: (message, title = 'Information', duration = 5000) => {
    return showNotification({ type: 'info', title, message, duration });
  },
  
  warning: (message, title = 'Warning', duration = 5000) => {
    return showNotification({ type: 'warning', title, message, duration });
  }
};
