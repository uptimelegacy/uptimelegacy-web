(async function () {
  const placeholder = document.getElementById('header-placeholder');
  if (!placeholder) return;

  let headerScriptLoaded = false;

  async function loadHeader() {
    // 1. Cargar HTML del header
    const res = await fetch('/src/components/header/header.html');
    const html = await res.text();
    placeholder.innerHTML = html;

    // 2. Cargar JS del header DESPUÉS de inyectar el HTML
    // Evitamos duplicar scripts innecesariamente
    if (!headerScriptLoaded) {
      const script = document.createElement('script');
      script.src = '/src/components/header/header.js';
      script.defer = true;
      document.body.appendChild(script);
      headerScriptLoaded = true;
    } else {
      // Si el script ya existe, forzamos re-bind manual
      if (window.updateOrderQuoteBadge) {
        window.updateOrderQuoteBadge();
      }
    }

    // 3. Forzar sync con idioma actual (se conserva)
    if (window.setLanguage) {
      const lang = localStorage.getItem('UL_LANG') || 'en';
      window.setLanguage(lang);
    }
  }

  // Primera carga
  await loadHeader();

  /**
   * Hook de seguridad:
   * Si el sitio hace navegación parcial (fetch / replace),
   * este evento puede dispararse manualmente desde donde corresponda.
   * NO rompe nada si nunca se usa.
   */
  document.addEventListener('header:reload', loadHeader);
})();
