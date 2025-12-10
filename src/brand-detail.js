// src/brand-detail.js
function getSlugFromQueryOrPath(){
  const u = new URL(location.href);
  const slug = u.searchParams.get('slug');
  if (slug) return slug;
  const parts = u.pathname.split('/').filter(Boolean);
  return parts[parts.length-1]; // /brands/:slug -> slug
}
const slug = getSlugFromQueryOrPath();

async function load() {
  const res = await fetch(`/api/brands/${slug}`);
  if (!res.ok) { document.getElementById('brand-title').textContent = 'Brand not found'; return; }
  const data = await res.json(); // {brand:{slug,name}, products:[...]}
  document.title = `${data.brand.name} | UptimeLegacy`;
  document.getElementById('brand-title').textContent = data.brand.name;

  const grid = document.getElementById('product-grid');
  grid.innerHTML = '';
  data.products.forEach(p => {
    const div = document.createElement('div'); div.className='card';
    const h3 = document.createElement('h3'); h3.textContent = p.title || p.part_number;
    const badge = document.createElement('span');
    const isY = (p.availability||'').trim().toUpperCase()==='Y';
    badge.className = 'badge ' + (isY ? 'ok' : 'no');
    badge.textContent = isY ? 'Available' : 'Not available';
    const btn = document.createElement('button'); btn.className='btn'; btn.textContent='Request a quote';
    btn.onclick = ()=> alert(`(TODO) Open modal for ${p.part_number}`);
    div.append(h3, badge, btn);
    grid.appendChild(div);
  });
}

// lang toggler (reutiliza el diccionario)
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
