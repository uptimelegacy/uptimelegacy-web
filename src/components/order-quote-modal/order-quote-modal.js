(function () {
  let overlay;

  function getLang() {
    return localStorage.getItem("UL_LANG") || "en";
  }

  function t(key, fallback = "") {
    return window.I18N?.[getLang()]?.[key] ?? fallback;
  }

  function applyI18n() {
    if (!overlay) return;

    overlay.querySelectorAll("[data-i18n]").forEach(el => {
      const key = el.getAttribute("data-i18n");
      const value = t(key);
      if (!value) return;

      if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
        el.placeholder = value;
      } else {
        el.innerHTML = value;
      }
    });
  }

  function openModal() {
    if (!overlay) return;
    overlay.style.display = "flex";
    hydrateFromStore();
    applyI18n();
  }

  function closeModal() {
    if (!overlay) return;
    overlay.style.display = "none";
  }

  function hydrateFromStore() {
    const store = window.OrderQuoteStore;
    if (!store) return;

    const notes = document.getElementById("order-quote-notes");
    if (notes) notes.value = store.getNotes() || "";

    if (store.state.step === 2) {
      document.getElementById("order-quote-step-1").style.display = "none";
      document.getElementById("order-quote-step-2").style.display = "flex";
    }
  }

  function bindEvents() {
    document
      .getElementById("order-quote-close")
      ?.addEventListener("click", closeModal);

    document
      .getElementById("order-quote-notes")
      ?.addEventListener("input", e => {
        window.OrderQuoteStore?.setNotes(e.target.value);
      });
  }

  document.addEventListener("DOMContentLoaded", () => {
    overlay = document.getElementById("order-quote-overlay");
    if (!overlay) return;
    bindEvents();
    applyI18n();
  });

  document.addEventListener("order-quote:open", openModal);

  // 🔑 CLAVE: reaccionar al cambio de idioma
  window.addEventListener("languageChanged", applyI18n);

  window.OrderQuoteModal = {
    open: openModal,
    close: closeModal
  };
})();

async function submitOrderQuote() {
  const store = window.OrderQuoteStore;
  const files = window.OrderQuoteAttachments.getFiles();

  const payload = {
    customer: {
      name: document.getElementById("order-quote-name").value.trim(),
      company: document.getElementById("order-quote-company").value.trim(),
      phone: document.getElementById("order-quote-phone").value.trim(),
      country: document.getElementById("order-quote-country").value
    },
    notes: store.getNotes(),
    products: store.getProducts()
  };

  const lang = localStorage.getItem("UL_LANG") || "en";

  if (!payload.customer.name || !payload.customer.company || !payload.customer.phone) {
    alert(window.I18N?.[lang]?.["order_quote.required"]);
    return;
  }

  if (!document.getElementById("order-quote-terms").checked) {
    alert(window.I18N?.[lang]?.["order_quote.accept_terms"]);
    return;
  }

  const formData = new FormData();
  formData.append("data", JSON.stringify(payload));
  files.forEach(file => formData.append("files", file));

  const res = await fetch("/api/orders/create", {
    method: "POST",
    body: formData
  });

  if (!res.ok) {
    alert(window.I18N?.[lang]?.["order_quote.error"]);
    return;
  }

  store.setStep(2);
  document.getElementById("order-quote-step-1").style.display = "none";
  document.getElementById("order-quote-step-2").style.display = "flex";
}

document
  .getElementById("order-quote-submit")
  ?.addEventListener("click", submitOrderQuote);
