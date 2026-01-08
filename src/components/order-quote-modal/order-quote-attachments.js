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
        (f, i) =>
          `<li>
            ${f.name} (${(f.size / 1024 / 1024).toFixed(2)} MB)
            <button data-index="${i}" class="oq-file-remove">✕</button>
          </li>`
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
        alert('Invalid file type');
        continue;
      }

      if (totalSize() + file.size > MAX_TOTAL_SIZE) {
        alert('Total attachment size exceeds 30MB');
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

    if (!dz || !input) return;

    dz.addEventListener('click', () => input.click());

    input.addEventListener('change', e => {
      handleFiles(e.target.files);
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

  document.addEventListener('DOMContentLoaded', () => {
    bindDropzone();
  });

  document.addEventListener('order-quote:open', () => {
    renderList();
  });

  window.OrderQuoteAttachments = {
    getFiles: () => filesInMemory
  };
})();
