// ─── State ───────────────────────────────────────────
const MAX = 4;
let suggestions = Array(MAX).fill(null); // null = vacío
let deleteMode = false;
let pendingImageData = null;

// ─── Init ─────────────────────────────────────────────
renderGrid();

// ─── Grid ─────────────────────────────────────────────
function renderGrid() {
  const grid = document.getElementById('grid');
  grid.innerHTML = '';

  suggestions.forEach((s, i) => {
    const card = document.createElement('div');
    card.className = 'card ' + (s ? 'has-content' : 'empty') + (deleteMode && s ? ' delete-mode' : '');
    card.dataset.index = i;

    if (s) {
      card.innerHTML = `
        <span class="card-num">${i + 1}</span>
        <div class="card-accent-bar"></div>
        ${s.img ? `<img class="card-img" src="${s.img}" alt="imagen">` : ''}
        <div class="card-text">${escHtml(s.text)}</div>
        <span class="badge">Sugerencia ${i + 1}</span>
      `;
      if (deleteMode) card.addEventListener('click', () => deleteSuggestion(i));
    } else {
      card.innerHTML = `
        <span class="card-num">${i + 1}</span>
        <div class="empty-icon">💡</div>
        <span class="empty-label">Slot disponible</span>
      `;
    }

    grid.appendChild(card);
  });

  document.getElementById('usedCount').textContent = suggestions.filter(Boolean).length;
}

// ─── Modal ────────────────────────────────────────────
function openModal() {
  const used = suggestions.filter(Boolean).length;
  if (used >= MAX) { showToast('⚠️ Ya hay 4 sugerencias. Eliminá una para agregar otra.'); return; }
  document.getElementById('overlay').classList.add('open');
  document.getElementById('inputText').value = '';
  document.getElementById('preview-img').style.display = 'none';
  document.getElementById('inputImg').value = '';
  document.getElementById('uploadArea').style.display = 'flex';
  pendingImageData = null;
}

function closeModal() {
  document.getElementById('overlay').classList.remove('open');
}

// Close on overlay click
document.getElementById('overlay').addEventListener('click', function(e) {
  if (e.target === this) closeModal();
});

// ─── Image preview ────────────────────────────────────
function previewImage(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    pendingImageData = ev.target.result;
    const img = document.getElementById('preview-img');
    img.src = pendingImageData;
    img.style.display = 'block';
    document.getElementById('uploadArea').style.display = 'none';
  };
  reader.readAsDataURL(file);
}

// ─── Confirm ──────────────────────────────────────────
function confirmSuggestion() {
  const text = document.getElementById('inputText').value.trim();
  if (!text) { showToast('✏️ Escribí un texto para la sugerencia.'); return; }

  const idx = suggestions.findIndex(s => s === null);
  if (idx === -1) { showToast('⚠️ No hay slots disponibles.'); return; }

  suggestions[idx] = { text, img: pendingImageData || null };
  closeModal();
  renderGrid();
  showToast('✅ Sugerencia agregada en el slot ' + (idx + 1));
}

// ─── Delete mode ──────────────────────────────────────
function toggleDeleteMode() {
  const hasContent = suggestions.some(Boolean);
  if (!hasContent && !deleteMode) { showToast('ℹ️ No hay sugerencias para eliminar.'); return; }
  deleteMode = !deleteMode;
  document.getElementById('btnDel').classList.toggle('active-mode', deleteMode);
  renderGrid();
  if (deleteMode) showToast('🗑️ Hacé clic en la sugerencia que querés eliminar.');
  else showToast('✏️ Modo eliminación desactivado.');
}

function deleteSuggestion(i) {
  suggestions[i] = null;
  // Compactar: mover las no-nulas al frente
  const filled = suggestions.filter(Boolean);
  suggestions = [...filled, ...Array(MAX - filled.length).fill(null)];
  renderGrid();
  showToast('🗑️ Sugerencia eliminada.');
  if (!suggestions.some(Boolean)) {
    deleteMode = false;
    document.getElementById('btnDel').classList.remove('active-mode');
  }
}

// ─── Toast ────────────────────────────────────────────
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), 2800);
}

// ─── Utils ────────────────────────────────────────────
function escHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>');
}
