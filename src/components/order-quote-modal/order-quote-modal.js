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

    // NAME
    if (!fields.name.value.trim()) {
      if (touched.name) setInvalid(fields.name, 'Required');
      valid = false;
    } else {
      clearInvalid(fields.name);
    }

    // COMPANY
    if (!fields.company.value.trim()) {
      if (touched.company) setInvalid(fields.company, 'Required');
      valid = false;
    } else {
      clearInvalid(fields.company);
    }

    // PHONE
    if (!fields.phone.value.trim()) {
      if (touched.phone) setInvalid(fields.phone, 'Required');
      valid = false;
    } else {
      clearInvalid(fields.phone);
    }

    // EMAIL
    if (!isValidEmail(fields.email.value)) {
      if (touched.email) setInvalid(fields.email, 'Invalid email');
      valid = false;
    } else {
      clearInvalid(fields.email);
    }

    // TERMS (no error visual todavía)
    if (!fields.terms.checked) {
      valid = false;
    }

    // PRODUCTS
    if (!window.hasValidOrderQuoteProducts?.()) {
      valid = false;
    }


    submitBtn.disabled = !valid;
  }



  function openModal() {
    if (!overlay) return;
    isOpen = true;
    overlay.style.display = "flex";

    // 🔥 inicializa teléfono con bandera
    setTimeout(initOrderQuotePhone, 0);

    validateForm(); // 🔥 fuerza estado inicial

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


