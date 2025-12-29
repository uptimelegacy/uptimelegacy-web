import { initFooterBrands } from './footer.js';

async function loadFooter() {
  const placeholder = document.getElementById('footer-placeholder');
  if (!placeholder) return;

  const res = await fetch('/src/components/footer/footer.html');
  const html = await res.text();

  placeholder.innerHTML = html;

  await initFooterBrands();
}

loadFooter();
