// src/brand-detail.js

function getSlugFromQueryOrPath(){
  const u = new URL(location.href);
  const slug = u.searchParams.get('slug');
  if (slug) return slug;
  const parts = u.pathname.split('/').filter(Boolean);
  return parts[parts.length-1]; // /brands/:slug -> slug
}
const slug = getSlugFromQueryOrPath();

function esc(s=''){
  return String(s)
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;')
    .replaceAll("'",'&#39;');
}

function availabilityClass(text){
  const t = (text || '').toString().trim().toLowerCase();
  if (t === 'y' || t.includes('available') || t.includes('in stock')) return 'is-available';
  return 'is-unavailable';
}
function availabilityLabel(text){
  const t = (text || '').toString().trim().toLowerCase();
  return (t === 'y' || t.includes('available') || t.includes('in stock')) ? 'Available' : 'Not available';
}

function productCard(p){
  const part = p.part_number || p.title || 'N/A';
  const availText = availabilityLabel(p.availability);
  const availCls = availabilityClass(p.availability);
  const imgSrc = '/img/placeholders/product-servo.png'; // placeholder común

  return `
    <article class="product-card">
      <img class="product-thumb" src="${imgSrc}" alt="Product image">
      <h3 class="part-number">${esc(part)}</h3>
      <span class="availability-pill ${availCls}">${esc(availText)}</span>
      <a class="btn-outline" href="#quote">Request a quote</a>
    </article>
  `;
}

async function load() {
  const res = await fetch(`/api/brands/${slug}`);
  if (!res.ok) {
    document.getElementById('brand-title').textContent = 'Brand not found';
    return;
  }
  const data = await res.json(); // {brand:{slug,name}, products:[...]}
  document.title = `${data.brand.name} | UptimeLegacy`;
  document.getElementById('brand-title').textContent = data.brand.name;

  const grid = document.getElementById('product-grid');
  grid.innerHTML = data.products.map(productCard).join('');
}

// Lang toggler (conserva tu comportamiento actual)
const btnEn = document.getElementById('btn-en');
const btnEs = document.getElementById('btn-es');
function applyLanguage(lang){
  document.documentElement.lang = lang === 'es' ? 'es' : 'en';
  btnEn?.classList.toggle('active', lang==='en');
  btnEs?.classList.toggle('active', lang==='es');
  localStorage.setItem('UL_LANG', lang);
}
btnEn?.addEventListener('click', ()=>applyLanguage('en'));
btnEs?.addEventListener('click', ()=>applyLanguage('es'));
applyLanguage(localStorage.getItem('UL_LANG')||'en');

load();
