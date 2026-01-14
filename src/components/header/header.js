(function () {
  function updateOrderQuoteBadge() {
    if (!window.OrderQuoteStore) return;

    const badge = document.getElementById('order-quote-badge');
    if (!badge) return;

    const count = window.OrderQuoteStore.getLineCount();
    badge.textContent = count;
    badge.style.display = count > 0 ? 'inline-block' : 'none';
  }

  function openOrderQuote() {
    if (window.OrderQuoteModal?.open) {
      window.OrderQuoteModal.open();
      return;
    }

    const retry = setInterval(() => {
      if (window.OrderQuoteModal?.open) {
        clearInterval(retry);
        window.OrderQuoteModal.open();
      }
    }, 50);
  }

  function bind() {
    const btn = document.getElementById('order-quote-button');
    if (!btn || btn.__bound) return;

    btn.__bound = true;
    btn.addEventListener('click', openOrderQuote);

    updateOrderQuoteBadge();
    window.addEventListener('storage', updateOrderQuoteBadge);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind);
  } else {
    bind();
  }

  window.updateOrderQuoteBadge = updateOrderQuoteBadge;
})();
