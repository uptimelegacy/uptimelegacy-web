import { OrderQuoteStore } from '/src/order-quote-store.js';


const MAX_FILES = 5;

function showError(message) {
  const overlay = document.getElementById('order-quote-overlay');
  if (!overlay || overlay.style.display === 'none') return;

  const rightCol = overlay.querySelector('.order-quote-right');
  if (!rightCol) return;

  let error = rightCol.querySelector('.oq-file-error-forced');
  if (!error) {
    error = document.createElement('div');
    error.className = 'oq-file-error-forced';
    error.style.cssText = `
      margin-top:10px;
      padding:10px 12px;
      border:1px solid #fecaca;
      background:#fff1f2;
      color:#991b1b;
      border-radius:8px;
      font-size:13px;
    `;
    rightCol.insertBefore(error, rightCol.querySelector('#order-quote-file-list'));
  }

  

  error.textContent = message;

  // ⏱️ auto-hide después de 5 segundos
  clearTimeout(error._hideTimer);
  error._hideTimer = setTimeout(() => {
    if (error && error.parentNode) {
      error.remove();
    }
  }, 5000);

}

async function uploadFileToBlob(file) {
    const fd = new FormData();
    fd.append('file', file);

    const res = await fetch('/api/upload-order-file', {
      method: 'POST',
      body: fd
    });

    if (!res.ok) {
      throw new Error('Upload failed');
    }

    return res.json();
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
    if (!window.OrderQuoteModal?.isOpen()) return;
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
        if (Number.isNaN(idx)) return;

        filesInMemory.splice(idx, 1);
        syncStore();
        renderList();
      });
    });
  }

  function syncStore() {
    OrderQuoteStore.setAttachments(
      filesInMemory.map(f => ({
        name: f.name,
        size: f.size,
        type: f.type,
        url: f.url
      }))
    );
  }


  async function handleFiles(selectedFiles) {
    
    if (!window.OrderQuoteModal?.isOpen()) return;
    for (const file of selectedFiles) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        showError(
          `❌ ${file.name} — Invalid file type`
        );

        continue;
      }

      if (totalSize() + file.size > MAX_TOTAL_SIZE) {
        showError(
          `❌ ${file.name} — Max size exceeded`
        );

        continue;
      }

      if (filesInMemory.length >= MAX_FILES) {
        showError("Maximum 5 files allowed");

        return;
      }

      //filesInMemory.push(file);
      try {
        const uploaded = await uploadFileToBlob(file);

        filesInMemory.push({
          name: uploaded.name,
          size: uploaded.size,
          type: uploaded.type,
          url: uploaded.url
        });
      } catch (e) {
        showError(`❌ ${file.name} — upload failed`);
      }

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
