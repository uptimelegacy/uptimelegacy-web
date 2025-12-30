import { initRFQModal, openRFQ } from "./rfq-modal.js";

// Lee slug desde ?slug=... y, si no llega, desde /brands/:slug
const params = new URLSearchParams(location.search);
let slug = params.get("slug") || "";

if (!slug) {
  const m = location.pathname.match(/\/brands\/([^/?#]+)/i);
  slug = m ? decodeURIComponent(m[1]) : "";
}

const titleEl = document.getElementById("brand-title");
const grid = document.getElementById("products-grid");

// Inicializa el modal (idempotente)
initRFQModal();

// Título provisional mientras carga
titleEl.textContent = slug || "brand";

// ✅ Placeholder correcto (tu archivo real)
const PLACEHOLDER = "/img/placeholders/product-thumb.png";

// Escape simple para inyectar texto seguro en HTML
const esc = (s = "") =>
  String(s).replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));

// i18n mínimo para el CTA (sin depender de applyLanguage global)
const getLang = () => localStorage.getItem("UL_LANG") || "en";
const t = (key, fallback) => window.I18N?.[getLang()]?.[key] || fallback;

// Normaliza disponibilidad a boolean + texto
function normalizeAvailability(v) {
  const lang = getLang();
  const val = String(v ?? "").trim().toLowerCase();

  const availableLabel =
    lang === "es"
      ? window.I18N?.es?.rfq?.available_es || "Disponible"
      : window.I18N?.en?.rfq?.available || "Available";

  const unavailableLabel =
    lang === "es"
      ? window.I18N?.es?.rfq?.unavailable_es || "No disponible"
      : window.I18N?.en?.rfq?.unavailable || "Unavailable";

  if (
    val === "y" || val === "yes" || val === "1" || val === "true" ||
    val.includes("avail") || val.includes("in stock")
  ) {
    return { ok: true, label: availableLabel };
  }

  if (
    val === "n" || val === "no" || val === "0" || val === "false" ||
    val.includes("unavail") || val.includes("out of stock")
  ) {
    return { ok: false, label: unavailableLabel };
  }

  return { ok: true, label: availableLabel };
}


let currentBrandName = slug || "brand";

// Dibuja una card vertical/angosta (4 por fila, misma UI)
const renderCard = (p) => {
  const rawPart = String(p.part_number || p.part || p.title || "").trim();
  const part = esc(rawPart);
  const { ok, label } = normalizeAvailability(p.availability);

  const ctaText = esc(t("rfq.cta", "Request a quote"));
  const manu = esc(currentBrandName);

  return `
    <article class="product-card">
      <div class="thumb-wrap">
        <img class="product-thumb" src="${PLACEHOLDER}" alt="Product image" loading="lazy">
      </div>
      <h3 class="part-number">${part}</h3>
      <span class="availability-pill ${ok ? "is-available" : "is-unavailable"}">${esc(label)}</span>

      <!-- RFQ modal trigger -->
      <a
        class="btn-outline ul-rfq-trigger"
        href="#"
        data-part="${part}"
        data-manufacturer="${manu}"
        data-i18n="rfq.cta"
        aria-label="${ctaText}"
      >${ctaText}</a>
    </article>
  `;
};

// Click delegado para abrir modal sin recargar
grid?.addEventListener("click", (e) => {
  const btn = e.target.closest(".ul-rfq-trigger");
  if (!btn) return;
  e.preventDefault();

  const partNumber = btn.getAttribute("data-part") || "";
  const manufacturer = btn.getAttribute("data-manufacturer") || currentBrandName || slug || "";

  openRFQ({ partNumber, manufacturer });
});

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
      (typeof data.brand === "string" && data.brand) ||
      data.brand?.name ||
      data.brand?.label ||
      slug;

    currentBrandName = String(brandName);

    // Mantengo tu comportamiento visual existente (lowercase en H1)
    titleEl.textContent = String(brandName).toLowerCase();

    const items = Array.isArray(data.products) ? data.products : [];
    if (!items.length) {
      grid.innerHTML = `<p>No products found for this brand yet.</p>`;
      return;
    }

    grid.innerHTML = items.map(renderCard).join("");
  } catch (err) {
    console.error("Error loading brand products", err);
    grid.innerHTML = `<p>We couldn't load this brand right now. Please try again later.</p>`;
  }
}

load();
