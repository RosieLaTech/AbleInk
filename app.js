// Create canvas
const canvas = new fabric.Canvas('canvas', {
  isDrawingMode: false,
  selection: true
});

// Set canvas size
canvas.setHeight(500);
canvas.setWidth(window.innerWidth - 20);

// Tool state
let currentTool = null;
let colors = ['black', 'blue', 'red', 'green', 'yellow'];
let colorIndex = 0;

// --------------------
// TOOL SELECTION
// --------------------
function setTool(tool) {
  currentTool = tool;
  canvas.isDrawingMode = false;

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

// --------------------
// ADD TEXT (AUTO KEYBOARD)
// --------------------
canvas.on('mouse:down', function (opt) {
  if (currentTool === 'text') {
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
  }
});

// --------------------
// DELETE TEXT / OBJECTS
// --------------------
document.addEventListener('keydown', function (e) {
  if (e.key === 'Delete' || e.key === 'Backspace') {
    const obj = canvas.getActiveObject();
    if (obj) {
      canvas.remove(obj);
    }
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
// IMAGE / DOCUMENT UPLOAD (NO SQUISHING)
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
// EXPORT IMAGE
// --------------------
function exportImage() {
  const dataURL = canvas.toDataURL({ format: 'png' });
  const link = document.createElement('a');
  link.download = 'annotated.png';
  link.href = dataURL;
  link.click();
}

// --------------------
// SAVE / LOAD (LOCAL DEVICE)
// --------------------
function saveDoc() {
  localStorage.setItem('savedCanvas', JSON.stringify(canvas.toJSON()));
  alert('Saved on this device');
}

window.onload = () => {
  const saved = localStorage.getItem('savedCanvas');
  if (saved) {
    canvas.loadFromJSON(saved, () => {
      canvas.renderAll();
    });
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
