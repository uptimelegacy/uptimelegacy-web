function showError(message) {
  const rightCol = document.querySelector('.order-quote-right');
  if (!rightCol) {
    alert(message); // fallback absoluto
    return;
  }

  let box = rightCol.querySelector('.oq-file-error-forced');

  if (!box) {
    box = document.createElement('div');
    box.className = 'oq-file-error-forced';

    // 🔥 estilos inline IMPOSIBLES de ocultar
    box.style.cssText = `
      margin-top: 12px !important;
      padding: 12px 14px !important;
      border: 2px solid #dc2626 !important;
      background: #fff1f2 !important;
      color: #991b1b !important;
      border-radius: 8px !important;
      font-size: 14px !important;
      display: block !important;
      visibility: visible !important;
      opacity: 1 !important;
      position: relative !important;
      z-index: 99999 !important;
    `;

    // insertarlo justo después del botón Browse
    const browseBtn = document.getElementById('order-quote-browse-files');
    if (browseBtn && browseBtn.parentNode) {
      browseBtn.parentNode.insertBefore(box, browseBtn.nextSibling);
    } else {
      rightCol.appendChild(box);
    }
  }

  box.textContent = message;
  box.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}



(function () {
  const MAX_TOTAL_SIZE = 30 * 1024 * 1024; // 30MB
  const ALLOWED_TYPES = [
    'image/jpeg',
    'image/png',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];

  let filesInMemory = [];

  function totalSize() {
    return filesInMemory.reduce((sum, f) => sum + f.size, 0);
  }

  function renderList() {
    const ul = document.getElementById('order-quote-file-list');
    if (!ul) return;

    ul.innerHTML = filesInMemory
      .map(
        (f, i) => `
          <li>
            ${f.name} (${(f.size / 1024 / 1024).toFixed(2)} MB)
            <button data-index="${i}" class="oq-file-remove">✕</button>
          </li>
        `
      )
      .join('');

    ul.querySelectorAll('.oq-file-remove').forEach(btn => {
      btn.addEventListener('click', e => {
        const idx = parseInt(e.target.dataset.index, 10);
        filesInMemory.splice(idx, 1);
        syncStore();
        renderList();
      });
    });
  }

  function syncStore() {
    window.OrderQuoteStore.setAttachments(
      filesInMemory.map(f => ({
        name: f.name,
        size: f.size,
        type: f.type
      }))
    );
  }

  function handleFiles(selectedFiles) {
    for (const file of selectedFiles) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        showError(
          `❌ ${file.name} — ${window.t('order_quote.invalid_file_type') || 'Invalid file type'}`
        );
        continue;
      }

      if (totalSize() + file.size > MAX_TOTAL_SIZE) {
        showError(
          `❌ ${file.name} — ${window.t('order_quote.max_size_exceeded') || 'Max size exceeded'}`
        );
        continue;
      }

      filesInMemory.push(file);
    }

    syncStore();
    renderList();
  }

  function bindDropzone() {
    const dz = document.getElementById('order-quote-dropzone');
    const input = document.getElementById('order-quote-files');
    const browseBtn = document.getElementById('order-quote-browse-files');

    if (!dz || !input) return;
    if (dz.dataset.bound === '1') return;
    dz.dataset.bound = '1';

    // 🔗 Conectar el botón Browse con el input real
    if (browseBtn) {
      browseBtn.addEventListener('click', e => {
        e.preventDefault();
        input.click();
      });
    }


    input.addEventListener('change', () => {
      // leer SIEMPRE desde input.files
      const files = input.files;
      if (!files || !files.length) {
        // Usuario canceló el selector → NO es error
        return;
      }


      handleFiles(files);
      input.value = '';
    });



    dz.addEventListener('dragover', e => {
      e.preventDefault();
      dz.classList.add('dragover');
    });

    dz.addEventListener('dragleave', () => {
      dz.classList.remove('dragover');
    });

    dz.addEventListener('drop', e => {
      e.preventDefault();
      dz.classList.remove('dragover');
      handleFiles(e.dataTransfer.files);
    });
  }

  function initAttachmentsOnce() {
  const dz = document.getElementById('order-quote-dropzone');
  if (!dz) return;

  bindDropzone();
  renderList();
}

// 1️⃣ cuando se abre “oficialmente” el modal
document.addEventListener('order-quote:open', () => {
  setTimeout(initAttachmentsOnce, 0);
});

// 2️⃣ fallback: por si el modal se muestra sin disparar el evento
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(initAttachmentsOnce, 0);
});



  window.OrderQuoteAttachments = {
    getFiles: () => filesInMemory
  };
})();
