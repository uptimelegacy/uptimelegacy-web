(async function(){
  const placeholder = document.getElementById('header-placeholder');
  if(!placeholder) return;

  const res = await fetch('/src/components/header/header.html');
  placeholder.innerHTML = await res.text();

  // Forzar sync con idioma actual
  if (window.setLanguage) {
    const lang = localStorage.getItem('UL_LANG') || 'en';
    window.setLanguage(lang);
  }
})();
