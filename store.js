// Data store using localStorage with user-specific prefixes
const BASE_STORE_KEYS = {
  USERS: 'USERS',
  CARDS: 'CARDS', 
  EXPENSES: 'EXPENSES',
  INCOME: 'INCOME',
  CATEGORIES: 'CATEGORIES',
  CARD_TYPES: 'CARD_TYPES'
};

function getUserId() {
  const auth = JSON.parse(localStorage.getItem('finzapp_auth') || '{}');
  return auth.email || 'default';
}

function getUserKey(baseKey) {
  return `finzapp_${getUserId()}_${baseKey}`;
}

export async function initStore() {
  const userId = getUserId();
  
  // Check if this is first time initialization for this user
  const userInitKey = `finzapp_${userId}_initialized`;
  if (!localStorage.getItem(userInitKey)) {
    // Initialize default data structures for new user
    initializeCategories();
    initializeCardTypes();
    
    // Initialize empty collections
    localStorage.setItem(getUserKey(BASE_STORE_KEYS.USERS), '[]');
    localStorage.setItem(getUserKey(BASE_STORE_KEYS.CARDS), '[]');
    localStorage.setItem(getUserKey(BASE_STORE_KEYS.EXPENSES), '[]');
    localStorage.setItem(getUserKey(BASE_STORE_KEYS.INCOME), '[]');
    
    // Mark user as initialized
    localStorage.setItem(userInitKey, 'true');
  }
}

function initializeCategories() {
  const categories = {
    income: {
      sueldo: ["mensual", "extra"],
      jubilacion: ["mensual", "adelanto"],
      ventas: [],
      aguinaldo: [],
      comisiones: [],
      banco: [],
      billetera: []
    },
    expense: {
      hogar: ["alquiler", "mantenimiento"],
      alimentacion: ["supermercado", "frutas y verduras", "restaurantes"],
      transporte: ["combustible", "peajes", "reparaciones"],
      entretenimiento: ["cine", "conciertos"],
      salud: ["medicinas", "consultas"],
      otros: ["donaciones", "imprevistos"],
      debito_automatico: ["luz", "agua", "telefono", "internet"],
      pago_tarjetas: ["visa", "mastercard", "amex"]
    }
  };
  
  localStorage.setItem(getUserKey(BASE_STORE_KEYS.CATEGORIES), JSON.stringify(categories));
}

function initializeCardTypes() {
  const cardTypes = {
    credito: {
      anda: "Anda",
      bbva_amex: "BBVA American Express",
      bbva_master: "BBVA Mastercard",
      bbva_visa: "BBVA Visa",
      brou_cabal: "BROU Cabal",
      brou_master: "BROU Mastercard",
      brou_visa: "BROU Visa",
      creditel: "Creditel",
      credito_casa: "Credito de la Casa",
      credito_directo: "Credito Directo",
      itau_amex: "ITAU American Express",
      itau_master: "ITAU Mastercard",
      itau_visa: "ITAU Visa",
      oca: "OCA",
      oca_master: "OCA Mastercard",
      oca_visa: "OCA Visa",
      santander_amex: "Santander American Express",
      santander_master: "Santander Mastercard",
      santander_visa: "Santander Visa",
      otras_credito: "OTRAS"
    },
    debito: {
      brou_cabal_deb: "BROU Cabal Débito",
      brou_master_deb: "BROU Mastercard Débito",
      brou_visa_deb: "BROU Visa Débito",
      itau_master_deb: "Itau Mastercard Débito",
      itau_visa_deb: "ITAU Visa Débito",
      santander_master_deb: "Santander Mastercard Débito",
      santander_visa_deb: "Santander Visa Débito",
      otras_debito: "OTRAS Débito"
    }
  };
  
  localStorage.setItem(getUserKey(BASE_STORE_KEYS.CARD_TYPES), JSON.stringify(cardTypes));
}

// Generic CRUD operations with user-specific keys
export function getItems(key) {
  return JSON.parse(localStorage.getItem(getUserKey(key)) || '[]');
}

export function setItems(key, items) {
  localStorage.setItem(getUserKey(key), JSON.stringify(items));
}

export function incrementOperationCount() {
  const auth = JSON.parse(localStorage.getItem('finzapp_auth') || '{}');
  if (!auth.email) return false;

  const operationKey = `finzapp_${auth.email}_operations`;
  const currentCount = parseInt(localStorage.getItem(operationKey) || '0');
  
  // Check if user has reached free limit
  if (auth.type === 'free' && currentCount >= 30) {
    alert('Has alcanzado el límite de operaciones para usuarios Free. Actualiza a Premium para continuar.');
    return false;
  }
  
  localStorage.setItem(operationKey, currentCount + 1);
  return true;
}

export function addItem(key, item) {
  if (!incrementOperationCount()) return null;
  
  const items = getItems(key);
  items.push({...item, id: Date.now()});
  setItems(key, items);
  return item;
}

export function updateItem(key, id, updates) {
  if (!incrementOperationCount()) return null;
  
  const items = getItems(key);
  const index = items.findIndex(item => item.id === id);
  if (index !== -1) {
    items[index] = {...items[index], ...updates};
    setItems(key, items);
    return items[index];
  }
  return null;
}

export function deleteItem(key, id) {
  if (!incrementOperationCount()) return;
  
  const items = getItems(key);
  const filtered = items.filter(item => item.id !== id);
  setItems(key, filtered);
}

// Get categories and card types from user-specific storage
export function getCategories() {
  return JSON.parse(localStorage.getItem(getUserKey(BASE_STORE_KEYS.CATEGORIES)));
}

export function getCardTypes() {
  return JSON.parse(localStorage.getItem(getUserKey(BASE_STORE_KEYS.CARD_TYPES)));
}

// Add new function to manage categories
export function addSubcategory(type, category, subcategory) {
  const categories = getCategories();
  
  if (!categories[type] || !categories[type][category]) {
    return false;
  }
  
  // Check if subcategory already exists
  if (!categories[type][category].includes(subcategory)) {
    categories[type][category].push(subcategory);
    localStorage.setItem(getUserKey(BASE_STORE_KEYS.CATEGORIES), JSON.stringify(categories));
    return true;
  }
  
  return false;
}