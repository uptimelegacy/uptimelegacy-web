import { initHeader } from './header.js';


async function loadHeader() {
  const placeholder = document.getElementById('header-placeholder');
  if (!placeholder) return;

  const res = await fetch('/src/components/header/header.html');
  const html = await res.text();
  placeholder.innerHTML = html;

  initHeader();

  // sync idioma (se conserva)
  if (window.setLanguage) {
    const lang = localStorage.getItem('UL_LANG') || 'en';
    window.setLanguage(lang);
  }
}

// primera carga
loadHeader();

// hook opcional
document.addEventListener('header:reload', loadHeader);
