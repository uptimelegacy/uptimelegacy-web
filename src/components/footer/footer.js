import { buildNameToSlugMap, slugifyFallback } from '/src/slug-resolver.js';

const FOOTER_BRANDS = [
  "Siemens",
  "Allen-Bradley",
  "Schneider Electric",
  "Mitsubishi Electric",
  "Omron",
  "ABB",
  "Lenze",
  "Yaskawa"
];

export async function initFooterBrands() {
  const container = document.getElementById('footer-brands');
  if (!container) return;

  // seguridad absoluta
  container.innerHTML = '';

  const map = await buildNameToSlugMap();

  FOOTER_BRANDS.forEach(name => {
    const key = name.toLowerCase();
    const slug = map[key] || slugifyFallback(name);
    const a = document.createElement('a');
    a.href = `/brands/${slug}`;
    a.textContent = name;
    container.appendChild(a);
  });
}
