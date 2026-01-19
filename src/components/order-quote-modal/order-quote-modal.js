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

(function () {
  let overlay;
  let iti = null;
  let isOpen = false;

  function init() {
    overlay = document.getElementById('order-quote-overlay');
    if (!overlay) {
      console.warn('[OrderQuoteModal] overlay not found');
      return;
    }

    document
      .getElementById('order-quote-close')
      ?.addEventListener('click', closeModal);
  }



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

    // 🔥 inicializa teléfono con bandera
    setTimeout(initOrderQuotePhone, 0);

    document.dispatchEvent(new Event('order-quote:open'));
  }


  function closeModal() {
    if (!overlay) return;
    isOpen = false;
    overlay.style.display = "none";
    document.dispatchEvent(new Event('order-quote:close'));
  }

 
  init()

  window.OrderQuoteModal = {
    open: openModal,
    close: closeModal,
    isOpen: () => isOpen
  };



  

})();


