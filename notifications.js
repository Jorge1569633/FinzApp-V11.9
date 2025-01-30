// Constants for notification settings
const NOTIFICATION_SETTINGS = {
  API_BASE_URL: 'http://localhost:3000/api',
  EMAIL_SERVICE_URL: 'https://api.emailjs.com/api/v1.0/email/send', // Example using EmailJS
  EMAIL_SERVICE_ID: 'your_service_id',
  EMAIL_TEMPLATE_ID: 'your_template_id',
  EMAIL_USER_ID: 'your_user_id'
};

export function showNotifications() {
  checkVencimientos();
  setInterval(checkVencimientos, 1000 * 60 * 60); // Check every hour
}

function checkVencimientos() {
  // Get cards and expenses
  const cards = JSON.parse(localStorage.getItem('finzapp_cards') || '[]');
  const expenses = JSON.parse(localStorage.getItem('finzapp_expenses') || '[]');
  const auth = JSON.parse(localStorage.getItem('finzapp_auth') || '{}');
  
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  // Reset time parts to compare dates properly
  today.setHours(0, 0, 0, 0);
  tomorrow.setHours(0, 0, 0, 0);
  yesterday.setHours(0, 0, 0, 0);
  
  // Check card payments
  cards.forEach(card => {
    if (card.tipo === 'credito') {
      const paymentDate = new Date();
      paymentDate.setDate(card.fechaPago);
      paymentDate.setHours(0, 0, 0, 0);
      
      // Only notify if it's one day before payment
      if (isSameDay(paymentDate, tomorrow)) {
        const message = `Vencimiento tarjeta ${card.emisor} (*${card.numero.slice(-4)}) mañana`;
        notifyAll(message, auth.email);
      }
    }
  });
  
  // Check future expenses
  expenses.forEach(expense => {
    const expenseDate = new Date(expense.fecha);
    expenseDate.setHours(0, 0, 0, 0);
    
    // Only notify if it's one day before expense
    if (isSameDay(expenseDate, tomorrow)) {
      const message = `Gasto programado: ${expense.descripcion} para mañana`;
      notifyAll(message, auth.email);
    }
  });
}

function isSameDay(d1, d2) {
  return d1.getDate() === d2.getDate() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getFullYear() === d2.getFullYear();
}

async function notifyAll(message, userEmail) {
  // Show browser notification
  browserNotify(message);
  
  // Send WhatsApp message
  await sendWhatsAppAlert(getUserPhone(), message);
  
  // Send email notification
  await sendEmail(userEmail, 'FinzApp Notification', message);
}

function browserNotify(message) {
  if (!("Notification" in window)) return;
  
  if (Notification.permission === "granted") {
    new Notification("FinzApp", { body: message });
  }
  else if (Notification.permission !== "denied") {
    Notification.requestPermission().then(permission => {
      if (permission === "granted") {
        new Notification("FinzApp", { body: message });
      }
    });
  }
}

export async function sendEmail(to, subject, html) {
  try {
    const response = await fetch(`${NOTIFICATION_SETTINGS.API_BASE_URL}/send-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, subject, html })
    });
    
    if (!response.ok) throw new Error('Failed to send email');
    return true;
  } catch (error) {
    console.error('Email error:', error);
    return false;
  }
}

export async function sendWhatsAppAlert(phone, message) {
  try {
    // Format phone number if needed
    let formattedPhone = phone.replace(/\D/g, '');
    if (!formattedPhone.startsWith('598')) {
      formattedPhone = '598' + formattedPhone;
    }

    const response = await fetch(`${NOTIFICATION_SETTINGS.API_BASE_URL}/send-whatsapp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: formattedPhone,
        body: message
      })
    });
    
    if (!response.ok) throw new Error('Failed to send WhatsApp message');
    return true;
  } catch (error) {
    console.error('WhatsApp error:', error);
    return false;
  }
}

export async function sendAdminKey(email) {
  try {
    const response = await fetch(`${NOTIFICATION_SETTINGS.API_BASE_URL}/send-admin-key`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    
    if (!response.ok) throw new Error('Failed to send admin key');
    return true;
  } catch (error) {
    console.error('Admin key email error:', error);
    return false;
  }
}

export async function sendPaymentRequest(email, amount, paymentType) {
  try {
    const response = await fetch(`${NOTIFICATION_SETTINGS.API_BASE_URL}/send-payment-request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, amount, paymentType })
    });
    
    if (!response.ok) throw new Error('Failed to send payment request');
    return true;
  } catch (error) {
    console.error('Payment request error:', error);
    return false;
  }
}

// Helper function to get user's phone number (implement according to your user data structure)
function getUserPhone() {
  const auth = JSON.parse(localStorage.getItem('finzapp_auth') || '{}');
  return auth.phone; // Assuming phone number is stored in auth data
}