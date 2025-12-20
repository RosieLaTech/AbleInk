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
// LIBRARY
// --------------------
function loadLibrary() {
  const list = document.getElementById('docList');
  list.innerHTML = '';

  Object.keys(localStorage)
    .filter(k => k.startsWith(`${studentID}-doc-`))
    .forEach(key => {
      const item = document.createElement('div');
      item.className = 'docItem';
      item.innerHTML = `
        <span>${key.replace(`${studentID}-doc-`, '')}</span>
        <button onclick="deleteDoc('${key}')">🗑</button>
      `;
      item.onclick = () => loadDoc(key);
      list.appendChild(item);
    });
}

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
  loadLibrary();
}

// --------------------
// AUTOSAVE
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
  localStorage.setItem(currentDocId, JSON.stringify(canvas.toJSON()));
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
    canvas.freeD
