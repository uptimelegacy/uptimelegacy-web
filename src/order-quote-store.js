/* =========================================================
   OrderQuoteStore
   ---------------------------------------------------------
   - Estado global en memoria (session)
   - Fuente única de verdad
   - Compartido entre:
     - RFQ modal individual
     - Order Quote modal (multi-producto)
   - Sin backend, sin persistencia
========================================================= */

const MAX_PRODUCTS = 10;
const STORAGE_KEY = 'ORDER_QUOTE_STATE';

// Estado interno (privado al módulo)
let _products = [];
let _attachments = [];
let _listeners = [];

function loadFromSession() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return;

    if (Array.isArray(parsed.products)) {
      _products = parsed.products;
    }

    if (Array.isArray(parsed.attachments)) {
      _attachments = parsed.attachments;
    }
  } catch (e) {
    console.warn('[OrderQuoteStore] failed to load session', e);
  }
}

// Utilidad simple para IDs únicos
function uid() {
  return (
    Date.now().toString(36) +
    Math.random().toString(36).slice(2, 8)
  );
}

function saveToSession() {
  try {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        products: _products,
        attachments: _attachments
      })
    );
  } catch (e) {
    console.warn('[OrderQuoteStore] failed to save session', e);
  }
}

function notify() {
  saveToSession();

  _listeners.forEach((fn) => {
    try {
      fn(getState());
    } catch (e) {
      console.error("[OrderQuoteStore] listener error", e);
    }
  });
}


function getState() {
  return {
    products: [..._products],
    attachments: [..._attachments]
  };
}

/* =========================
   PRODUCTS
========================= */

function getProducts() {
  return [..._products];
}

function getProductCount() {
  return _products.length;
}

function addProduct(data = {}) {
  if (_products.length >= MAX_PRODUCTS) {
    return {
      ok: false,
      error: "MAX_PRODUCTS_REACHED"
    };
  }

  const product = {
    id: uid(),
    product_id: data.product_id || null,
    title: data.title || "",
    part_number: data.part_number || "",
    manufacturer: data.manufacturer || "",
    qty: Number.isFinite(data.qty) && data.qty >= 1 ? data.qty : 1,
    condition: Array.isArray(data.condition)
      ? [...data.condition]
      : data.condition
      ? [data.condition]
      : ["NEW"]
  };

  _products.push(product);
  notify();

  return { ok: true, product };
}

function upsertProductByProductId(data = {}) {
  if (!data.product_id) return { ok: false };

  const existing = _products.find(p => p.product_id === data.product_id);

  if (existing) {
    updateProduct(existing.id, {
      qty: data.qty,
      condition: data.condition,
      title: data.title
    });
    return { ok: true, product: existing };
  }

  return addProduct(data);
}


function updateProduct(id, patch = {}) {
  const idx = _products.findIndex((p) => p.id === id);
  if (idx === -1) return;

  const current = _products[idx];

  _products[idx] = {
    ...current,
    ...patch,
    condition: Array.isArray(patch.condition)
      ? [...patch.condition]
      : current.condition
  };

  notify();
}

function removeProduct(id) {
  const before = _products.length;
  _products = _products.filter((p) => p.id !== id);
  if (_products.length !== before) notify();
}

function clearProducts() {
  _products = [];
  _attachments = [];
  sessionStorage.removeItem(STORAGE_KEY);
  notify();
}


/* =========================
   ATTACHMENTS
========================= */

function setAttachments(list = []) {
  _attachments = Array.isArray(list) ? [...list] : [];
  notify();
}

function getAttachments() {
  return [..._attachments];
}

function clearAttachments() {
  _attachments = [];
  notify();
}

/* =========================
   SUBSCRIPTIONS
========================= */

function subscribe(fn) {
  if (typeof fn !== "function") return () => {};
  _listeners.push(fn);
  return () => {
    _listeners = _listeners.filter((l) => l !== fn);
  };
}

/* =========================
   API PÚBLICA (ES MODULE)
========================= */
loadFromSession();

export const OrderQuoteStore = {
  getState,
  getProducts,
  getProductCount,
  addProduct,
  upsertProductByProductId,
  updateProduct,
  removeProduct,
  clearProducts,
  setAttachments,
  getAttachments,
  clearAttachments,
  subscribe,
  MAX_PRODUCTS
};

