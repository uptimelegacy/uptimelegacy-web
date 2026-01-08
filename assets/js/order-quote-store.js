/**
 * Order Quote Store
 * Persistente por sessionStorage
 * No reinicia estado automáticamente
 */

const ORDER_QUOTE_SESSION_KEY = 'order_quote_session_v1';

class OrderQuoteStore {
  constructor() {
    this.state = {
      products: [],
      notes: '',
      attachments: [],
      step: 1
    };

    this._load();
  }

  _load() {
    try {
      const raw = sessionStorage.getItem(ORDER_QUOTE_SESSION_KEY);
      if (raw) {
        this.state = JSON.parse(raw);
      }
    } catch (e) {
      console.error('[OrderQuoteStore] Load failed', e);
      this._persist();
    }
  }

  _persist() {
    sessionStorage.setItem(
      ORDER_QUOTE_SESSION_KEY,
      JSON.stringify(this.state)
    );
  }

  getProducts() {
    return this.state.products;
  }

  getLineCount() {
    return this.state.products.length;
  }

  addProduct(product = {}) {
    this.state.products.push({
      id: crypto.randomUUID(),
      product_id: product.product_id || null,
      title: product.title || '',
      part_number: product.part_number || '',
      qty: product.qty || 1,
      condition: product.condition || null
    });
    this._persist();
  }

  updateProduct(lineId, data) {
    const line = this.state.products.find(p => p.id === lineId);
    if (!line) return;

    Object.assign(line, data);
    this._persist();
  }

  removeProduct(lineId) {
    this.state.products = this.state.products.filter(p => p.id !== lineId);
    this._persist();
  }

  setNotes(notes) {
    this.state.notes = notes;
    this._persist();
  }

  getNotes() {
    return this.state.notes;
  }

  setAttachments(files) {
    this.state.attachments = files;
    this._persist();
  }

  getAttachments() {
    return this.state.attachments;
  }

  setStep(step) {
    this.state.step = step;
    this._persist();
  }

  reset() {
    sessionStorage.removeItem(ORDER_QUOTE_SESSION_KEY);
    this.state = {
      products: [],
      notes: '',
      attachments: [],
      step: 1
    };
  }
}

// Singleton global
window.OrderQuoteStore = new OrderQuoteStore();
