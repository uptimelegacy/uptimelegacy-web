// Header specific logic (si mañana agregas burger menu, va acá)

window.addEventListener('languageChanged', (e) => {
  const lang = e.detail;

  document
    .querySelectorAll('.lang-switch button')
    .forEach(btn => {
      btn.classList.toggle('active', btn.dataset.lang === lang);
    });
});

(function () {
  function updateOrderQuoteBadge() {
    if (!window.OrderQuoteStore) return;

    const badge = document.getElementById('order-quote-badge');
    if (!badge) return;

    const count = window.OrderQuoteStore.getLineCount();

    if (count > 0) {
      badge.textContent = count;
      badge.style.display = 'inline-block';
    } else {
      badge.style.display = 'none';
    }
  }

  function openOrderQuoteSafely() {
    if (document.getElementById('order-quote-overlay')) {
      document.dispatchEvent(new CustomEvent('order-quote:open'));
      return;
    }

    const interval = setInterval(() => {
      if (document.getElementById('order-quote-overlay')) {
        clearInterval(interval);
        document.dispatchEvent(new CustomEvent('order-quote:open'));
      }
    }, 50);
  }

  function bindHeaderEvents() {
    const btn = document.getElementById('order-quote-button');
    if (!btn) return;

    // Evitar duplicar listeners
    if (btn.__orderQuoteBound) return;
    btn.__orderQuoteBound = true;

    btn.addEventListener('click', () => {
      openOrderQuoteSafely();
    });

    updateOrderQuoteBadge();
    window.addEventListener('storage', updateOrderQuoteBadge);
  }

  // ✅ EJECUTAR SIEMPRE
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindHeaderEvents);
  } else {
    bindHeaderEvents();
  }

  // Exponer para otros módulos
  window.updateOrderQuoteBadge = updateOrderQuoteBadge;
})();
