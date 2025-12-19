// --------------------
// CANVAS SETUP
// --------------------
const canvas = new fabric.Canvas('canvas', {
  isDrawingMode: false,
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
  canvas.isDrawingMode = false;
  waitingForTextPlacement = false;

  if (tool === 'text') {
    waitingForTextPlacement = true;
    return;
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

  if (tool === 'erase') {
    canvas.isDrawingMode = true;
    canvas.freeDrawingBrush = new fabric.EraserBrush(canvas);
    canvas.freeDrawingBrush.width = 20;
  }
}

// --------------------
// PLACE TEXT (ONE TIME ONLY)
// --------------------
canvas.on('mouse:down', function (opt) {
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

  // Turn off text mode after one placement
  waitingForTextPlacement = false;
  currentTool = null;
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
// IMAGE / DOCUMENT UPLOAD (NO DISTORTION)
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
const t

