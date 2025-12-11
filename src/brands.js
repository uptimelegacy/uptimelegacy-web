// src/brands.js

const byId = (id) => document.getElementById(id);
const featured = byId('featured');
const list = byId('brand-list');
const q = byId('q');
const alpha = byId('alpha');

// === 1) Featured estáticas (mismas que en Home, desagregando ABB/Lenze/Yaskawa) ===
const FEATURED_BRANDS = [
  { label: "Siemens", slug: "siemens" },
  { label: "Allen-Bradley", slug: "allen-bradley" },
  { label: "Schneider Electric", slug: "schneider" },
  { label: "Mitsubishi Electric", slug: "mitsubishi" },
  { label: "Omron", slug: "omron" },
  { label: "ABB", slug: "abb" },
  { label: "Lenze", slug: "lenze" },
  { label: "Yaskawa", slug: "yaskawa" }
];

// === 2) Render de featured (NO viene de DB) ===
function featuredCard(b) {
  const a = document.createElement('a');
  a.className = 'brand-card';
  a.href = `/brands/${b.slug}`;
  a.textContent = b.label;
  a.setAttribute('aria-label', b.label);
  return a;
}
function renderFeatured() {
  if (!featured) return;
  featured.innerHTML = '';
  FEATURED_BRANDS.forEach(b => featured.appendChild(featuredCard(b)));
}

// === 3) Filtro A-Z y buscador (SIGUEN con DB) ===
const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
letters.forEach(L => {
  const b = document.createElement('button');
  b.textContent = L;
  b.addEventListener('click', () => render(all.filter(x => x.name.toUpperCase().startsWith(L))));
  alpha.appendChild(b);
});

let all = [];
async function load() {
  const res = await fetch('/api/brands');
  const data = await res.json();
  all = data; // [{slug,name}]
  // IMPORTANTE: featured ahora se pinta de la constante, NO de data
  renderFeatured();
  render(all);
}

// para la lista (DB)
function brandCardDB(b) {
  const a = document.createElement('a');
  a.href = `/brands/${b.slug}`;
  a.textContent = b.name;
  return a;
}
function render(arr) {
  list.innerHTML = '';
  arr.forEach(b => list.appendChild(brandCardDB(b)));
}

// buscador (DB)
q?.addEventListener('input', (e) => {
  const s = e.target.value.toLowerCase();
  render(all.filter(x => x.name.toLowerCase().includes(s) || x.slug.includes(s)));
});

// Lang toggler (reutiliza tu diccionario)
const btnEn = document.getElementById('btn-en');
const btnEs = document.getElementById('btn-es');
function applyLanguage(lang){
  document.documentElement.lang = lang === 'es' ? 'es' : 'en';
  document.querySelectorAll('[data-i18n]').forEach(el=>{
    const key = el.getAttribute('data-i18n');
    const value = window.I18N?.[lang]?.[key];
    if(value) el.innerHTML = value;
  });
  btnEn?.classList.toggle('active', lang==='en');
  btnEs?.classList.toggle('active', lang==='es');
  localStorage.setItem('UL_LANG', lang);
}
btnEn?.addEventListener('click', ()=>applyLanguage('en'));
btnEs?.addEventListener('click', ()=>applyLanguage('es'));
applyLanguage(localStorage.getItem('UL_LANG')||'en');

load();
