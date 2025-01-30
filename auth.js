const AUTH_KEY = 'finzapp_auth';
const EMOJIS = ['😊', '🌟', '🚀', '🎯', '💫', '🌈', '🎨', '🎭', '🎪', '🎡', '🎢', '🎠', '🎮', '🎲', '🎰', '🎳', '🎯', '🎱', '🎤', '🎧'];

export function initAuth() {
  // Initialize version history if not exists
  const history = JSON.parse(localStorage.getItem('finzapp_version_history') || '[]');
  if (history.length === 0) {
    history.push({
      version: 'v7.8 (Beta)',
      notes: 'Sincronización de versiones y mejoras en el sistema de control de versiones',
      date: new Date().toISOString()
    });
    localStorage.setItem('finzapp_version_history', JSON.stringify(history));
  }

  checkAuth();
  setupAuthListeners();
  updateUserDisplay();
  updateAdminAccess(); 
}

function checkAuth() {
  const auth = localStorage.getItem(AUTH_KEY);
  if (!auth && !window.location.pathname.includes('login.html')) {
    window.location.href = 'login.html';
  }
}

function setupAuthListeners() {
  const logoutBtn = document.getElementById('btn-logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem(AUTH_KEY);
      window.location.href = 'login.html';
    });
  }
}

export function verifyAdminKey(key) {
  // For beta testing, hardcode admin key
  return key === '123456';
}

export async function login(email, password) {
  const users = JSON.parse(localStorage.getItem('finzapp_users') || '[]');
  let user = users.find(u => u.email === email);
  
  // Check if user is accessing premium from beta testing
  const isPremiumBeta = sessionStorage.getItem('premium_beta') === 'true';
  
  if (!user) {
    // Create new user with selected version
    user = {
      email,
      emoji: '😊',
      name: email.split('@')[0],
      type: isPremiumBeta ? 'premium' : 'free',
      createdAt: new Date().toISOString(),
      premiumActive: isPremiumBeta
    };
    users.push(user);
    localStorage.setItem('finzapp_users', JSON.stringify(users));
  } else if (isPremiumBeta && user.type === 'free') {
    // Upgrade existing free user to premium if they chose premium in beta
    user.type = 'premium';
    user.premiumActive = true;
    localStorage.setItem('finzapp_users', JSON.stringify(users));
  }
  
  // Store auth and redirect directly to system
  localStorage.setItem('finzapp_auth', JSON.stringify(user));
  
  // Clear premium beta flag after storing it in user data
  sessionStorage.removeItem('premium_beta');
  
  // Redirect to main system
  window.location.href = 'index.html';
}

export function register(userData) {
  const users = JSON.parse(localStorage.getItem('finzapp_users') || '[]');
  
  userData.type = 'free';
  userData.emoji = userData.emoji || '😊';
  
  users.push(userData);
  localStorage.setItem('finzapp_users', JSON.stringify(users));
  localStorage.setItem(AUTH_KEY, JSON.stringify(userData));
  window.location.href = 'index.html';
}

function updateUserDisplay() {
  const userDisplay = document.getElementById('user-display');
  if (userDisplay) {
    const auth = JSON.parse(localStorage.getItem(AUTH_KEY) || '{}');
    userDisplay.innerHTML = `
      <div class="user-info" onclick="showUserProfileModal()">
        <span class="user-emoji">${auth.emoji || '😊'}</span>
        <span class="user-name">${auth.name || auth.email?.split('@')[0]}</span>
      </div>
    `;
  }
}

function updateAdminAccess() {
  const auth = JSON.parse(localStorage.getItem(AUTH_KEY) || '{}');
  const adminContainer = document.getElementById('admin-access-container');
  
  if (adminContainer) {
    if (auth.type === 'admin') {
      adminContainer.innerHTML = `
        <a href="admin.html" class="nav-link">Panel Admin</a>
      `;
    } else {
      adminContainer.innerHTML = '';
    }
  }
}

export function updateUserData(email, updates) {
  const users = JSON.parse(localStorage.getItem('finzapp_users') || '[]');
  const userIndex = users.findIndex(u => u.email === email);
  
  if (userIndex !== -1) {
    users[userIndex] = {...users[userIndex], ...updates};
    localStorage.setItem('finzapp_users', JSON.stringify(users));
    
    // Update current auth if this is the logged-in user
    const auth = JSON.parse(localStorage.getItem('finzapp_auth') || '{}');
    if (auth.email === email) {
      Object.assign(auth, updates);
      localStorage.setItem('finzapp_auth', JSON.stringify(auth));
    }
    
    return true;
  }
  
  return false;
}