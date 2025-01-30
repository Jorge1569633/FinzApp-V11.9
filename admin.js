export class AdminPanel {
  constructor() {
    // Load saved prices or use defaults
    const savedPrices = JSON.parse(localStorage.getItem('finzapp_prices') || 'null');
    this.prices = savedPrices || {
      PREMIUM_MONTHLY: 500,
      PREMIUM_YEARLY: 5000
    };
    
    this.userTypes = {
      ADMIN: 'admin',
      FREE: 'free',
      PREMIUM: 'premium'
    };

    // Add currencies config
    const savedCurrencies = JSON.parse(localStorage.getItem('finzapp_currencies') || 'null');
    this.currencies = savedCurrencies || {
      primary: 'UYU',
      secondary: 'USD' 
    };

    this.availableCurrencies = {
      UYU: {
        name: 'Peso Uruguayo',
        symbol: '$',
        code: 'UYU'
      },
      ARS: {
        name: 'Peso Argentino', 
        symbol: 'ARS$',
        code: 'ARS'
      },
      USD: {
        name: 'Dólar',
        symbol: 'US$', 
        code: 'USD'
      },
      BRL: {
        name: 'Real',
        symbol: 'R$',
        code: 'BRL' 
      },
      EUR: {
        name: 'Euro',
        symbol: '€',
        code: 'EUR'
      },
      PYG: {
        name: 'Guaraní',
        symbol: '₲',
        code: 'PYG'
      }
    };

    // Add exchange rates
    this.updateExchangeRates();

    // Add contact monitoring
    this.startContactMonitor();

    this.initializeContactSystem();
    
    // Add reply modal to DOM
    this.addReplyModal();
  }

  async updateExchangeRates() {
    try {
      // Fetch latest rates from API
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
      const data = await response.json();
      
      // Store rates in localStorage
      localStorage.setItem('finzapp_exchange_rates', JSON.stringify({
        rates: data.rates,
        lastUpdate: new Date().toISOString()
      }));
    } catch (error) {
      console.error('Error updating exchange rates:', error);
    }
  }

  getExchangeRates() {
    return JSON.parse(localStorage.getItem('finzapp_exchange_rates') || '{}');
  }

  updateCurrencies(primary, secondary) {
    if (primary === secondary) {
      throw new Error('Las monedas primaria y secundaria deben ser diferentes');
    }

    this.currencies = { primary, secondary };
    localStorage.setItem('finzapp_currencies', JSON.stringify(this.currencies));

    // No page reload needed
    return true; 
  }

  initializeContactSystem() {
    // Setup contact alert checking
  }

  startContactMonitor() {
    this.checkNewContacts();
    // Check every minute
    setInterval(() => this.checkNewContacts(), 60000);
  }

  checkNewContacts() {
    const contacts = JSON.parse(localStorage.getItem('finzapp_contacts') || '[]');
    const unreplied = contacts.filter(c => !c.replied);
    
    if (unreplied.length > 0) {
      // Only show alert if not already showing contacts section
      const contactSection = document.getElementById('contact-section');
      if (!contactSection || !contactSection.innerHTML) {
        this.showContactAlert(unreplied.length);
      }
    }
  }

  showContactAlert(count) {
    const existingAlert = document.querySelector('.contact-alert');
    if (existingAlert) {
      existingAlert.remove();
    }

    const alertDiv = document.createElement('div');
    alertDiv.className = 'contact-alert';
    alertDiv.innerHTML = `
      <div class="alert alert-warning alert-dismissible fade show" role="alert">
        <strong>¡Nuevas consultas!</strong> 
        Tiene ${count} consultas de usuarios sin responder.
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        <button class="btn btn-primary btn-sm ms-3" onclick="showContactList()">
          Ver Consultas
        </button>
      </div>
    `;
    
    const container = document.querySelector('.admin-container');
    if (container.firstChild) {
      container.insertBefore(alertDiv, container.firstChild);
    } else {
      container.appendChild(alertDiv);
    }
  }

  loadContactSection() {
    // First, make sure contact section exists
    let contactSection = document.getElementById('contact-section');
    if (!contactSection) {
      contactSection = document.createElement('div');
      contactSection.id = 'contact-section';
      document.querySelector('.admin-container').appendChild(contactSection);
    }

    const contacts = JSON.parse(localStorage.getItem('finzapp_contacts') || '[]')
      .sort((a, b) => new Date(b.date) - new Date(a.date)); // Sort by date, newest first

    if (!contacts.length) {
      contactSection.innerHTML = '<p>No hay consultas registradas</p>';
      return;
    }

    contactSection.innerHTML = `
      <div class="card">
        <div class="card-body">
          <h5>Consultas de Usuarios</h5>
          <div class="table-responsive">
            <table class="table">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Fecha</th>
                  <th>Mensaje</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                ${contacts.map(contact => `
                  <tr class="${contact.replied ? '' : 'table-warning'}">
                    <td>${contact.userName} (${contact.userEmail})</td>
                    <td>${new Date(contact.date).toLocaleString()}</td>
                    <td>${contact.message}</td>
                    <td>
                      <span class="badge ${contact.replied ? 'bg-success' : 'bg-warning'}">
                        ${contact.replied ? 'Respondido' : 'Pendiente'}
                      </span>
                    </td>
                    <td>
                      ${!contact.replied ? `
                        <button class="btn btn-sm btn-primary" 
                                onclick="showReplyModal(${contact.id})">
                          Responder
                        </button>
                      ` : `
                        <div>
                          <strong>Respuesta:</strong><br>
                          ${contact.response}
                        </div>
                      `}
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    // Remove any existing alert since we're now showing the contacts
    const existingAlert = document.querySelector('.contact-alert');
    if (existingAlert) {
      existingAlert.remove();
    }
  }

  async loadUsers() {
    const users = this.getAllUsers();
    const container = document.getElementById('users-container');
    
    if (!users.length) {
      container.innerHTML = '<p>No hay usuarios registrados</p>';
      return;
    }

    container.innerHTML = `
      <div class="table-responsive">
        <table class="table">
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Email</th>
              <th>Tipo</th>
              <th>Operaciones</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            ${users.map(user => `
              <tr>
                <td>
                  ${user.emoji} ${user.name}
                  ${user.type === 'admin' ? '<span class="badge bg-danger">Admin</span>' : ''}
                </td>
                <td>${user.email}</td>
                <td>
                  <select class="form-select user-type-select" data-user-email="${user.email}">
                    <option value="free" ${user.type === 'free' ? 'selected' : ''}>Free</option>
                    <option value="premium" ${user.type === 'premium' ? 'selected' : ''}>Premium</option>
                    ${user.type === 'admin' ? `
                      <option value="admin" selected>Admin</option>
                    ` : ''}
                  </select>
                </td>
                <td>${this.getOperationCount(user.email)} / ${user.type === 'free' ? '30' : '∞'}</td>
                <td>
                  ${user.type === 'premium' ? 
                    (user.premiumActive ? 
                      '<span class="badge bg-success">Activo</span>' : 
                      '<span class="badge bg-warning">Pendiente Pago</span>'
                    ) : 
                    (this.getOperationCount(user.email) >= 30 ? 
                      '<span class="badge bg-danger">Límite Alcanzado</span>' : 
                      '<span class="badge bg-info">Demo</span>'
                    )
                  }
                </td>
                <td>
                  <button class="btn btn-sm btn-primary" onclick="window.sendPaymentRequest('${user.email}')">
                    Enviar Solicitud
                  </button>
                  <button class="btn btn-sm btn-success" onclick="window.activatePremium('${user.email}')">
                    Activar Premium
                  </button>
                  ${user.type !== 'admin' ? `
                    <button class="btn btn-sm btn-danger" onclick="window.deleteUser('${user.email}')">
                      Eliminar
                    </button>
                  ` : ''}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <!-- Payment Settings -->
      <div class="card mt-4">
        <div class="card-body">
          <h5>Configuración de Pagos</h5>
          <form id="payment-settings-form">
            <div class="row">
              <div class="col-md-6">
                <div class="mb-3">
                  <label>Precio Mensual Premium</label>
                  <div class="input-group">
                    <span class="input-group-text">$</span>
                    <input type="number" class="form-control" id="premium-monthly" 
                           value="${this.prices.PREMIUM_MONTHLY}" min="0" step="0.01">
                  </div>
                </div>
              </div>
              <div class="col-md-6">
                <div class="mb-3">
                  <label>Precio Anual Premium</label>
                  <div class="input-group">
                    <span class="input-group-text">$</span>
                    <input type="number" class="form-control" id="premium-yearly" 
                           value="${this.prices.PREMIUM_YEARLY}" min="0" step="0.01">
                  </div>
                </div>
              </div>
            </div>
            <button type="submit" class="btn btn-primary">Guardar Precios</button>
          </form>
        </div>
      </div>
    `;

    container.innerHTML += `
      <!-- Currency Management -->
      <div class="card mt-4">
        <div class="card-body">
          <h5>Configuración de Monedas</h5>
          
          <div class="row mb-3">
            <div class="col-md-5">
              <label>Moneda Principal</label>
              <select class="form-select" id="primary-currency">
                ${Object.entries(this.availableCurrencies).map(([code, curr]) => `
                  <option value="${code}" ${this.currencies.primary === code ? 'selected' : ''}>
                    ${curr.name} (${curr.symbol})
                  </option>
                `).join('')}
              </select>
            </div>
            
            <div class="col-md-5">
              <label>Moneda Secundaria</label>
              <select class="form-select" id="secondary-currency">
                ${Object.entries(this.availableCurrencies).map(([code, curr]) => `
                  <option value="${code}" ${this.currencies.secondary === code ? 'selected' : ''}>
                    ${curr.name} (${curr.symbol})
                  </option>
                `).join('')}
              </select>
            </div>
            
            <div class="col-md-2">
              <label>&nbsp;</label>
              <button class="btn btn-primary w-100" onclick="window.showExchangeRatesModal()">
                Cotizaciones
              </button>
            </div>
          </div>

          <button class="btn btn-primary" onclick="window.saveCurrencySettings()">
            Guardar Configuración
          </button>
        </div>
      </div>

      <!-- Exchange Rates Modal -->
      <div class="modal fade" id="exchangeRatesModal" tabindex="-1">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Cotizaciones</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <div class="d-flex justify-content-between mb-3">
                <h6>Última actualización: <span id="last-update"></span></h6>
                <button class="btn btn-sm btn-primary" onclick="window.updateRates()">
                  Actualizar
                </button>
              </div>
              <div id="exchange-rates"></div>
            </div>
          </div>
        </div>
      </div>
    `;

    this.setupEventListeners();
  }

  setupEventListeners() {
    // User type change listener
    document.querySelectorAll('.user-type-select').forEach(select => {
      select.addEventListener('change', (e) => {
        const email = e.target.dataset.userEmail;
        const newType = e.target.value;
        this.updateUserType(email, newType);
      });
    });

    // Payment settings form
    document.getElementById('payment-settings-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.updatePrices();
    });

    // Currency selects change handler
    document.querySelectorAll('#primary-currency, #secondary-currency').forEach(select => {
      select.addEventListener('change', () => {
        const primary = document.getElementById('primary-currency').value;
        const secondary = document.getElementById('secondary-currency').value;
        
        if (primary === secondary) {
          alert('Las monedas primaria y secundaria deben ser diferentes');
          select.value = this.currencies[select.id.split('-')[0]];
        }
      });
    });
  }

  getAllUsers() {
    return JSON.parse(localStorage.getItem('finzapp_users') || '[]');
  }

  getOperationCount(email) {
    const operationKey = `finzapp_${email}_operations`;
    return parseInt(localStorage.getItem(operationKey) || '0');
  }

  updateUserType(email, newType) {
    const users = this.getAllUsers();
    const userIndex = users.findIndex(u => u.email === email);
    
    if (userIndex !== -1) {
      users[userIndex].type = newType;
      if (newType === 'premium') {
        users[userIndex].premiumActive = false; // Requires payment activation
      }
      localStorage.setItem('finzapp_users', JSON.stringify(users));
      this.loadUsers(); // Refresh display
    }
  }

  updatePrices() {
    const monthlyPrice = parseFloat(document.getElementById('premium-monthly').value);
    const yearlyPrice = parseFloat(document.getElementById('premium-yearly').value);
    
    if (isNaN(monthlyPrice) || isNaN(yearlyPrice)) {
      alert('Por favor ingrese valores numéricos válidos');
      return false;
    }

    if (monthlyPrice <= 0 || yearlyPrice <= 0) {
      alert('Los precios deben ser mayores a 0');
      return false;
    }
    
    this.prices = {
      PREMIUM_MONTHLY: monthlyPrice,
      PREMIUM_YEARLY: yearlyPrice
    };
    
    // Save prices to localStorage
    localStorage.setItem('finzapp_prices', JSON.stringify(this.prices));
    
    // Show success message
    alert('Precios actualizados correctamente');
    return true;
  }

  async sendPaymentEmail(userEmail, paymentType) {
    const user = this.getAllUsers().find(u => u.email === userEmail);
    if (!user) return;

    const amount = paymentType === 'monthly' ? 
      this.prices.PREMIUM_MONTHLY : 
      this.prices.PREMIUM_YEARLY;

    const templateParams = {
      to_email: userEmail,
      user_name: user.name,
      payment_amount: amount,
      payment_type: paymentType,
      payment_link: `https://finzapp.com/payment?user=${userEmail}&type=${paymentType}`,
      app_name: 'FinzApp'
    };

    try {
      await emailjs.send(
        'YOUR_SERVICE_ID',
        'YOUR_TEMPLATE_ID',
        templateParams
      );
      alert(`Solicitud de pago enviada a ${userEmail}`);
    } catch (error) {
      console.error('Error enviando email:', error);
      alert('Error al enviar la solicitud de pago');
    }
  }

  static async sendAdminAccessEmail(email) {
    const templateParams = {
      to_email: email,
      access_key: 'finzapp-admin-2023', 
      app_name: 'FinzApp',
      admin_url: window.location.origin + '/admin.html'
    };

    try {
      await emailjs.send(
        'YOUR_SERVICE_ID',
        'ADMIN_ACCESS_TEMPLATE_ID',
        templateParams
      );
      return true;
    } catch (error) {
      console.error('Admin key email error:', error);
      return false;
    }
  }

  static async init() {
    const auth = JSON.parse(localStorage.getItem('finzapp_auth') || '{}');
    if (auth.type !== 'admin') {
      window.location.href = 'index.html';
      return;
    }
    
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
    
    const adminPanel = new AdminPanel();
    await adminPanel.loadUsers();
  }

  addReplyModal() {
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.id = 'replyModal';
    modal.innerHTML = `
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Responder Consulta</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <div id="originalMessage" class="mb-3 p-3 bg-light rounded"></div>
            <form id="replyForm">
              <div class="form-group">
                <label>Respuesta</label>
                <textarea class="form-control" id="replyMessage" rows="4" required></textarea>
              </div>
              <input type="hidden" id="contactId">
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
              Cancelar
            </button>
            <button type="button" class="btn btn-primary" onclick="sendReply()">
              Enviar Respuesta
            </button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }
}

// Global functions for buttons
window.sendPaymentRequest = function(email) {
  const paymentType = prompt('Tipo de pago (monthly/yearly):');
  if (paymentType && ['monthly', 'yearly'].includes(paymentType)) {
    new AdminPanel().sendPaymentEmail(email, paymentType);
  }
};

window.activatePremium = function(email) {
  const users = JSON.parse(localStorage.getItem('finzapp_users') || '[]');
  const userIndex = users.findIndex(u => u.email === email);
  
  if (userIndex !== -1) {
    users[userIndex].premiumActive = true;
    localStorage.setItem('finzapp_users', JSON.stringify(users));
    new AdminPanel().loadUsers();
    alert('Usuario Premium activado correctamente');
  }
};

window.deleteUser = function(email) {
  if (!confirm('¿Está seguro de eliminar este usuario?')) return;
  
  const users = JSON.parse(localStorage.getItem('finzapp_users') || '[]');
  const updatedUsers = users.filter(u => u.email !== email);
  localStorage.setItem('finzapp_users', JSON.stringify(updatedUsers));
  
  // Remove user-specific data
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith(`finzapp_${email}_`)) {
      localStorage.removeItem(key);
    }
  });
  
  new AdminPanel().loadUsers();
};

window.saveCurrencySettings = async function() {
  const primary = document.getElementById('primary-currency').value;
  const secondary = document.getElementById('secondary-currency').value;
  
  try {
    const admin = new AdminPanel();
    admin.updateCurrencies(primary, secondary);
    
    // Show success message
    alert('Configuración de monedas actualizada');
    
    // Hide any open modals
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
      bootstrap.Modal.getInstance(modal)?.hide();
    });
    
    // No need to redirect - just reload panel
    admin.loadUsers();
  } catch (error) {
    alert(error.message);
  }
};

window.showExchangeRatesModal = function() {
  const admin = new AdminPanel();
  const rates = admin.getExchangeRates();
  
  const container = document.getElementById('exchange-rates');
  const lastUpdate = document.getElementById('last-update');
  
  if (rates.lastUpdate) {
    lastUpdate.textContent = new Date(rates.lastUpdate).toLocaleString('es-UY');
  }
  
  if (rates.rates) {
    container.innerHTML = `
      <div class="table-responsive">
        <table class="table">
          <thead>
            <tr>
              <th>Moneda</th>
              <th>Compra</th>
              <th>Venta</th>
            </tr>
          </thead>
          <tbody>
            ${Object.entries(admin.availableCurrencies).map(([code, curr]) => {
              const rate = rates.rates[code];
              if (!rate) return ''; // Skip if no rate available
              return `
                <tr>
                  <td>${curr.name} (${curr.symbol})</td>
                  <td>${(rate * 0.97).toFixed(4)}</td>
                  <td>${(rate * 1.03).toFixed(4)}</td>
                </tr>
              `;
            }).filter(row => row).join('')}
          </tbody>
        </table>
      </div>
    `;
  } else {
    container.innerHTML = '<p>No hay datos de cotización disponibles</p>';
  }

  // Store reference to modal
  const modal = new bootstrap.Modal(document.getElementById('exchangeRatesModal'));
  
  // Add event listener for when modal is hidden
  document.getElementById('exchangeRatesModal').addEventListener('hidden.bs.modal', function () {
    // Clean up after modal is hidden
    container.innerHTML = '';
    if (lastUpdate) lastUpdate.textContent = '';
  }, { once: true }); // Use once:true so event listener is automatically removed after first use
  
  modal.show();
};

window.updateRates = async function() {
  try {
    const admin = new AdminPanel();
    await admin.updateExchangeRates();
    window.showExchangeRatesModal(); // Refresh modal
  } catch (error) {
    console.error('Error updating rates:', error);
    alert('Error al actualizar las cotizaciones. Por favor intente nuevamente.');
  }
};

window.showContactList = function() {
  const admin = new AdminPanel();
  admin.loadContactSection();
};

window.showReplyModal = function(contactId) {
  const contacts = JSON.parse(localStorage.getItem('finzapp_contacts') || '[]');
  const contact = contacts.find(c => c.id === contactId);
  
  if (!contact) return;
  
  document.getElementById('originalMessage').innerHTML = `
    <strong>Consulta de ${contact.userName}:</strong><br>
    ${contact.message}
  `;
  document.getElementById('contactId').value = contactId;
  document.getElementById('replyMessage').value = '';
  
  new bootstrap.Modal(document.getElementById('replyModal')).show();
};

window.sendReply = function() {
  const contactId = parseInt(document.getElementById('contactId').value);
  const response = document.getElementById('replyMessage').value;
  const auth = JSON.parse(localStorage.getItem('finzapp_auth') || '{}');
  
  if (!response.trim()) {
    alert('Por favor ingrese una respuesta');
    return;
  }
  
  const contacts = JSON.parse(localStorage.getItem('finzapp_contacts') || '[]');
  const contactIndex = contacts.findIndex(c => c.id === contactId);
  
  if (contactIndex !== -1) {
    contacts[contactIndex].replied = true;
    contacts[contactIndex].response = response;
    contacts[contactIndex].replyDate = new Date().toISOString();
    contacts[contactIndex].adminEmail = auth.email; // Add admin email
    
    localStorage.setItem('finzapp_contacts', JSON.stringify(contacts));
    
    // Close modal
    bootstrap.Modal.getInstance(document.getElementById('replyModal')).hide();
    
    // Refresh contacts display
    new AdminPanel().loadContactSection();
    
    // Show success message
    alert('Respuesta enviada correctamente');
  }
};