// Lee slug desde ?slug=... y, si no llega, desde /brands/:slug
const params = new URLSearchParams(location.search);
let slug = params.get('slug') || '';

if (!slug) {
  const m = location.pathname.match(/\/brands\/([^/?#]+)/i);
  slug = m ? decodeURIComponent(m[1]) : '';
}

const titleEl = document.getElementById('brand-title');
const grid = document.getElementById('products-grid');

// Título provisional mientras carga
titleEl.textContent = slug || 'brand';

// ✅ Placeholder correcto (tu archivo real)
const PLACEHOLDER = '/img/placeholders/product-thumb.png';

// Escape simple para inyectar texto seguro en HTML
const esc = (s = '') =>
  String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

// Normaliza disponibilidad a boolean + texto
function normalizeAvailability(v) {
  const val = String(v ?? '').trim().toLowerCase();

  // Casos "disponible"
  if (
    val === 'y' || val === 'yes' || val === '1' || val === 'true' ||
    val.includes('avail') || val.includes('in stock')
  ) {
    return { ok: true, label: 'Available' };
  }

  // Casos "no disponible"
  if (
    val === 'n' || val === 'no' || val === '0' || val === 'false' ||
    val.includes('unavail') || val.includes('out of stock')
  ) {
    return { ok: false, label: 'Unavailable' };
  }

  // Valor vacío o desconocido: por ahora lo tratamos como disponible
  return { ok: true, label: 'Available' };
}

// Dibuja una card vertical/angosta (4 por fila, misma UI)
const renderCard = (p) => {
  const part = esc(p.part_number || p.part || p.title || '');
  const { ok, label } = normalizeAvailability(p.availability);

  return `
    <article class="product-card">
      <div class="thumb-wrap">
        <img class="product-thumb" src="${PLACEHOLDER}" alt="Product image" loading="lazy">
      </div>
      <h3 class="part-number">${part}</h3>
      <span class="availability-pill ${ok ? 'is-available' : 'is-unavailable'}">${esc(label)}</span>
      <a class="btn-outline" href="/contact-us.html#rfq">Request a quote</a>
    </article>
  `;
};

async function load() {
  if (!slug) {
    grid.innerHTML = `<p>We couldn't detect a brand slug.</p>`;
    return;
  }

  try {
    // Tu endpoint: devuelve { brand, products: [...] }
    const res = await fetch(`/api/brands/${encodeURIComponent(slug)}`);
    if (!res.ok) throw new Error(`API ${res.status}`);
    const data = await res.json();

    // Título robusto: acepta string u objeto con name/label
    const brandName =
      (typeof data.brand === 'string' && data.brand) ||
      data.brand?.name ||
      data.brand?.label ||
      slug;
    titleEl.textContent = String(brandName).toLowerCase();

    const items = Array.isArray(data.products) ? data.products : [];
    if (!items.length) {
      grid.innerHTML = `<p>No products found for this brand yet.</p>`;
      return;
    }
    grid.innerHTML = items.map(renderCard).join('');
  } catch (err) {
    console.error('Error loading brand products', err);
    grid.innerHTML = `<p>We couldn't load this brand right now. Please try again later.</p>`;
  }
}

load();
