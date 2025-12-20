// --------------------
// CANVAS SETUP
// --------------------
const canvas = new fabric.Canvas('canvas', {
  selection: true,
  preserveObjectStacking: true
});

canvas.setHeight(500);
canvas.setWidth(window.innerWidth - 20);

// --------------------
// STATE
// --------------------
let currentTool = null;
let waitingForTextPlacement = false;
let backgroundLocked = true;
let zoomLevel = 1;

let colors = ['black', 'blue', 'red', 'green', 'yellow'];
let colorIndex = 0;

// Undo / Redo
let history = [];
let historyStep = -1;

function saveHistory() {
  history = history.slice(0, historyStep + 1);
  history.push(JSON.stringify(canvas.toJSON()));
  historyStep++;
}

canvas.on('object:added', saveHistory);
canvas.on('object:modified', saveHistory);
canvas.on('object:removed', saveHistory);

// --------------------
// TOOL UI HIGHLIGHT
// --------------------
function highlightTool(tool) {
  document.querySelectorAll('.toolbar button').forEach(b => {
    b.classList.remove('active');
  });
  const btn = document.getElementById(`tool-${tool}`);
  if (btn) btn.classList.add('active');
}

// --------------------
// TOOL SELECTION
// --------------------
function setTool(tool) {
  currentTool = tool;
  waitingForTextPlacement = false;
  canvas.isDrawingMode = false;

  highlightTool(tool);

  if (tool === 'text') {
    waitingForTextPlacement = true;
  }

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
}

// --------------------
// PLACE TEXT / ERASE
// --------------------
canvas.on('mouse:down', function (opt) {
  if (currentTool === 'erase') {
    if (opt.target && opt.target !== canvas.backgroundImage) {
      canvas.remove(opt.target);
    }
    return;
  }

  if (!waitingForTextPlacement) return;

  const pointer = canvas.getPointer(opt.e);
  const text = new fabric.IText('Type here', {
    left: pointer.x,
    top: pointer.y,
    fill: colors[colorIndex],
    fontSize: 24
  });

  canvas.add(text);
  canvas.setActiveObject(text);
  text.enterEditing();
  text.hiddenTextarea.focus();

  waitingForTextPlacement = false;
  currentTool = null;
});

// --------------------
// TEXT SIZE CONTROLS
// --------------------
function increaseText() {
  const obj = canvas.getActiveObject();
  if (obj && obj.type === 'i-text') {
    obj.fontSize += 2;
    canvas.renderAll();
  }
}

function decreaseText() {
  const obj = canvas.getActiveObject();
  if (obj && obj.type === 'i-text' && obj.fontSize > 10) {
    obj.fontSize -= 2;
    canvas.renderAll();
  }
}

// --------------------
// COLOR CYCLING
// --------------------
function cycleColor() {
  colorIndex = (colorIndex + 1) % colors.length;

  if (canvas.isDrawingMode && canvas.freeDrawingBrush) {
    canvas.freeDrawingBrush.color = colors[colorIndex];
  }

  const obj = canvas.getActiveObject();
  if (obj && obj.set) {
    obj.set('fill', colors[colorIndex]);
    canvas.renderAll();
  }
}

// --------------------
// UNDO / REDO
// --------------------
function undo() {
  if (historyStep > 0) {
    historyStep--;
    canvas.loadFromJSON(history[historyStep], canvas.renderAll.bind(canvas));
  }
}

function redo() {
  if (historyStep < history.length - 1) {
    historyStep++;
    canvas.loadFromJSON(history[historyStep], canvas.renderAll.bind(canvas));
  }
}

// --------------------
// IMAGE UPLOAD (LOCKABLE)
// --------------------
document.getElementById('fileInput').addEventListener('change', e => {
  const reader = new FileReader();

  reader.onload = f => {
    fabric.Image.fromURL(f.target.result, img => {
      canvas.clear();

      const scale = Math.min(
        canvas.width / img.width,
        canvas.height / img.height
      );

      img.set({
        selectable: !backgroundLocked,
        evented: !backgroundLocked
      });

      canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas), {
        scaleX: scale,
        scaleY: scale,
        originX: 'center',
        originY: 'center',
        left: canvas.width / 2,
        top: canvas.height / 2
      });
    });
  };

  reader.readAsDataURL(e.target.files[0]);
});

function toggleBackgroundLock() {
  backgroundLocked = !backgroundLocked;
  if (canvas.backgroundImage) {
    canvas.backgroundImage.selectable = !backgroundLocked;
    canvas.backgroundImage.evented = !backgroundLocked;
  }
  alert(backgroundLocked ? 'Background locked' : 'Background unlocked');
}

// --------------------
// ZOOM
// --------------------
function zoomIn() {
  zoomLevel = Math.min(2, zoomLevel + 0.1);
  canvas.setZoom(zoomLevel);
}

function zoomOut() {
  zoomLevel = Math.max(0.5, zoomLevel - 0.1);
  canvas.setZoom(zoomLevel);
}

// --------------------
// EXPORT / SAVE
// --------------------
function exportImage() {
  const dataURL = canvas.toDataURL({ format: 'png' });
  const link = document.createElement('a');
  link.download = 'annotated.png';
  link.href = dataURL;
  link.click();
}

function saveDoc() {
  localStorage.setItem('savedCanvas', JSON.stringify(canvas.toJSON()));
  alert('Saved on this device');
}

// --------------------
// LIGHT / DARK MODE
// --------------------
const toggle = document.getElementById('themeToggle');
toggle.onclick = () => {
  document.body.classList.toggle('dark');
  document.body.classList.toggle('light');
};
