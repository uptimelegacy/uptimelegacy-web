// Evita doble inicialización
if (!window.__SITE_BOOTSTRAPPED__) {
  window.__SITE_BOOTSTRAPPED__ = true;

  // Registro global de servicios
  window.Site = {
    services: {}
  };

  // Inicializar Order Quote
  import('/src/components/order-quote-modal/order-quote-service.js')
    .then(mod => mod.initOrderQuote())
    .catch(err => console.error('[OrderQuote] init failed', err));
}
