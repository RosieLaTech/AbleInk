// --------------------
// CANVAS SETUP
// --------------------
const canvas = new fabric.Canvas('canvas', {
  selection: true
});

canvas.setHeight(500);
canvas.setWidth(window.innerWidth - 20);

// --------------------
// STATE
// --------------------
let currentTool = null;
let waitingForTextPlacement = false;

let colors = ['black', 'blue', 'red', 'green', 'yellow'];
let colorIndex = 0;

// --------------------
// TOOL SELECTION
// --------------------
function setTool(tool) {
  currentTool = tool;
  waitingForTextPlacement = false;
  canvas.isDrawingMode = false;
}

// --------------------
// DRAWING TOOLS
// --------------------
function enablePencil() {
  canvas.isDrawingMode = true;
  canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
  canvas.freeDrawingBrush.color = colors[colorIndex];
  canvas.freeDrawingBrush.width = 3;
}

function enableHighlight() {
  canvas.isDrawingMode = true;
  canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
  canvas.freeDrawingBrush.color = 'rgba(255,255,0,0.4)';
  canvas.freeDrawingBrush.width = 15;
}

// --------------------
// BUTTON HANDLERS
// --------------------
function setTool(tool) {
  currentTool = tool;
  canvas.isDrawingMode = false;
  waitingForTextPlacement = false;

  if (tool === 'text') {
    waitingForTextPlacement = true;
  }

  if (tool === 'pencil') {
    enablePencil();
  }

  if (tool === 'highlight') {
    enableHighlight();
  }
}

// --------------------
// PLACE TEXT (ONE TIME)
// --------------------
canvas.on('mouse:down', function (opt) {
  if (currentTool === 'erase') {
    const target = opt.target;
    if (target) {
      canvas.remove(target);
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
// KEYBOARD DELETE
// --------------------
document.addEventListener('keydown', e => {
  if (e.key === 'Delete' || e.key === 'Backspace') {
    const obj = canvas.getActiveObject();
    if (obj) canvas.remove(obj);
  }
});

// --------------------
// COLOR CYCLING
// --------------------
function cycleColor() {
  colorIndex = (colorIndex + 1) % colors.length;

  if (canvas.isDrawingMode && canvas.freeDrawingBrush) {
    canvas.freeDrawingBrush.color = colors[colorIndex];
  }
}

// --------------------
// IMAGE UPLOAD (NO DISTORTION)
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

// --------------------
// EXPORT
// --------------------
function exportImage() {
  const dataURL = canvas.toDataURL({ format: 'png' });
  const link = document.createElement('a');
  link.download = 'annotated.png';
  link.href = dataURL;
  link.click();
}

// --------------------
// SAVE / LOAD
// --------------------
function saveDoc() {
  localStorage.setItem('savedCanvas', JSON.stringify(canvas.toJSON()));
  alert('Saved on this device');
}

window.onload = () => {
  const saved = localStorage.getItem('savedCanvas');
  if (saved) {
    canvas.loadFromJSON(saved, canvas.renderAll.bind(canvas));
  }
};

// --------------------
// LIGHT / DARK MODE
// --------------------
const toggle = document.getElementById('themeToggle');
toggle.onclick = () => {
  document.body.classList.toggle('dark');
  document.body.classList.toggle('light');
  toggle.textContent =
    document.body.classList.contains('dark')
      ? '☀️ Light Mode'
      : '🌙 Dark Mode';
};
