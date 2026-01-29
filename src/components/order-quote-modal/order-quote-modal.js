let _oqIti = null;

function initOrderQuotePhone() {
  const input = document.getElementById('order-quote-phone');
  if (!input || _oqIti || !window.intlTelInput) return;

  try {
    _oqIti = window.intlTelInput(input, {
      initialCountry: "auto",
      separateDialCode: true,
      nationalMode: false,
      utilsScript:
        "https://cdn.jsdelivr.net/npm/intl-tel-input@19.5.6/build/js/utils.js",
      geoIpLookup: async cb => {
        try {
          const r = await fetch("https://ipapi.co/json/");
          const j = await r.json();
          cb((j.country_code || "es").toLowerCase());
        } catch {
          cb("es");
        }
      }
    });
  } catch {
    _oqIti = null;
  }
}

let submitBtn;
let fields = {};
let touched = {};
let isSubmitting = false;

(function () {
  let overlay;
  let isOpen = false;

  function init() {
    overlay = document.getElementById('order-quote-overlay');
    if (!overlay) {
      console.warn('[OrderQuoteModal] overlay not found');
      return;
    }

    submitBtn = document.getElementById('order-quote-submit');

    fields = {
      name: document.getElementById('order-quote-name'),
      company: document.getElementById('order-quote-company'),
      phone: document.getElementById('order-quote-phone'),
      email: document.getElementById('order-quote-email'),
      terms: document.getElementById('order-quote-terms')
    };

    Object.keys(fields).forEach(key => {
      touched[key] = false;
    });

    submitBtn.disabled = true;

    Object.entries(fields).forEach(([key, el]) => {
      if (!el) return;

      el.addEventListener('input', () => {
        touched[key] = true;
        validateForm();
      });

      el.addEventListener('blur', () => {
        touched[key] = true;
        validateForm();
      });

      el.addEventListener('change', () => {
        touched[key] = true;
        validateForm();
      });
    });

    document
      .getElementById('order-quote-close')
      ?.addEventListener('click', closeModal);

    document.addEventListener('order-quote:products-changed', () => {
      validateForm();
    });

    submitBtn?.addEventListener('click', async e => {
      e.preventDefault();
      await submitOrder();
    });
  }

  function setInvalid(field, message) {
    const wrapper = field.closest('.oq-field');
    if (!wrapper) return;

    wrapper.classList.add('is-invalid');
    const err = wrapper.querySelector('.oq-error');
    if (err) err.textContent = message;
  }

  function clearInvalid(field) {
    const wrapper = field.closest('.oq-field');
    if (!wrapper) return;

    wrapper.classList.remove('is-invalid');
  }

  function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  function validateForm() {
    let valid = true;

    if (!fields.name.value.trim()) {
      if (touched.name) setInvalid(fields.name, 'Required');
      valid = false;
    } else clearInvalid(fields.name);

    if (!fields.company.value.trim()) {
      if (touched.company) setInvalid(fields.company, 'Required');
      valid = false;
    } else clearInvalid(fields.company);

    if (!fields.phone.value.trim()) {
      if (touched.phone) setInvalid(fields.phone, 'Required');
      valid = false;
    } else clearInvalid(fields.phone);

    if (!isValidEmail(fields.email.value)) {
      if (touched.email) setInvalid(fields.email, 'Invalid email');
      valid = false;
    } else clearInvalid(fields.email);

    if (!fields.terms.checked) {
      valid = false;
    }

    if (!window.hasValidOrderQuoteProducts?.()) {
      valid = false;
    }

    submitBtn.disabled = !valid || isSubmitting;
  }

  async function submitOrder() {
    if (submitBtn.disabled || isSubmitting) return;

    isSubmitting = true;
    submitBtn.disabled = true;

    try {
      const store = window.OrderQuoteStore;
      if (!store) throw new Error("OrderQuoteStore not available");

      const products = store.getProducts();
      const attachments = store.getAttachments();

      const customer = {
        name: fields.name.value.trim(),
        company: fields.company.value.trim(),
        phone: fields.phone.value.trim(),
        email: fields.email.value.trim(),
        country: store.getCountry?.() || null
      };

      const payload = {
        customer,
        notes: document.getElementById("order-quote-notes")?.value || "",
        items: products.map(p => ({
          title: p.title,
          qty: p.qty,
          condition: Array.isArray(p.condition)
            ? p.condition.join(",")
            : p.condition
        })),
        attachments
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Request failed');

      markStepsSuccess();
      showSuccessMessage();

    } catch (err) {
      console.error('[OrderQuoteModal] submit error', err);
      submitBtn.disabled = false;
      isSubmitting = false;
      alert('Order could not be sent. Please try again.');
    }
  }

  function markStepsSuccess() {
    const steps = document.querySelectorAll('.oq-step');
    const line = document.querySelector('.oq-step-line');

    steps.forEach(step => {
      step.classList.remove('active', 'inactive');
      step.classList.add('completed');
    });

    if (line) {
      line.classList.add('completed');
    }
  }

  function showSuccessMessage() {
    const details = document.querySelector('.oq-details');
    if (!details) return;

    details.innerHTML = `
      <div class="oq-success">
        <h3 data-i18n="order_quote.success_title"></h3>
        <p data-i18n="order_quote.success_message"></p>
      </div>
    `;

    window.applyTranslations?.();

    storeResetAfterSuccess();
  }

  function storeResetAfterSuccess() {
    setTimeout(() => {
      window.OrderQuoteStore?.clearProducts();
      window.OrderQuoteStore?.clearAttachments();
    }, 300);
  }

  function resetModalUI() {
    Object.values(fields).forEach(el => {
      if (!el) return;
      if (el.type === 'checkbox') el.checked = false;
      else el.value = '';
    });

    Object.keys(touched).forEach(k => {
      touched[k] = false;
    });

    submitBtn.disabled = true;
    isSubmitting = false;

    document
      .querySelectorAll('.oq-step, .oq-step-line')
      .forEach(el =>
        el.classList.remove('completed', 'active', 'inactive')
      );
  }

  function openModal() {
    if (!overlay) return;
    isOpen = true;
    overlay.style.display = "flex";

    setTimeout(initOrderQuotePhone, 0);
    validateForm();

    document.dispatchEvent(new Event('order-quote:open'));
  }

  function closeModal() {
    if (!overlay) return;
    isOpen = false;
    overlay.style.display = "none";
    resetModalUI();
    document.dispatchEvent(new Event('order-quote:close'));
  }

  init();

  window.OrderQuoteModal = {
    open: openModal,
    close: closeModal,
    isOpen: () => isOpen
  };
})();
