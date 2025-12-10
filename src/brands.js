// src/brands.js
const byId = (id) => document.getElementById(id);
const featured = byId('featured');
const list = byId('brand-list');
const q = byId('q');
const alpha = byId('alpha');

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
  // featured (las 6 primeras por ahora)
  featured.innerHTML = '';
  data.slice(0,6).forEach(b => featured.appendChild(brandCard(b)));
  render(all);
}
function brandCard(b) {
  const div = document.createElement('div');
  div.className = 'brand-card';
  div.textContent = b.name;
  div.onclick = () => location.href = `/brands/${b.slug}`;
  return div;
}
function render(arr) {
  list.innerHTML = '';
  arr.forEach(b => {
    const a = document.createElement('a');
    a.href = `/brands/${b.slug}`;
    a.textContent = b.name;
    list.appendChild(a);
  });
}
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
