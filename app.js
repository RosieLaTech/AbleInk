// --------------------
// GLOBAL STATE
// --------------------
let canvas;
let currentTool = null;
let waitingForTextPlacement = false;

let colors = ['black', 'blue', 'red', 'green', 'orange'];
let colorIndex = 0;

let currentDocId = null;
let autosaveTimer = null;

let pdfDoc = null;
let currentPage = 1;

// --------------------
// STUDENT ID (DEVICE-SPECIFIC)
// --------------------
let studentID = localStorage.getItem('studentID');
if (!studentID) {
  studentID = 'student-' + Math.floor(Math.random() * 100000);
  localStorage.setItem('studentID', studentID);
  console.log('Assigned new studentID:', studentID);
}

// --------------------
// INIT CANVAS
// --------------------
function initCanvas() {
  canvas = new fabric.Canvas('canvas', {
    preserveObjectStacking: true
  });

  canvas.setHeight(window.innerHeight - 100);
  canvas.setWidth(window.innerWidth - 20);

  canvas.on('object:added', autosave);
  canvas.on('object:modified', autosave);
  canvas.on('object:removed', autosave);
}

window.onload = () => {
  initCanvas();
  loadLibrary();
};

// --------------------
// SCREENS
// --------------------
function goHome() {
  document.getElementById('editorScreen').classList.add('hidden');
  document.getElementById('libraryScreen').classList.remove('hidden');
  loadLibrary();
}

function openEditor() {
  document.getElementById('libraryScreen').classList.add('hidden');
  document.getElementById('editorScreen').classList.remove('hidden');
}

// --------------------
// LIBRARY WITH THUMBNAILS
// --------------------
function loadLibrary() {
  const list = document.getElementById('docList');
  list.innerHTML = '';

  Object.keys(localStorage)
    .filter(k => k.startsWith(`${studentID}-doc-`) && !k.endsWith('-thumb'))
    .forEach(key => {
      const thumbKey = `${key}-thumb`;
      const thumbData = localStorage.getItem(thumbKey);

      const item = document.createElement('div');
      item.className = 'docItem';
      item.innerHTML = `
        <img src="${thumbData || 'placeholder.png'}" style="width:80px; height:60px; object-fit:cover; margin-right:10px;">
        <span>${key.replace(`${studentID}-doc-`, '')}</span>
        <button onclick="deleteDoc('${key}')">🗑</button>
      `;
      item.onclick = () => loadDoc(key);
      list.appendChild(item);
    });
}

// --------------------
// CREATE / LOAD / DELETE DOCUMENT
// --------------------
function createNewDoc() {
  const name = prompt('Document name?');
  if (!name) return;

  currentDocId = `${studentID}-doc-${name}`;
  canvas.clear();
  saveDoc();
  openEditor();
}

function loadDoc(id) {
  currentDocId = id;
  const data = localStorage.getItem(id);
  canvas.loadFromJSON(data, canvas.renderAll.bind(canvas));
  openEditor();
}

function deleteDoc(id) {
  localStorage.removeItem(id);
  localStorage.removeItem(`${id}-thumb`);
  loadLibrary();
}

// --------------------
// AUTOSAVE + THUMBNAIL
// --------------------
function autosave() {
  document.getElementById('autosaveStatus').textContent = 'Saving…';

  clearTimeout(autosaveTimer);
  autosaveTimer = setTimeout(() => {
    saveDoc();
    document.getElementById('autosaveStatus').textContent = 'Saved ✓';
  }, 500);
}

function saveDoc() {
  if (!currentDocId) return;

  // Save canvas JSON
  localStorage.setItem(currentDocId, JSON.stringify(canvas.toJSON()));

  // Save thumbnail AFTER canvas is fully rendered
  const tempCanvas = new fabric.StaticCanvas(null, {
    width: 160,
    height: 120
  });
  const json = canvas.toJSON();
  tempCanvas.loadFromJSON(json, () => {
    const thumb = tempCanvas.toDataURL({ format: 'png' });
    localStorage.setItem(`${currentDocId}-thumb`, thumb);
  });
}

// --------------------
// TOOLS
// --------------------
function setTool(tool) {
  currentTool = tool;
  canvas.isDrawingMode = false;
  waitingForTextPlacement = false;

  document.querySelectorAll('.toolbar button').forEach(b => b.classList.remove('active'));
  const btn = document.getElementById(`tool-${tool}`);
  if (btn) btn.classList.add('active');

  if (tool === 'text') waitingForTextPlacement = true;

  if (tool === 'pencil') {
    canvas.isDrawingMode = true;
    canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
    canvas.freeDrawingBrush.color = colors[colorIndex];
    canvas.freeDrawingBrush.width = 3;
  }

  if (tool === 'highlight') {
    canvas.isDrawingMode = true;
    canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
    canvas.freeDrawingBrush.color = 'rgba(255,255,0,0.4)';
    canvas.freeDrawingBrush.width = 15;
  }

  if (tool === 'erase') {
    canvas.isDrawingMode = true;
    canvas.freeDrawingBrush = new fabric.EraserBrush(canvas);
    canvas.freeDrawingBrush.width = 20;
  }
}

canvas.on('mouse:down', opt => {
  if (currentTool === 'erase' && opt.target) {
    canvas.remove(opt.target);
    return;
  }

  if (!waitingForTextPlacement) return;

  const p = canvas.getPointer(opt.e);
  const text = new fabric.IText('Type here', {
    left: p.x,
    top: p.y,
    fontSize: 24,
    fill: colors[colorIndex]
  });

  canvas.add(text);
  text.enterEditing();
  waitingForTextPlacement = false;
});

// --------------------
// COLORS
// --------------------
function cycleColor() {
  colorIndex = (colorIndex + 1) % colors.length;
  if (canvas.freeDrawingBrush) canvas.freeDrawingBrush.color = colors[colorIndex];
}

// --------------------
// UNDO / REDO
// --------------------
let history = [];
let step = -1;

function saveHistory() {
  history = history.slice(0, step + 1);
  history.push(JSON.stringify(canvas.toJSON()));
  step++;
}

canvas.on('object:added', saveHistory);

function undo() {
  if (step > 0) {
    step--;
    canvas.loadFromJSON(history[step], canvas.renderAll.bind(canvas));
  }
}

function redo() {
  if (step < history.length - 1) {
    step++;
    canvas.loadFromJSON(history[step], canvas.renderAll.bind(canvas));
  }
}

// --------------------
// ZOOM
// --------------------
let zoom = 1;
function zoomIn() {
  zoom = Math.min(2, zoom + 0.1);
  canvas.setZoom(zoom);
}
function zoomOut() {
  zoom = Math.max(0.5, zoom - 0.1);
  canvas.setZoom(zoom);
}

// --------------------
// IMAGE / PDF IMPORT
// --------------------
document.getElementById('fileInput').addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;

  if (file.type === 'application/pdf') {
    pdfjsLib.getDocument(URL.createObjectURL(file)).promise.then(pdf => {
      pdfDoc = pdf;
      currentPage = 1;
      renderPdfPage();
    });
  } else {
    const reader = new FileReader();
    reader.onload = f => {
      fabric.Image.fromURL(f.target.result, img => {
        canvas.clear();
        const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
        canvas.setBackgroundImage(img, () => {
          canvas.renderAll();
          saveDoc(); // save thumbnail after image fully loads
        }, {
          scaleX: scale,
          scaleY: scale,
          originX: 'center',
          originY: 'center',
          left: canvas.width / 2,
          top: canvas.height / 2
        });
      });
    };
    reader.readAsDataURL(file);
  }
});

function renderPdfPage() {
  pdfDoc.getPage(currentPage).then(page => {
    const viewport = page.getViewport({ scale: 2 });
    const temp = document.createElement('canvas');
    const ctx = temp.getContext('2d');

    temp.width = viewport.width;
    temp.height = viewport.height;

    page.render({ canvasContext: ctx, viewport }).promise.then(() => {
      fabric.Image.fromURL(temp.toDataURL(), img => {
        canvas.clear();
        const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
        canvas.setBackgroundImage(img, () => canvas.renderAll(), {
          scaleX: scale,
          scaleY: scale,
          originX: 'center',
          originY: 'center',
          left: canvas.width / 2,
          top: canvas.height / 2
        });
      });
    });
  });
}

function nextPage() {
  if (pdfDoc && currentPage < pdfDoc.numPages) {
    currentPage++;
    renderPdfPage();
  }
}

function prevPage() {
  if (pdfDoc && currentPage > 1) {
    currentPage--;
    renderPdfPage();
  }
}
