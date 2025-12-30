// Header specific logic (si mañana agregas burger menu, va acá)

window.addEventListener('languageChanged', (e) => {
  const lang = e.detail;

  document
    .querySelectorAll('.lang-switch button')
    .forEach(btn => {
      btn.classList.toggle('active', btn.dataset.lang === lang);
    });
});
