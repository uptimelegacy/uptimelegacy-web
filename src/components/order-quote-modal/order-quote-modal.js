(function () {
  let overlay;
  let iti = null;
  let isOpen = false;


  function initPhone() {
    const input = document.getElementById('order-quote-phone');
    if (!input || iti || !window.intlTelInput) return;

    iti = window.intlTelInput(input, {
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
  }

  function openModal() {
    if (!overlay) return;
    isOpen = true;
    overlay.style.display = "flex";
    initPhone();
    document.dispatchEvent(new Event('order-quote:open'));
  }

  function closeModal() {
    if (!overlay) return;
    isOpen = false;
    overlay.style.display = "none";
    document.dispatchEvent(new Event('order-quote:close'));
  }



  document.addEventListener("DOMContentLoaded", () => {
    overlay = document.getElementById("order-quote-overlay");
    if (!overlay) return;

    document
      .getElementById("order-quote-close")
      ?.addEventListener("click", closeModal);
  });

  window.OrderQuoteModal = {
    open: openModal,
    close: closeModal,
    isOpen: () => isOpen,
    isReady: true
  };

})();
