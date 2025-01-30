export class Chatbot {
  constructor() {
    this.responses = {
      greeting: [
        "¡Hola! Soy el asistente de FinzApp. ¿En qué puedo ayudarte?",
        "¡Bienvenido! Estoy aquí para ayudarte con tus consultas sobre FinzApp."
      ],
      farewell: [
        "¡Hasta luego! No dudes en volver si necesitas ayuda.",
        "¡Gracias por chatear! Estoy aquí cuando me necesites."
      ],
      default: [
        "Entiendo tu consulta. Te sugiero revisar la sección correspondiente en el menú principal.",
        "Para ayudarte mejor, puedes explorar las diferentes funciones del sistema desde el menú.",
        "¿Has probado a revisar la sección específica para esto en el dashboard?"
      ],
      help: {
        gastos: "Para registrar gastos, ve a la sección 'Gastos' en el menú principal. Allí podrás agregar nuevos gastos y categorizarlos.",
        ingresos: "Los ingresos se registran en la sección 'Ingresos'. Puedes categorizarlos y llevar un registro detallado.",
        tarjetas: "Gestiona tus tarjetas en la sección 'Tarjetas'. Puedes agregar nuevas tarjetas y ver los gastos asociados.",
        vencimientos: "Revisa tus próximos vencimientos en la sección 'Vencimientos'. Te ayudará a mantener el control de tus pagos.",
        dashboard: "El Dashboard te muestra un resumen de tu situación financiera, incluyendo gastos, ingresos y próximos vencimientos."
      },
      vencimientos: {
        alert: "¡ATENCIÓN! Tienes vencimientos para hoy:",
        noVencimientos: "No tienes vencimientos programados para hoy."
      }
    };

    this.keywords = {
      gastos: ['gasto', 'gastar', 'compra', 'pago', 'factura'],
      ingresos: ['ingreso', 'cobro', 'sueldo', 'dinero', 'entrada'],
      tarjetas: ['tarjeta', 'credito', 'debito', 'visa', 'mastercard'],
      vencimientos: ['vencimiento', 'fecha', 'pagar', 'deuda', 'cuota'],
      dashboard: ['resumen', 'total', 'balance', 'estado', 'general']
    };

    this.createChatInterface();
    this.startVencimientosMonitor();
  }

  createChatInterface() {
    // Create chat button
    const chatButton = document.createElement('div');
    chatButton.className = 'chat-button';
    chatButton.innerHTML = `
      <div class="chat-icon">💬</div>
      <div class="chat-notification">1</div>
    `;
    document.body.appendChild(chatButton);

    // Create chat container
    const chatContainer = document.createElement('div');
    chatContainer.className = 'chat-container';
    chatContainer.innerHTML = `
      <div class="chat-header">
        <h3>FinzApp Assistant</h3>
        <button class="chat-close">&times;</button>
      </div>
      <div class="chat-messages"></div>
      <div class="chat-input-container">
        <input type="text" class="chat-input" placeholder="Escribe tu mensaje...">
        <button class="chat-send">Enviar</button>
      </div>
    `;
    document.body.appendChild(chatContainer);

    // Add event listeners
    chatButton.addEventListener('click', () => this.toggleChat());
    chatContainer.querySelector('.chat-close').addEventListener('click', () => this.toggleChat());
    
    const sendButton = chatContainer.querySelector('.chat-send');
    const input = chatContainer.querySelector('.chat-input');
    
    sendButton.addEventListener('click', () => this.handleUserInput(input));
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.handleUserInput(input);
      }
    });

    // Store references
    this.chatButton = chatButton;
    this.chatContainer = chatContainer;
    this.messagesContainer = chatContainer.querySelector('.chat-messages');

    // Show initial message
    setTimeout(() => {
      this.addMessage(this.getRandomResponse('greeting'), 'bot');
    }, 1000);
  }

  toggleChat() {
    this.chatContainer.classList.toggle('chat-open');
    this.chatButton.classList.toggle('chat-button-hidden');
    
    // Remove notification when opening chat
    if (this.chatContainer.classList.contains('chat-open')) {
      this.chatButton.querySelector('.chat-notification').style.display = 'none';
    }
  }

  handleUserInput(input) {
    const message = input.value.trim();
    if (message) {
      this.addMessage(message, 'user');
      input.value = '';
      
      // Process message and respond
      setTimeout(() => {
        const response = this.generateResponse(message);
        this.addMessage(response, 'bot');
      }, 500);
    }
  }

  addMessage(message, sender) {
    const messageElement = document.createElement('div');
    messageElement.className = `chat-message ${sender}-message`;
    messageElement.textContent = message;
    this.messagesContainer.appendChild(messageElement);
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
  }

  generateResponse(message) {
    const lowercaseMsg = message.toLowerCase();

    // Check for greetings
    if (this.isGreeting(lowercaseMsg)) {
      return this.getRandomResponse('greeting');
    }

    // Check for farewells
    if (this.isFarewell(lowercaseMsg)) {
      return this.getRandomResponse('farewell');
    }

    // Check for keywords and provide specific help
    for (const [category, keywords] of Object.entries(this.keywords)) {
      if (keywords.some(keyword => lowercaseMsg.includes(keyword))) {
        return this.responses.help[category];
      }
    }

    // Default response if no specific match
    return this.getRandomResponse('default');
  }

  isGreeting(message) {
    const greetings = ['hola', 'buenos días', 'buenas tardes', 'buenas noches', 'hi', 'hello'];
    return greetings.some(greeting => message.includes(greeting));
  }

  isFarewell(message) {
    const farewells = ['adiós', 'chau', 'bye', 'hasta luego', 'nos vemos'];
    return farewells.some(farewell => message.includes(farewell));
  }

  getRandomResponse(type) {
    const responses = this.responses[type];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  startVencimientosMonitor() {
    // Check vencimientos immediately and then every hour
    this.checkVencimientos();
    setInterval(() => this.checkVencimientos(), 1000 * 60 * 60);
  }

  async checkVencimientos() {
    const { getItems } = await import('./store.js');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check card payments
    const cards = getItems('CARDS').filter(card => card.tipo === 'credito');
    let hasVencimientos = false;
    let vencimientosMessage = this.responses.vencimientos.alert + "\n\n";

    cards.forEach(card => {
      const dueDate = new Date(today.getFullYear(), today.getMonth(), parseInt(card.fechaVencimiento));
      
      if (this.isSameDay(today, dueDate)) {
        const payments = this.getUpcomingPayments(card, dueDate, getItems);
        if (payments.length > 0) {
          hasVencimientos = true;
          const total = payments.reduce((sum, payment) => sum + payment.importeCuota, 0);
          vencimientosMessage += `📌 Tarjeta ${card.emisor} (*${card.numero.slice(-4)})\n`;
          vencimientosMessage += `   Total a pagar: ${this.formatCurrency(total)}\n\n`;
        }
      }
    });

    // Check scheduled expenses
    const expenses = getItems('EXPENSES');
    const todayExpenses = expenses.filter(expense => {
      const expenseDate = new Date(expense.fecha);
      expenseDate.setHours(0, 0, 0, 0);
      return this.isSameDay(expenseDate, today);
    });

    if (todayExpenses.length > 0) {
      hasVencimientos = true;
      vencimientosMessage += "🗓️ Gastos programados para hoy:\n";
      todayExpenses.forEach(expense => {
        vencimientosMessage += `   • ${expense.descripcion}: ${this.formatCurrency(expense.importe)}\n`;
      });
    }

    if (hasVencimientos) {
      this.openChatWithAlert(vencimientosMessage);
    }
  }

  getUpcomingPayments(card, nextPaymentDate, getItems) {
    const expenses = getItems('EXPENSES')
      .filter(expense => expense.tarjetaId === card.id && !expense.pagado);

    const upcomingPayments = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    expenses.forEach(expense => {
      const payments = this.getPaymentSchedule(expense, card);
      if (!payments) return;

      const nextPayment = payments.find(paymentDate => {
        return this.isSameDay(paymentDate, nextPaymentDate);
      });

      if (nextPayment) {
        const cuotaIndex = payments.indexOf(nextPayment);
        const importeCuota = expense.tipoPago === 'credito' ? 
          (expense.importe * (1 + (expense.interes||0)/100)) / expense.cuotas :
          expense.importe;

        upcomingPayments.push({
          descripcion: expense.descripcion,
          cuotaActual: cuotaIndex + 1,
          totalCuotas: expense.cuotas || 1,
          importeCuota
        });
      }
    });

    return upcomingPayments;
  }

  getPaymentSchedule(expense, card) {
    if (card.tipo === 'debito') return null;

    const purchaseDate = new Date(expense.fecha);
    const closingDay = parseInt(card.fechaCierre);
    const paymentDay = parseInt(card.fechaVencimiento);
    
    if (isNaN(closingDay) || isNaN(paymentDay)) return null;
    
    let closingDate = new Date(purchaseDate.getFullYear(), purchaseDate.getMonth(), closingDay);
    
    if (purchaseDate > closingDate) {
      closingDate.setMonth(closingDate.getMonth() + 1);
    }
    
    let firstPayment = new Date(closingDate.getFullYear(), closingDate.getMonth(), paymentDay);
    
    if (firstPayment < purchaseDate) {
      firstPayment.setMonth(firstPayment.getMonth() + 1);
    }
    
    const payments = [];
    const cuotas = expense.cuotas || 1;
    
    for(let i = 0; i < cuotas; i++) {
      const paymentDate = new Date(firstPayment);
      paymentDate.setMonth(paymentDate.getMonth() + i);
      payments.push(paymentDate);
    }
    
    return payments;
  }

  openChatWithAlert(message) {
    // Open chat if it's closed
    if (!this.chatContainer.classList.contains('chat-open')) {
      this.toggleChat();
    }

    // Add alert message
    this.addMessage(message, 'bot');

    // Show notification number on chat button if chat is closed
    if (!this.chatContainer.classList.contains('chat-open')) {
      const notification = this.chatButton.querySelector('.chat-notification');
      notification.style.display = 'block';
      notification.textContent = '1';
    }
  }

  isSameDay(date1, date2) {
    return date1.getDate() === date2.getDate() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear();
  }

  formatCurrency(amount) {
    return new Intl.NumberFormat('es-UY', {
      style: 'currency',
      currency: 'UYU'
    }).format(amount);
  }
}