import { createEmptyProject } from '../core/index.js';
import { drawProject } from '../renderer/index.js';

// Configuration
let width = 16;
let height = 16;

// Create a new project
let project = createEmptyProject(width, height);
// History stacks for undo/redo
let undoStack = [];
let redoStack = [];
// Update Undo/Redo button states
function updateUndoRedoButtons() {
  document.getElementById('undo').disabled = undoStack.length === 0;
  document.getElementById('redo').disabled = redoStack.length === 0;
}
// Push current state to undo stack and clear redo stack
function pushHistory() {
  undoStack.push(JSON.stringify(project));
  redoStack = [];
  updateUndoRedoButtons();
}
// Palette comes from project; data values map 1..n to palette[0..n-1]
let palette = project.palette;
// Current tool and color index (0-based)
let currentColorIndex = 0;
// Current layer index (0-based)
let currentLayerIndex = 0;

// Initialize canvas
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
// Resolution controls
const widthInput = document.getElementById('canvas-width');
const heightInput = document.getElementById('canvas-height');
document.getElementById('set-resolution').addEventListener('click', () => {
  const newWidth = parseInt(widthInput.value, 10);
  const newHeight = parseInt(heightInput.value, 10);
  if (!newWidth || !newHeight || newWidth < 1 || newHeight < 1) {
    alert('Invalid dimensions');
    return;
  }
  width = newWidth;
  height = newHeight;
  project = createEmptyProject(width, height);
  undoStack = [];
  redoStack = [];
  currentColorIndex = 0;
  currentLayerIndex = 0;
  palette = project.palette;
  renderPalette();
  renderLayers();
  renderCanvas();
  updateUndoRedoButtons();
});
// Zoom and pan state
let zoom = 1;
let panX = 0, panY = 0;
let isPanning = false;
let panStart = { x: 0, y: 0 };
let panOffsetStart = { x: 0, y: 0 };

// Render canvas with zoom and pan
function renderCanvas() {
  // Reset transform and clear canvas
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  // Apply pan and zoom
  ctx.translate(panX, panY);
  ctx.scale(zoom, zoom);
  drawProject(ctx, project, palette);
}
// Render color palette UI
const paletteContainer = document.getElementById('palette');
// Hidden color input for palette editing
const paletteColorInput = document.createElement('input');
paletteColorInput.type = 'color';
paletteColorInput.style.display = 'none';
document.body.appendChild(paletteColorInput);
function renderPalette() {
  paletteContainer.innerHTML = '';
  palette.forEach((color, idx) => {
    const swatch = document.createElement('button');
    swatch.style.backgroundColor = color;
    swatch.style.width = '24px';
    swatch.style.height = '24px';
    swatch.style.margin = '2px';
    swatch.style.border = idx === currentColorIndex ? '2px solid #000' : '1px solid #888';
    swatch.title = `Color ${idx + 1}`;
    swatch.addEventListener('click', () => {
      currentColorIndex = idx;
      renderPalette();
    });
    // Double-click to edit palette color
    swatch.addEventListener('dblclick', () => {
      paletteColorInput.value = color;
      paletteColorInput.onchange = () => {
        pushHistory();
        palette[idx] = paletteColorInput.value;
        project.palette = palette;
        renderPalette();
      };
      paletteColorInput.click();
    });
    paletteContainer.appendChild(swatch);
  });
}
renderPalette();
// Palette editing controls
document.getElementById('add-color').addEventListener('click', () => {
  const newColor = '#000000';
  pushHistory();
  palette.push(newColor);
  project.palette = palette;
  renderPalette();
});
document.getElementById('remove-color').addEventListener('click', () => {
  if (palette.length <= 1) {
    alert('At least one color must remain.');
    return;
  }
  pushHistory();
  palette.pop();
  project.palette = palette;
  if (currentColorIndex >= palette.length) currentColorIndex = palette.length - 1;
  renderPalette();
});
// Layer controls UI
const layerList = document.getElementById('layer-list');
function renderLayers() {
  layerList.innerHTML = '';
  project.layers.forEach((layer, idx) => {
    const li = document.createElement('li');
    // Visibility toggle
    const visCheckbox = document.createElement('input');
    visCheckbox.type = 'checkbox';
    visCheckbox.checked = layer.visible;
    visCheckbox.addEventListener('change', () => {
      pushHistory();
      layer.visible = visCheckbox.checked;
      renderCanvas();
    });
    li.appendChild(visCheckbox);
    // Layer name / select
    const nameSpan = document.createElement('span');
    nameSpan.textContent = layer.id;
    nameSpan.style.cursor = 'pointer';
    nameSpan.style.fontWeight = idx === currentLayerIndex ? 'bold' : 'normal';
    nameSpan.addEventListener('click', () => {
      currentLayerIndex = idx;
      renderLayers();
    });
    li.appendChild(nameSpan);
    // Opacity control
    const opacityInput = document.createElement('input');
    opacityInput.type = 'range';
    opacityInput.min = 0;
    opacityInput.max = 1;
    opacityInput.step = 0.1;
    opacityInput.value = layer.opacity != null ? layer.opacity : 1;
    opacityInput.style.marginLeft = '8px';
    opacityInput.addEventListener('input', () => {
      pushHistory();
      layer.opacity = parseFloat(opacityInput.value);
      renderCanvas();
    });
    // Rename control (placed before opacity for visibility)
    const renameBtn = document.createElement('button');
    renameBtn.textContent = 'Rename';
    renameBtn.style.marginLeft = '8px';
    renameBtn.style.backgroundColor = '#eee';
    renameBtn.style.border = '1px solid #ccc';
    renameBtn.addEventListener('click', () => {
      const newName = prompt('Enter new layer name:', layer.id);
      if (newName != null && newName.trim()) {
        pushHistory();
        layer.id = newName.trim();
        renderLayers();
      }
    });
    li.appendChild(renameBtn);
    // Reorder controls
    const upBtn = document.createElement('button');
    upBtn.textContent = '↑';
    upBtn.style.marginLeft = '4px';
    upBtn.disabled = idx === 0;
    upBtn.title = 'Move layer up';
    upBtn.addEventListener('click', () => {
      if (idx > 0) {
        pushHistory();
        const layers = project.layers;
        [layers[idx - 1], layers[idx]] = [layers[idx], layers[idx - 1]];
        currentLayerIndex = idx - 1;
        renderLayers();
        renderCanvas();
      }
    });
    li.appendChild(upBtn);
    const downBtn = document.createElement('button');
    downBtn.textContent = '↓';
    downBtn.style.marginLeft = '4px';
    downBtn.disabled = idx === project.layers.length - 1;
    downBtn.title = 'Move layer down';
    downBtn.addEventListener('click', () => {
      if (idx < project.layers.length - 1) {
        pushHistory();
        const layers = project.layers;
        [layers[idx], layers[idx + 1]] = [layers[idx + 1], layers[idx]];
        currentLayerIndex = idx + 1;
        renderLayers();
        renderCanvas();
      }
    });
    li.appendChild(downBtn);
    // Append opacity slider after reorder
    li.appendChild(opacityInput);
    layerList.appendChild(li);
  });
}
renderLayers();
// Add Layer button
document.getElementById('add-layer').addEventListener('click', () => {
  // Save state for undo
  pushHistory();
  const newId = `layer-${project.layers.length + 1}`;
  const newLayer = {
    id: newId,
    type: 'pixel',
    visible: true,
    locked: false,
    opacity: 1,
    pixels: {
      format: 'Array',
      width,
      height,
      data: new Array(width * height).fill(0)
    }
  };
  project.layers.push(newLayer);
  currentLayerIndex = project.layers.length - 1;
  renderLayers();
  renderCanvas();
});
// Remove Layer button
document.getElementById('remove-layer').addEventListener('click', () => {
  if (project.layers.length <= 1) {
    alert('Cannot remove the last layer.');
    return;
  }
  // Save state for undo
  pushHistory();
  project.layers.splice(currentLayerIndex, 1);
  currentLayerIndex = Math.max(0, currentLayerIndex - 1);
  renderLayers();
  renderCanvas();
});

// Current tool state
let tool = 'pen';
// For line tool: store starting point
let lineStart = null;
// Draw a straight line on the current layer using Bresenham's algorithm
function drawLine(x0, y0, x1, y1) {
  const layer = project.layers[currentLayerIndex];
  if (!layer.pixels || !layer.pixels.data) return;
  const data = layer.pixels.data;
  const w = width;
  const h = height;
  const value = currentColorIndex + 1;
  let dx = Math.abs(x1 - x0), sx = x0 < x1 ? 1 : -1;
  let dy = -Math.abs(y1 - y0), sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  while (true) {
    if (x0 >= 0 && x0 < w && y0 >= 0 && y0 < h) {
      data[y0 * w + x0] = value;
    }
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; x0 += sx; }
    if (e2 <= dx) { err += dx; y0 += sy; }
  }
}
document.getElementById('pen').addEventListener('click', () => tool = 'pen');
document.getElementById('eraser').addEventListener('click', () => tool = 'eraser');
document.getElementById('line').addEventListener('click', () => { tool = 'line'; lineStart = null; });
document.getElementById('color-picker').addEventListener('click', () => tool = 'colorpicker');
document.getElementById('bucket').addEventListener('click', () => tool = 'bucket');
document.getElementById('clear').addEventListener('click', () => {
  pushHistory();
  project.layers[currentLayerIndex].pixels.data.fill(0);
  renderCanvas();
});
// Zoom & pan tool bindings
document.getElementById('pan').addEventListener('click', () => tool = 'pan');
document.getElementById('zoom-in').addEventListener('click', () => { zoom *= 1.2; renderCanvas(); });
document.getElementById('zoom-out').addEventListener('click', () => { zoom /= 1.2; renderCanvas(); });
document.getElementById('reset-zoom').addEventListener('click', () => { zoom = 1; panX = 0; panY = 0; renderCanvas(); });
document.getElementById('export').addEventListener('click', () => {
  const json = JSON.stringify(project, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'project.mrpaf.json';
  a.click();
  URL.revokeObjectURL(url);
});
// Import JSON functionality
const importFileInput = document.getElementById('import-file');
document.getElementById('import').addEventListener('click', () => {
  importFileInput.value = '';
  importFileInput.click();
});
importFileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
    reader.onload = () => {
      try {
        const imported = JSON.parse(reader.result);
        if (!imported.canvas || !imported.layers) {
          alert('Invalid MRPAF JSON.');
          return;
        }
        project = imported;
        width = project.canvas.width;
        height = project.canvas.height;
        palette = project.palette;
        // After import, reset to first layer
        currentLayerIndex = 0;
renderPalette();
        renderLayers();
        renderCanvas();
    } catch (err) {
      alert('Error parsing JSON: ' + err);
    }
  };
  reader.readAsText(file);
});

// Bind Undo/Redo buttons
document.getElementById('undo').addEventListener('click', () => {
  if (undoStack.length > 0) {
    redoStack.push(JSON.stringify(project));
    project = JSON.parse(undoStack.pop());
    width = project.canvas.width;
    height = project.canvas.height;
    palette = project.palette;
    renderPalette();
    renderLayers();
    renderCanvas();
    updateUndoRedoButtons();
  }
});
document.getElementById('redo').addEventListener('click', () => {
  if (redoStack.length > 0) {
    undoStack.push(JSON.stringify(project));
    project = JSON.parse(redoStack.pop());
    width = project.canvas.width;
    height = project.canvas.height;
    palette = project.palette;
    renderPalette();
    renderLayers();
    renderCanvas();
    updateUndoRedoButtons();
  }
});
// Initialize Undo/Redo button states
updateUndoRedoButtons();
// LocalStorage Save/Load
document.getElementById('save-local').addEventListener('click', () => {
  localStorage.setItem('mrpaf-project', JSON.stringify(project));
  alert('Project saved locally.');
});
document.getElementById('load-local').addEventListener('click', () => {
  const data = localStorage.getItem('mrpaf-project');
  if (!data) {
    alert('No saved project found.');
    return;
  }
  try {
    const imported = JSON.parse(data);
    if (!imported.canvas || !imported.layers) {
      alert('Invalid saved project.');
      return;
    }
    pushHistory();
    project = imported;
    width = project.canvas.width;
    height = project.canvas.height;
    palette = project.palette;
    renderPalette();
        renderLayers();
        renderCanvas();
  } catch (err) {
    alert('Error loading project: ' + err);
  }
});


// Pan event handlers
canvas.addEventListener('mousedown', (e) => {
  if (tool === 'pan' && e.button === 0) {
    isPanning = true;
    panStart = { x: e.clientX, y: e.clientY };
    panOffsetStart = { x: panX, y: panY };
  }
});
canvas.addEventListener('mousemove', (e) => {
  if (isPanning) {
    panX = panOffsetStart.x + (e.clientX - panStart.x);
    panY = panOffsetStart.y + (e.clientY - panStart.y);
    renderCanvas();
  }
});
canvas.addEventListener('mouseup', () => {
  if (isPanning) isPanning = false;
});
// Handle canvas clicks
canvas.addEventListener('click', (e) => {
  const rect = canvas.getBoundingClientRect();
  const pixelSize = Math.floor(Math.min(canvas.width / width, canvas.height / height));
  const x = Math.floor((e.clientX - rect.left) / pixelSize);
  const y = Math.floor((e.clientY - rect.top) / pixelSize);
  const idx = y * width + x;
  if (tool === 'pen') {
    // Set pixel to selected color (1-based index)
    pushHistory();
    const brushSize = parseInt(document.getElementById('brush-size').value) || 1;
    const half = Math.floor(brushSize / 2);
    const layer = project.layers[currentLayerIndex];
    const data = layer.pixels.data;
    for (let dy = -half; dy <= half; dy++) {
      for (let dx = -half; dx <= half; dx++) {
        const xi = x + dx;
        const yi = y + dy;
        if (xi >= 0 && xi < width && yi >= 0 && yi < height) {
          data[yi * width + xi] = currentColorIndex + 1;
        }
      }
    }
  } else if (tool === 'eraser') {
    // Clear pixel
    pushHistory();
    const brushSize = parseInt(document.getElementById('brush-size').value) || 1;
    const half = Math.floor(brushSize / 2);
    const layer = project.layers[currentLayerIndex];
    const data = layer.pixels.data;
    for (let dy = -half; dy <= half; dy++) {
      for (let dx = -half; dx <= half; dx++) {
        const xi = x + dx;
        const yi = y + dy;
        if (xi >= 0 && xi < width && yi >= 0 && yi < height) {
          data[yi * width + xi] = 0;
        }
      }
    }
  } else if (tool === 'colorpicker') {
    // Pick color from topmost visible layer at clicked pixel
    let picked = 0;
    for (let li = project.layers.length - 1; li >= 0; li--) {
      const layer = project.layers[li];
      if (layer.visible && layer.pixels && layer.pixels.data) {
        const val = layer.pixels.data[idx];
        if (val > 0) { picked = val - 1; break; }
      }
    }
    currentColorIndex = picked;
    renderPalette();
  } else if (tool === 'bucket') {
    // Flood fill on current layer
    pushHistory();
    // Flood fill on current layer
    const layer = project.layers[currentLayerIndex];
    if (layer.pixels && layer.pixels.data) {
      const data = layer.pixels.data;
      const target = data[idx];
      const replacement = currentColorIndex + 1;
      if (target !== replacement) {
        const w = width;
        const h = height;
        const stack = [idx];
        while (stack.length) {
          const i = stack.pop();
          if (data[i] !== target) continue;
          data[i] = replacement;
          const x0 = i % w;
          const y0 = Math.floor(i / w);
          if (x0 > 0) stack.push(i - 1);
          if (x0 < w - 1) stack.push(i + 1);
          if (y0 > 0) stack.push(i - w);
          if (y0 < h - 1) stack.push(i + w);
        }
      }
    }
  } else if (tool === 'line') {
    // Draw line on current layer between two clicks
    if (lineStart == null) {
      lineStart = { x, y };
    } else {
      pushHistory();
      drawLine(lineStart.x, lineStart.y, x, y);
      lineStart = null;
    }
  }
  renderCanvas();
});

// Initial render
renderCanvas();