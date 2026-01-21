import { OrderQuoteStore } from '/src/order-quote-store.js';




(function () {
  const containerId = 'order-quote-products-body';

  function renderAll() {
    const tbody = document.getElementById(containerId);
    if (!tbody) return;

    tbody.innerHTML = '';
    const products = OrderQuoteStore.getProducts();

    products.forEach(p => {
      const row = document.createElement('tbody');
      row.innerHTML = renderRow(p);
      tbody.appendChild(row.firstElementChild);
    });

    bindRowEvents();

    if (typeof window.applyI18n === 'function') {
      const table = tbody.closest('table');
      if (table) window.applyI18n(table);
    }
  }

  function appendRow(product) {
    const tbody = document.getElementById(containerId);
    if (!tbody) return;

    const row = document.createElement('tbody');
    row.innerHTML = renderRow(product);
    tbody.appendChild(row.firstElementChild);

    bindRowEvents();
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
    // QTY
    document.querySelectorAll('.oq-qty-input').forEach(input => {
      input.onchange = e => {
       
        if (!window.OrderQuoteModal?.isOpen()) return;

        const tr = e.target.closest('tr');
        if (!tr) return;

        const id = tr.dataset.lineId;
        if (!id) return;

        OrderQuoteStore.updateProduct(id, {
          qty: parseInt(e.target.value, 10) || 1
        });

        notifyOrderQuoteValidation();

      };

    });

    // REMOVE ROW
    document.querySelectorAll('.oq-remove').forEach(btn => {
      btn.onclick = e => {
        if (!window.OrderQuoteModal?.isOpen()) return;

        const tr = e.target.closest('tr');
        if (!tr) return;

        const id = tr.dataset.lineId;
        if (!id) return;

        OrderQuoteStore.removeProduct(id);
        tr.remove();

        window.updateOrderQuoteBadge?.();
        notifyOrderQuoteValidation();
      };
    });

    // AUTOCOMPLETE
    document.querySelectorAll('.oq-product-input').forEach(input => {
      bindAutocomplete(input);
    });

    // CONDITIONS (por ID, no por índice)
    document.querySelectorAll('.oq-condition').forEach(el => {
      if (!window.OrderQuoteModal?.isOpen()) return;

      const tr = el.closest('tr');
      if (!tr) return;

      const id = tr.dataset.lineId;
      if (!id) return;

      const line = OrderQuoteStore.getProducts().find(p => p.id === id);
      if (!line) return;

      window.renderPreferredConditions(el, line.condition, cond => {
        OrderQuoteStore.updateProduct(line.id, { condition: cond });
      });
    });

  }

  function bindAutocomplete(input) {
    const dropdown = input.nextElementSibling;

      // 🔁 sincronizar valor desde store al rehidratar
    const tr = input.closest('tr');
    if (tr) {
      const id = tr.dataset.lineId;
      const line = OrderQuoteStore.getProducts().find(p => p.id === id);
      if (line && line.title && input.value !== line.title) {
        input.value = line.title;
      }
    }

    input.oninput = async e => {
      if (!window.OrderQuoteModal?.isOpen()) return;

      // 💾 guardar texto manual en el store
      const tr = input.closest('tr');
      if (tr) {
        const id = tr.dataset.lineId;
        if (id) {
          OrderQuoteStore.updateProduct(id, {
          title: e.target.value
        });

        notifyOrderQuoteValidation();
        }
      }
      const q = e.target.value.trim();
      if (q.length < 3) {
        dropdown.innerHTML = '';
        return;
      }

      let items = [];

      try {
        const res = await fetch(`/api/products/search?q=${encodeURIComponent(q)}`);

        // si el backend no existe o responde error → no romper UI
        if (!res.ok) {
          dropdown.innerHTML = '';
          return;
        }

        const contentType = res.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) {
          dropdown.innerHTML = '';
          return;
        }

        items = await res.json();
      } catch (err) {
        dropdown.innerHTML = '';
        return;
      }

      if (!window.OrderQuoteModal?.isOpen()) return;

      dropdown.innerHTML = items.map(p => `
        <div class="oq-autocomplete-item"
          data-id="${p.id}"
          data-title="${p.title}">
          ${p.title}
        </div>
      `).join('');

      dropdown.querySelectorAll('.oq-autocomplete-item').forEach(item => {
        item.onclick = () => {
          if (!window.OrderQuoteModal?.isOpen()) return;

          const tr = input.closest('tr');
          if (!tr) return;

          const id = tr.dataset.lineId;
          if (!id) return;

          input.value = item.dataset.title;
          OrderQuoteStore.updateProduct(id, {
            product_id: item.dataset.id,
            title: item.dataset.title
          });
          notifyOrderQuoteValidation();
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
        const res = OrderQuoteStore.addProduct();
        if (!res || res.ok === false) {
          return; // límite u otro control (feedback luego)
        }

        appendRow(res.product);
        window.updateOrderQuoteBadge?.();
        notifyOrderQuoteValidation();
      };
    }

    renderAll();
  });
})();

// ===============================
// Preferred Condition renderer (MULTI)
// ===============================
window.renderPreferredConditions = function (
  container,
  currentValue = ["NEW"],
  onChange
) {
  if (!container) return;

  const CONDITIONS = ["NEW", "USED", "EXCHANGE", "REFURBISHED"];

  // Normalizar a array
  const activeValues = Array.isArray(currentValue)
    ? currentValue
    : currentValue
    ? [currentValue]
    : ["NEW"];

  container.innerHTML = `
    <div class="oq-condition-chips">
      ${CONDITIONS.map(cond => `
        <button
          type="button"
          class="oq-condition-chip ${
            activeValues.includes(cond) ? 'is-active' : ''
          }"
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
      const isActive = btn.classList.contains('is-active');

      // Evitar dejar 0 seleccionadas
      const activeCount = container.querySelectorAll('.oq-condition-chip.is-active').length;
      if (isActive && activeCount <= 1) return;

      btn.classList.toggle('is-active');

      const selected = Array.from(
        container.querySelectorAll('.oq-condition-chip.is-active')
      ).map(b => b.dataset.value);

      if (typeof onChange === 'function') {
        onChange(selected);
      }
    });
  });
};

// ===============================
// Product validation (for submit)
// ===============================
window.hasValidOrderQuoteProducts = function () {
  if (!OrderQuoteStore) return false;

  const products = OrderQuoteStore.getProducts();
  if (!Array.isArray(products) || products.length === 0) return false;

  return products.every(p => {
    if (!p) return false;

    // title >= 3 chars
    if (!p.title || p.title.trim().length < 3) {
      return false;
    }

    // qty >= 1
    if (!p.qty || Number(p.qty) < 1) {
      return false;
    }

    return true;
  });
};

function notifyOrderQuoteValidation() {
  document.dispatchEvent(new Event('order-quote:products-changed'));
}
