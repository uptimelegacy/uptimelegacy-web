let ready = false;
let pendingOpen = false;

export async function initOrderQuote() {
  if (window.OrderQuote) return;

  window.OrderQuote = {
    open() {
      if (ready) {
        window.OrderQuoteModal?.open();
      } else {
        pendingOpen = true;
      }
    },
    close() {
      window.OrderQuoteModal?.close();
    },
    isReady() {
      return ready;
    }
  };

  // 1️⃣ Inyectar HTML
  const html = await fetch(
    '/src/components/order-quote-modal/order-quote-modal.html'
  ).then(r => r.text());

  document.body.insertAdjacentHTML('beforeend', html);

  // 2️⃣ Cargar JS
  await Promise.all([
    import('/src/components/order-quote-modal/order-quote-modal.js'),
    import('/src/components/order-quote-modal/order-quote-products.js'),
    import('/src/components/order-quote-modal/order-quote-attachments.js')
  ]);

  ready = true;

  if (pendingOpen) {
    pendingOpen = false;
    window.OrderQuote.open();
  }
}
