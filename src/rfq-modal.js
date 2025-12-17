let _mounted = false;
let _overlay, _modal, _form, _btnSubmit, _alert;
let _titleEl, _subtitleEl;

let _nameEl, _companyEl, _phoneEl, _emailEl, _qtyEl, _termsEl;
let _chipWrap;

let _iti = null;
let _isOpen = false;
let _lastFocus = null;

const CONDITIONS = ["NEW", "USED", "EXCHANGE", "REFURBISHED"];

function getLang() {
  return localStorage.getItem("UL_LANG") || "en";
}

function t(key, fallback = "") {
  return window.I18N?.[getLang()]?.[key] ?? fallback;
}

function applyI18n(root) {
  const lang = getLang();
  root.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    const val = window.I18N?.[lang]?.[key];
    if (!val) return;

    if (/^(input|textarea)$/i.test(el.tagName)) el.setAttribute("placeholder", val);
    else el.innerHTML = val;
  });
}

function setAlert(type, msg) {
  _alert.className = "ul-rfq-alert";
  if (!msg) return;
  _alert.classList.add(type === "success" ? "is-success" : "is-error");
  _alert.textContent = msg;
}

function lockScroll(lock) {
  document.body.classList.toggle("ul-rfq-no-scroll", !!lock);
}

function getFocusable(container) {
  return Array.from(
    container.querySelectorAll(
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
    )
  ).filter((el) => !el.hasAttribute("disabled") && !el.getAttribute("aria-hidden"));
}

function onKeyDown(e) {
  if (!_isOpen) return;

  if (e.key === "Escape") {
    e.preventDefault();
    closeRFQ();
    return;
  }

  if (e.key !== "Tab") return;

  const focusables = getFocusable(_modal);
  if (!focusables.length) return;

  const first = focusables[0];
  const last = focusables[focusables.length - 1];

  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
}

function selectedConditions() {
  const active = Array.from(_chipWrap.querySelectorAll(".ul-rfq-chip.is-active")).map((b) =>
    b.getAttribute("data-value")
  );
  return active.filter(Boolean);
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());
}

function phoneValue() {
  const raw = String(_phoneEl.value || "").trim();
  if (_iti && typeof _iti.getNumber === "function") {
    const num = _iti.getNumber(); // intenta E.164 si utils está disponible
    return String(num || raw).trim();
  }
  return raw;
}

function isPhoneValid() {
  const raw = String(_phoneEl.value || "").trim();
  if (!raw) return false;
  if (_iti && typeof _iti.isValidNumber === "function") return _iti.isValidNumber();
  return raw.length >= 6; // fallback mínimo si no hay lib
}

function setFieldInvalid(fieldEl, invalid, msgKeyFallback) {
  const wrap = fieldEl.closest(".ul-rfq-field");
  if (!wrap) return;
  wrap.classList.toggle("is-invalid", !!invalid);
  const err = wrap.querySelector(".ul-rfq-error");
  if (err && invalid) err.textContent = t(msgKeyFallback, "Required");
}

function updateSubmitState() {
  const nameOk = String(_nameEl.value || "").trim().length > 0;
  const companyOk = String(_companyEl.value || "").trim().length > 0;
  const emailOk = isValidEmail(_emailEl.value);
  const phoneOk = isPhoneValid();
  const qty = parseInt(_qtyEl.value, 10);
  const qtyOk = Number.isFinite(qty) && qty >= 1;
  const condOk = selectedConditions().length >= 1;
  const termsOk = !!_termsEl.checked;

  // Validación visual ligera (solo si el usuario ya interactuó)
  if (_form.dataset.touched === "1") {
    setFieldInvalid(_nameEl, !nameOk, "rfq.validation.required");
    setFieldInvalid(_companyEl, !companyOk, "rfq.validation.required");
    setFieldInvalid(_phoneEl, !phoneOk, "rfq.validation.phone");
    setFieldInvalid(_emailEl, !emailOk, "rfq.validation.email");
    setFieldInvalid(_qtyEl, !qtyOk, "rfq.validation.required");
  }

  const ok = nameOk && companyOk && emailOk && phoneOk && qtyOk && condOk && termsOk;
  _btnSubmit.disabled = !ok;
}

function initPhoneInputBestEffort() {
  if (_iti || !window.intlTelInput) return;

  try {
    _iti = window.intlTelInput(_phoneEl, {
      initialCountry: "auto",
      nationalMode: false,
      separateDialCode: true,
      utilsScript:
        "https://cdn.jsdelivr.net/npm/intl-tel-input@19.5.6/build/js/utils.js",
      geoIpLookup: async (cb) => {
        // Best-effort. Si falla, fallback US.
        try {
          const r = await fetch("https://ipapi.co/json/");
          const j = await r.json();
          const code = (j && (j.country_code || j.country)) ? String(j.country_code || j.country).toLowerCase() : "";
          cb(code || "us");
        } catch {
          cb("us");
        }
      }
    });
  } catch {
    // fallback silencioso: input normal
    _iti = null;
  }
}

function resetFormUI() {
  _form.reset();
  _form.dataset.touched = "0";
  setAlert("", "");
  // por defecto NEW activo
  _chipWrap.querySelectorAll(".ul-rfq-chip").forEach((b) => b.classList.remove("is-active"));
  const first = _chipWrap.querySelector('.ul-rfq-chip[data-value="NEW"]');
  if (first) first.classList.add("is-active");
  _qtyEl.value = "1";
  updateSubmitState();
}

export function initRFQModal() {
  if (_mounted) return;

  _overlay = document.createElement("div");
  _overlay.className = "ul-rfq-overlay";
  _overlay.addEventListener("click", () => closeRFQ());

  _modal = document.createElement("div");
  _modal.className = "ul-rfq-modal";
  _modal.setAttribute("role", "dialog");
  _modal.setAttribute("aria-modal", "true");
  _modal.setAttribute("aria-labelledby", "ul-rfq-title");
  _modal.setAttribute("aria-describedby", "ul-rfq-subtitle");

  _modal.innerHTML = `
    <div class="ul-rfq-header">
      <div>
        <h2 class="ul-rfq-title" id="ul-rfq-title"></h2>
        <div class="ul-rfq-subtitle" id="ul-rfq-subtitle"></div>
      </div>
      <button type="button" class="ul-rfq-close" aria-label="Close">×</button>
    </div>

    <form class="ul-rfq-body" novalidate>
      <div class="ul-rfq-grid">
        <div class="ul-rfq-field">
          <label><span data-i18n="rfq.name">Name</span> <span class="ul-rfq-req">*</span></label>
          <input id="ul-rfq-name" type="text" autocomplete="name" data-i18n="rfq.name" />
          <div class="ul-rfq-error"></div>
        </div>

        <div class="ul-rfq-field">
          <label><span data-i18n="rfq.company">Company name</span> <span class="ul-rfq-req">*</span></label>
          <input id="ul-rfq-company" type="text" autocomplete="organization" data-i18n="rfq.company" />
          <div class="ul-rfq-error"></div>
        </div>

        <div class="ul-rfq-field">
          <label><span data-i18n="rfq.phone">Phone</span> <span class="ul-rfq-req">*</span></label>
          <input id="ul-rfq-phone" type="tel" autocomplete="tel" data-i18n="rfq.phone" />
          <div class="ul-rfq-error"></div>
        </div>

        <div class="ul-rfq-field">
          <label><span data-i18n="rfq.email">Email</span> <span class="ul-rfq-req">*</span></label>
          <input id="ul-rfq-email" type="email" autocomplete="email" data-i18n="rfq.email" />
          <div class="ul-rfq-error"></div>
        </div>
      </div>

      <div class="ul-rfq-section-title" data-i18n="rfq.condition">Condition</div>
      <div class="ul-rfq-chips" id="ul-rfq-chips">
        <button type="button" class="ul-rfq-chip is-active" data-value="NEW" aria-pressed="true"><span data-i18n="rfq.cond.new">NEW</span></button>
        <button type="button" class="ul-rfq-chip" data-value="USED" aria-pressed="false"><span data-i18n="rfq.cond.used">USED</span></button>
        <button type="button" class="ul-rfq-chip" data-value="EXCHANGE" aria-pressed="false"><span data-i18n="rfq.cond.exchange">EXCHANGE</span></button>
        <button type="button" class="ul-rfq-chip" data-value="REFURBISHED" aria-pressed="false"><span data-i18n="rfq.cond.refurbished">REFURBISHED</span></button>
      </div>

      <div class="ul-rfq-grid" style="margin-top:14px;">
        <div class="ul-rfq-field">
          <label><span data-i18n="rfq.quantity">Quantity</span> <span class="ul-rfq-req">*</span></label>
          <div class="ul-rfq-qty">
            <button type="button" id="ul-rfq-qty-minus" aria-label="Decrease quantity">−</button>
            <input id="ul-rfq-qty" type="number" min="1" step="1" inputmode="numeric" value="1" />
            <button type="button" id="ul-rfq-qty-plus" aria-label="Increase quantity">+</button>
          </div>
          <div class="ul-rfq-error"></div>
        </div>

        <div></div>
      </div>

      <div class="ul-rfq-terms">
        <input id="ul-rfq-terms" type="checkbox" />
        <label for="ul-rfq-terms" style="cursor:pointer;">
          <span data-i18n="rfq.termsPrefix">I accept the</span>
          <a href="#" target="_blank" rel="noopener" data-i18n="rfq.termsLink">Terms & Conditions</a>
          <span class="ul-rfq-req">*</span>
        </label>
      </div>

      <div class="ul-rfq-alert" role="status" aria-live="polite"></div>

      <div class="ul-rfq-footer">
        <button type="submit" class="ul-rfq-submit" disabled data-i18n="rfq.quickQuote">Quick Quote</button>
      </div>
    </form>
  `;

  document.body.appendChild(_overlay);
  document.body.appendChild(_modal);

  _titleEl = _modal.querySelector("#ul-rfq-title");
  _subtitleEl = _modal.querySelector("#ul-rfq-subtitle");
  _form = _modal.querySelector("form");
  _btnSubmit = _modal.querySelector(".ul-rfq-submit");
  _alert = _modal.querySelector(".ul-rfq-alert");

  _nameEl = _modal.querySelector("#ul-rfq-name");
  _companyEl = _modal.querySelector("#ul-rfq-company");
  _phoneEl = _modal.querySelector("#ul-rfq-phone");
  _emailEl = _modal.querySelector("#ul-rfq-email");
  _qtyEl = _modal.querySelector("#ul-rfq-qty");
  _termsEl = _modal.querySelector("#ul-rfq-terms");
  _chipWrap = _modal.querySelector("#ul-rfq-chips");

  // Close (X)
  _modal.querySelector(".ul-rfq-close").addEventListener("click", () => closeRFQ());

  // Stop overlay close when clicking inside modal
  _modal.addEventListener("click", (e) => e.stopPropagation());

  // Focus trap + ESC
  document.addEventListener("keydown", onKeyDown);

  // Form touched flag
  const markTouched = () => {
    if (_form.dataset.touched !== "1") _form.dataset.touched = "1";
  };
  ["input", "change", "blur"].forEach((evt) => {
    _form.addEventListener(evt, () => {
      markTouched();
      updateSubmitState();
    }, true);
  });

  // Chips
  _chipWrap.addEventListener("click", (e) => {
    const btn = e.target.closest(".ul-rfq-chip");
    if (!btn) return;
    e.preventDefault();

    const currentlyActive = btn.classList.contains("is-active");
    const activeCount = selectedConditions().length;

    // evita dejar 0 seleccionadas
    if (currentlyActive && activeCount <= 1) return;

    btn.classList.toggle("is-active");
    btn.setAttribute("aria-pressed", btn.classList.contains("is-active") ? "true" : "false");
    updateSubmitState();
  });

  // Quantity buttons
  const minus = _modal.querySelector("#ul-rfq-qty-minus");
  const plus = _modal.querySelector("#ul-rfq-qty-plus");
  minus.addEventListener("click", () => {
    const v = Math.max(1, (parseInt(_qtyEl.value, 10) || 1) - 1);
    _qtyEl.value = String(v);
    updateSubmitState();
  });
  plus.addEventListener("click", () => {
    const v = Math.max(1, (parseInt(_qtyEl.value, 10) || 1) + 1);
    _qtyEl.value = String(v);
    updateSubmitState();
  });

  // Submit
  _form.addEventListener("submit", async (e) => {
    e.preventDefault();
    _form.dataset.touched = "1";
    updateSubmitState();
    if (_btnSubmit.disabled) {
      setAlert("error", t("rfq.validation.required", "Please fill in all required fields."));
      return;
    }

    const partNumber = _modal.dataset.partNumber || "";
    const manufacturer = _modal.dataset.manufacturer || "";

    const payload = {
      partNumber,
      manufacturer,
      name: String(_nameEl.value || "").trim(),
      companyName: String(_companyEl.value || "").trim(),
      phone: phoneValue(),
      email: String(_emailEl.value || "").trim(),
      conditions: selectedConditions(),
      quantity: Math.max(1, parseInt(_qtyEl.value, 10) || 1),
      termsAccepted: !!_termsEl.checked,
      pageUrl: location.href,
      locale: getLang()
    };

    setAlert("", "");
    _btnSubmit.disabled = true;
    const originalText = _btnSubmit.textContent;
    _btnSubmit.textContent = t("rfq.sending", "Sending…");

    try {
      const res = await fetch("/api/quick-quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.ok) {
        const msg = data?.error || t("rfq.error", "Sorry, something went wrong. Please try again.");
        setAlert("error", msg);
        _btnSubmit.textContent = originalText;
        updateSubmitState();
        return;
      }

      setAlert("success", t("rfq.success", "Thanks — your request has been sent."));
      // limpia y cierra con pequeño delay (para que el usuario vea el feedback)
      setTimeout(() => {
        resetFormUI();
        closeRFQ();
      }, 900);
    } catch {
      setAlert("error", t("rfq.error", "Sorry, something went wrong. Please try again."));
      _btnSubmit.textContent = originalText;
      updateSubmitState();
    }
  });

  // Re-traducir si el usuario cambia idioma mientras el modal está abierto
  const retranslateIfOpen = () => {
    if (!_isOpen) return;
    applyI18n(_modal);
    // botón puede haber sido “Sending…”; solo rehacer texto si no está enviando
    if (!_btnSubmit.disabled) _btnSubmit.textContent = t("rfq.quickQuote", "Quick Quote");
  };
  document.getElementById("btn-en")?.addEventListener("click", retranslateIfOpen);
  document.getElementById("btn-es")?.addEventListener("click", retranslateIfOpen);

  _mounted = true;
  applyI18n(_modal);
  resetFormUI();
}

export function openRFQ({ partNumber, manufacturer }) {
  initRFQModal();

  _modal.dataset.partNumber = String(partNumber || "").trim();
  _modal.dataset.manufacturer = String(manufacturer || "").trim();

  _titleEl.textContent = _modal.dataset.partNumber || "-";
  _subtitleEl.textContent = _modal.dataset.manufacturer || "";

  applyI18n(_modal);
  setAlert("", "");
  resetFormUI();

  _lastFocus = document.activeElement;
  _isOpen = true;

  _overlay.classList.add("is-open");
  _modal.classList.add("is-open");
  lockScroll(true);

  // init intl-tel-input si está disponible
  initPhoneInputBestEffort();

  // focus al primer input
  setTimeout(() => _nameEl.focus(), 0);
}

export function closeRFQ() {
  if (!_mounted || !_isOpen) return;

  _isOpen = false;
  _overlay.classList.remove("is-open");
  _modal.classList.remove("is-open");
  lockScroll(false);

  // restore focus
  if (_lastFocus && typeof _lastFocus.focus === "function") {
    setTimeout(() => _lastFocus.focus(), 0);
  }
}
