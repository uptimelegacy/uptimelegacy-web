(function () {
  const container = document.getElementById('legal-content');
  if (!container) return;

  function getPageKey() {
    const path = window.location.pathname;
    if (path.includes('privacy')) return 'privacy';
    if (path.includes('cookies')) return 'cookies';
    if (path.includes('terms')) return 'terms';
    return null;
  }

  function getLang() {
    // 1️⃣ fuente principal: atributo <html lang="">
    const htmlLang = document.documentElement.lang;
    if (htmlLang) return htmlLang;

    // 2️⃣ fallback: localStorage
    return localStorage.getItem('lang') || 'en';
  }


  async function loadLegalContent() {
    const page = getPageKey();
    const lang = getLang();
    if (!page) return;

    container.innerHTML = '<p>Loading...</p>';

    try {
      const res = await fetch(`/api/legal?page=${page}&lang=${lang}`);
      const sections = await res.json();

      container.innerHTML = '';

      sections.forEach(section => {
        const block = document.createElement('section');
        block.className = 'legal-section';

        block.innerHTML = `
          <h2>${section.title}</h2>
          <div class="legal-content">
            ${section.content
            .replace(/<br\s*\/?>/gi, '')
            .replace(/<p>\s*<\/p>/gi, '')
            }
          </div>
        `;

        container.appendChild(block);
      });
    } catch (err) {
      console.error('LEGAL LOAD ERROR', err);
      container.innerHTML = '<p>Error loading content.</p>';
    }
  }

  // Initial load
  document.addEventListener('DOMContentLoaded', loadLegalContent);

  // Re-load when language changes
  window.addEventListener('languageChanged', loadLegalContent);
})();
