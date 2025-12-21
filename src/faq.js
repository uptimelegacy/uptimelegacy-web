const tabs = document.querySelectorAll('.faq-tab');
const list = document.getElementById('faq-list');

function getLang() {
  return localStorage.getItem('lang') || 'en';
}

async function loadFAQ(category) {
  const lang = getLang();
  list.innerHTML = 'Loading...';

  const res = await fetch(`/api/faqs?category=${category}&lang=${lang}`);
  const data = await res.json();

  list.innerHTML = '';

  data.forEach(item => {
    const div = document.createElement('div');
    div.className = 'faq-item';
    div.innerHTML = `
      <div class="faq-question">
        <span>${item.question}</span>
        <i class="ri-arrow-down-s-line"></i>
      </div>
      <div class="faq-answer">${item.answer}</div>
    `;
    div.querySelector('.faq-question').onclick = () =>
      div.classList.toggle('open');
    list.appendChild(div);
  });
}

function activateCategory(cat) {
  tabs.forEach(t => t.classList.toggle('active', t.dataset.cat === cat));
  loadFAQ(cat);
}

// Tabs
tabs.forEach(tab => {
  tab.onclick = () => {
    history.replaceState(null, '', `#${tab.dataset.cat}`);
    activateCategory(tab.dataset.cat);
  };
});

// Hash
window.addEventListener('hashchange', () => {
  activateCategory(location.hash.replace('#', '') || 'payments');
});

// 🔔 idioma cambiado (CLAVE)
window.addEventListener('languageChanged', () => {
  const active = document.querySelector('.faq-tab.active');
  if (active) loadFAQ(active.dataset.cat);
});

// Init
activateCategory(location.hash.replace('#', '') || 'payments');
