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

let currentTool = null;
let colors = ['black', 'blue', 'red', 'green', 'yellow'];
let colorIndex = 0;

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

document.addEventListener('keydown', function (e) {
  if (e.key === 'Delete' || e.key === 'Backspace') {
    const obj = canvas.getActiveObject();
    if (obj) {
      canvas.remove(obj);
    }
  }
});


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

function cycleColor() {
  colorIndex = (colorIndex + 1) % colors.length;
}

document.getElementById('fileInput').addEventListener('change', e => {
  const reader = new FileReader();
  reader.onload = f => {
    fabric.Image.fromURL(f.target.result, img => {
      canvas.clear();
      canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas), {
        scaleX: canvas.width / img.width,
        scaleY: canvas.height / img.height
      });
    });
  };
  reader.readAsDataURL(e.target.files[0]);
});

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

window.onload = () => {
  const saved = localStorage.getItem('savedCanvas');
  if (saved) canvas.loadFromJSON(saved, canvas.renderAll.bind(canvas));
};

// Light / Dark toggle
const toggle = document.getElementById('themeToggle');
toggle.onclick = () => {
  document.body.classList.toggle('dark');
  document.body.classList.toggle('light');
  toggle.textContent =
    document.body.classList.contains('dark')
      ? '☀️ Light Mode'
      : '🌙 Dark Mode';
};
