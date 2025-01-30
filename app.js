import { initAuth } from './auth.js';
import { initRouter } from './router.js';
import { initStore } from './store.js';
import { showNotifications } from './notifications.js';
import { Chatbot } from './chatbot.js';

function initVersionHistory() {
  const history = JSON.parse(localStorage.getItem('finzapp_version_history') || '[]');
  
  // If there's no history at all, initialize with current version
  if (history.length === 0) {
    history.unshift({
      version: 'v7.8 (Beta)',
      notes: 'Sincronización de versiones y mejoras en el sistema de control de versiones',
      date: new Date().toISOString()
    });
    localStorage.setItem('finzapp_version_history', JSON.stringify(history));
  }

  // Update version display
  const versionDisplays = document.querySelectorAll('#current-version, #modal-current-version');
  versionDisplays.forEach(el => {
    if (el) {
      el.textContent = history[0].version;
    }
  });
}

function showPremiumBanner(operationCount) {
  const banner = document.createElement('div');
  banner.className = 'premium-banner alert alert-warning alert-dismissible fade show';
  banner.innerHTML = `
    <strong>¡Atención!</strong> Has usado ${operationCount}/30 operaciones gratuitas este mes.
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    <button class="btn btn-sm btn-primary ms-3" onclick="upgradeToPremium()">
      Actualizar a Premium
    </button>
  `;
  document.body.insertBefore(banner, document.body.firstChild);
}

window.upgradeToPremium = function() {
  window.location.href = 'login.html?upgrade=premium';
};

// Initialize app
document.addEventListener('DOMContentLoaded', async () => {
  // Initialize data store
  await initStore();
  
  // Initialize version history
  initVersionHistory();
  
  // Initialize authentication
  initAuth();
  
  // Initialize router
  initRouter();
  
  // Start notifications system
  showNotifications();
  
  // Initialize chatbot
  new Chatbot();

  // Show premium upgrade banner for free users
  const auth = JSON.parse(localStorage.getItem('finzapp_auth') || '{}');
  if (auth.type === 'free') {
    const operationCount = parseInt(localStorage.getItem(`finzapp_${auth.email}_operations`) || '0');
    if (operationCount >= 25) { 
      showPremiumBanner(operationCount);
    }
  }
});