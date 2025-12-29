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

let rendered = false;

async function renderFooterBrands() {
  if (rendered) return true;

  const container = document.getElementById('footer-brands');
  if (!container) return false;

  // Seguridad extra: evitar duplicados aunque alguien toque el DOM
  if (container.children.length > 0) {
    rendered = true;
    return true;
  }

  const map = await buildNameToSlugMap();

  FOOTER_BRANDS.forEach(name => {
    const key = name.toLowerCase();
    const slug = map[key] || slugifyFallback(name);
    const a = document.createElement('a');
    a.href = `/brands/${slug}`;
    a.textContent = name;
    container.appendChild(a);
  });

  rendered = true;
  return true;
}

const observer = new MutationObserver(async () => {
  const done = await renderFooterBrands();
  if (done) observer.disconnect();
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});
