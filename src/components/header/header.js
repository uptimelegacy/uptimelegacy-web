import { OrderQuoteStore } from '/src/order-quote-store.js';

function updateOrderQuoteBadge() {
  const badge = document.getElementById('order-quote-badge');
  if (!badge) return;

  const count = OrderQuoteStore.getProductCount();
  badge.textContent = count;
  badge.style.display = count > 0 ? 'inline-block' : 'none';
}

function requestOpenOrderQuote() {
  window.OrderQuote?.open();
}



function bindHeader() {
  const btn = document.getElementById('order-quote-button');
  if (!btn || btn.dataset.bound === '1') return;

  btn.dataset.bound = '1';
  btn.addEventListener('click', requestOpenOrderQuote);


  updateOrderQuoteBadge();

  // 🔔 escuchar cambios reales del store
  OrderQuoteStore.subscribe(() => {
    updateOrderQuoteBadge();
  });

}

export function initHeader() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindHeader);
  } else {
    bindHeader();
  }
}
