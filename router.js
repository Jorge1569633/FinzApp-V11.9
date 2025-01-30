import { loadDashboard } from './views/dashboard.js';
import { loadTarjetas } from './views/tarjetas.js';
import { loadGastos } from './views/gastos.js';
import { loadHistorial } from './views/historial.js';
import { loadVencimientos } from './views/vencimientos.js';
import { loadIngresos } from './views/ingresos.js';

const routes = {
  'nav-dashboard': loadDashboard,
  'nav-tarjetas': loadTarjetas,
  'nav-gastos': loadGastos,
  'nav-ingresos': loadIngresos,
  'nav-historial': loadHistorial,
  'nav-vencimientos': loadVencimientos
};

export function initRouter() {
  // Set up navigation listeners
  Object.keys(routes).forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      element.addEventListener('click', (e) => {
        e.preventDefault();
        navigate(id);
      });
    }
  });

  // Load initial view
  navigate('nav-dashboard');
}

function navigate(routeId) {
  // Clear active states
  Object.keys(routes).forEach(id => {
    document.getElementById(id)?.classList.remove('active');
  });
  
  // Set new active state
  document.getElementById(routeId)?.classList.add('active');
  
  // Load view
  const view = routes[routeId];
  if (view) {
    view();
  }
}