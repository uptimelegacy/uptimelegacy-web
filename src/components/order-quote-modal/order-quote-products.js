(function () {
  const containerId = 'order-quote-products-body';

  function render() {
    const tbody = document.getElementById(containerId);
    if (!tbody) return;

    const products = window.OrderQuoteStore.getProducts();

    tbody.innerHTML = products.map(renderRow).join('');

    bindRowEvents();

    // 🔥 RE-APLICAR I18N tras render dinámico
    if (typeof window.applyI18n === 'function') {
      const table = tbody.closest('table');
      if (table) window.applyI18n(table);
    }
  }

  function renderRow(line) {
    return `
      <tr data-line-id="${line.id}">
        <td>
          <input
            type="text"
            class="oq-product-input"
            value="${line.title || ''}"
          />
          <div class="oq-autocomplete"></div>
        </td>
        <td>
          <input
            type="number"
            min="1"
            class="oq-qty-input"
            value="${line.qty}"
          />
        </td>
        <td>
          <div class="oq-condition"></div>
        </td>
        <td>
          <button type="button" class="oq-remove">✕</button>
        </td>
      </tr>
    `;
  }

  function bindRowEvents() {
    document.querySelectorAll('.oq-qty-input').forEach(input => {
      input.onchange = e => {
        const id = e.target.closest('tr').dataset.lineId;
        window.OrderQuoteStore.updateProduct(id, {
          qty: parseInt(e.target.value, 10) || 1
        });
      };
    });

    document.querySelectorAll('.oq-remove').forEach(btn => {
      btn.onclick = e => {
        const id = e.target.closest('tr').dataset.lineId;
        window.OrderQuoteStore.removeProduct(id);
        render();
        window.updateOrderQuoteBadge?.();
      };
    });

    document.querySelectorAll('.oq-product-input').forEach(input => {
      bindAutocomplete(input);
    });

    document.querySelectorAll('.oq-condition').forEach((el, i) => {
      const line = window.OrderQuoteStore.getProducts()[i];
      window.renderPreferredConditions(el, line.condition, cond => {
        window.OrderQuoteStore.updateProduct(line.id, { condition: cond });
      });
    });
  }

  function bindAutocomplete(input) {
    const dropdown = input.nextElementSibling;

    input.oninput = async e => {
      const q = e.target.value.trim();
      if (q.length < 3) {
        dropdown.innerHTML = '';
        return;
      }

      const res = await fetch(`/api/products/search?q=${encodeURIComponent(q)}`);
      const items = await res.json();

      dropdown.innerHTML = items.map(p => `
        <div class="oq-autocomplete-item"
          data-id="${p.id}"
          data-title="${p.title}">
          ${p.title}
        </div>
      `).join('');

      dropdown.querySelectorAll('.oq-autocomplete-item').forEach(item => {
        item.onclick = () => {
          const id = input.closest('tr').dataset.lineId;
          input.value = item.dataset.title;
          window.OrderQuoteStore.updateProduct(id, {
            product_id: item.dataset.id,
            title: item.dataset.title
          });
          dropdown.innerHTML = '';
        };
      });
    };
  }

  document.addEventListener('order-quote:open', () => {
    const btn = document.getElementById('order-quote-add-product');
    if (btn && !btn.dataset.bound) {
      btn.dataset.bound = '1';
      btn.onclick = () => {
        window.OrderQuoteStore.addProduct();
        render();
        window.updateOrderQuoteBadge?.();
      };
    }

    render();
  });
})();

// ===============================
// Preferred Condition renderer
// ===============================
window.renderPreferredConditions = function (
  container,
  currentValue = "NEW",
  onChange
) {
  if (!container) return;

  const CONDITIONS = ["NEW", "USED", "EXCHANGE", "REFURBISHED"];

  container.innerHTML = `
    <div class="oq-condition-chips">
      ${CONDITIONS.map(cond => `
        <button
          type="button"
          class="oq-condition-chip ${cond === currentValue ? 'is-active' : ''}"
          data-value="${cond}"
        >
          ${cond}
        </button>
      `).join('')}
    </div>
  `;

  const buttons = container.querySelectorAll('.oq-condition-chip');

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const value = btn.dataset.value;

      // 🔥 EXCLUSIVIDAD REAL
      buttons.forEach(b => b.classList.remove('is-active'));
      btn.classList.add('is-active');

      if (typeof onChange === 'function') {
        onChange(value);
      }
    });
  });
};
