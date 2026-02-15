const board = document.getElementById('board');
const newNoteBtn = document.getElementById('newNoteBtn');
const template = document.getElementById('noteTemplate');

const PASTEL_COLORS = ['#fde68a', '#fecdd3', '#bfdbfe', '#c7f9cc', '#ddd6fe'];
const MIN_WIDTH = 180;
const MIN_HEIGHT = 140;

function randomPastel() {
  return PASTEL_COLORS[Math.floor(Math.random() * PASTEL_COLORS.length)];
}

async function request(url, options = {}) {
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });

  if (!response.ok && response.status !== 204) {
    const error = await response.json().catch(() => ({ message: 'Error de servidor.' }));
    throw new Error(error.message || 'Error de servidor.');
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getBoardLimits() {
  return {
    width: board.scrollWidth,
    height: board.scrollHeight
  };
}

function applyPositionAndSize(noteEl, note) {
  noteEl.style.left = `${note.x}px`;
  noteEl.style.top = `${note.y}px`;
  noteEl.style.width = `${note.width}px`;
  noteEl.style.height = `${note.height}px`;
}

function makeInteractive(noteEl, note) {
  const dragHandle = noteEl.querySelector('.drag-handle');
  const resizeHandle = noteEl.querySelector('.resize-handle');
  const textArea = noteEl.querySelector('.note-text');
  const deleteBtn = noteEl.querySelector('.delete-btn');

  let dragging = false;
  let resizing = false;
  let startX = 0;
  let startY = 0;
  let startLeft = 0;
  let startTop = 0;
  let startWidth = 0;
  let startHeight = 0;

  textArea.addEventListener('input', async () => {
    note.text = textArea.value;
    await request(`/api/notes/${note.id}`, {
      method: 'PUT',
      body: JSON.stringify({ text: note.text })
    });
  });

  deleteBtn.addEventListener('click', async () => {
    await request(`/api/notes/${note.id}`, { method: 'DELETE' });
    noteEl.remove();
  });

  const onPointerMove = (event) => {
    const limits = getBoardLimits();

    if (dragging) {
      const nextX = clamp(startLeft + (event.clientX - startX), 0, limits.width - note.width);
      const nextY = clamp(startTop + (event.clientY - startY), 0, limits.height - note.height);
      note.x = nextX;
      note.y = nextY;
      applyPositionAndSize(noteEl, note);
    }

    if (resizing) {
      note.width = clamp(startWidth + (event.clientX - startX), MIN_WIDTH, limits.width - note.x);
      note.height = clamp(startHeight + (event.clientY - startY), MIN_HEIGHT, limits.height - note.y);
      applyPositionAndSize(noteEl, note);
    }
  };

  const onPointerUp = async () => {
    if (dragging || resizing) {
      dragging = false;
      resizing = false;
      await request(`/api/notes/${note.id}`, {
        method: 'PUT',
        body: JSON.stringify({ x: note.x, y: note.y, width: note.width, height: note.height })
      });
    }

    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
  };

  dragHandle.addEventListener('pointerdown', (event) => {
    dragging = true;
    startX = event.clientX;
    startY = event.clientY;
    startLeft = note.x;
    startTop = note.y;
    dragHandle.style.cursor = 'grabbing';
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp, { once: true });
  });

  resizeHandle.addEventListener('pointerdown', (event) => {
    resizing = true;
    startX = event.clientX;
    startY = event.clientY;
    startWidth = note.width;
    startHeight = note.height;
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp, { once: true });
    event.stopPropagation();
  });

  window.addEventListener('pointerup', () => {
    dragHandle.style.cursor = 'grab';
  });
}

function renderNote(note) {
  const fragment = template.content.cloneNode(true);
  const noteEl = fragment.querySelector('.note');
  const textArea = fragment.querySelector('.note-text');

  noteEl.dataset.id = note.id;
  noteEl.style.backgroundColor = note.color;
  textArea.value = note.text;
  applyPositionAndSize(noteEl, note);
  makeInteractive(noteEl, note);

  board.appendChild(fragment);
}

async function loadNotes() {
  const notes = await request('/api/notes');
  notes.forEach(renderNote);
}

newNoteBtn.addEventListener('click', async () => {
  const boardRect = board.getBoundingClientRect();

  const note = await request('/api/notes', {
    method: 'POST',
    body: JSON.stringify({
      text: '',
      color: randomPastel(),
      x: Math.max(20, boardRect.width * 0.1),
      y: Math.max(20, boardRect.height * 0.1),
      width: 260,
      height: 220
    })
  });

  renderNote(note);
});

loadNotes().catch((error) => {
  console.error(error);
  alert('No se pudieron cargar las notas. Revisa el servidor.');
});
