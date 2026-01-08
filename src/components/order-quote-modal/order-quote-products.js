(function () {
  const containerId = 'order-quote-products';

  function render() {
    const container = document.getElementById(containerId);
    if (!container) return;

    const products = window.OrderQuoteStore.getProducts();

    container.innerHTML = `
      <table class="order-quote-table">
        <thead>
          <tr>
            <th>Product</th>
            <th>Qty</th>
            <th>Preferred Condition</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          ${products.map(renderRow).join('')}
        </tbody>
      </table>
    `;

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
            placeholder=""
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
          <button class="oq-remove">✕</button>
        </td>
      </tr>
    `;
  }

  function bindRowEvents() {
    document.querySelectorAll('.oq-qty-input').forEach(input => {
      input.addEventListener('change', e => {
        const lineId = e.target.closest('tr').dataset.lineId;
        window.OrderQuoteStore.updateProduct(lineId, {
          qty: parseInt(e.target.value, 10)
        });
      });
    });

    document.querySelectorAll('.oq-remove').forEach(btn => {
      btn.addEventListener('click', e => {
        const lineId = e.target.closest('tr').dataset.lineId;
        window.OrderQuoteStore.removeProduct(lineId);
        render();
        window.updateOrderQuoteBadge();
      });
    });

    document.querySelectorAll('.oq-product-input').forEach(input => {
      bindAutocomplete(input);
    });

    // Preferred condition (reuse RFQ logic)
    document.querySelectorAll('.oq-condition').forEach((el, index) => {
      const line = window.OrderQuoteStore.getProducts()[index];
      window.renderPreferredConditions(el, line.condition, cond => {
        window.OrderQuoteStore.updateProduct(line.id, {
          condition: cond
        });
      });
    });
  }

  function bindAutocomplete(input) {
    const wrapper = input.closest('td');
    const dropdown = wrapper.querySelector('.oq-autocomplete');

    input.addEventListener('input', async e => {
      const q = e.target.value.trim();
      if (q.length < 3) {
        dropdown.innerHTML = '';
        return;
      }

      const res = await fetch(`/api/products/search?q=${encodeURIComponent(q)}`);
      const items = await res.json();

      dropdown.innerHTML = items
        .map(
          p =>
            `<div class="oq-autocomplete-item" data-id="${p.id}" data-title="${p.title}">
              ${p.title}
            </div>`
        )
        .join('');

      dropdown.querySelectorAll('.oq-autocomplete-item').forEach(item => {
        item.addEventListener('click', () => {
          const lineId = input.closest('tr').dataset.lineId;
          input.value = item.dataset.title;

          window.OrderQuoteStore.updateProduct(lineId, {
            product_id: item.dataset.id,
            title: item.dataset.title
          });

          dropdown.innerHTML = '';
        });
      });
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    document
      .getElementById('order-quote-add-product')
      .addEventListener('click', () => {
        window.OrderQuoteStore.addProduct();
        render();
        window.updateOrderQuoteBadge();
      });

    document.addEventListener('order-quote:open', render);
  });
})();
