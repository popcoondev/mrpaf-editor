import { createEmptyProject } from '../core/index.js';
import { drawProject } from '../renderer/index.js';

// Configuration
let width = 16;
let height = 16;

// Create a new project
let project = createEmptyProject(width, height);
// Palette comes from project; data values map 1..n to palette[0..n-1]
let palette = project.palette;
// Current tool and color index (0-based)
let currentColorIndex = 0;
// Current layer index (0-based)
let currentLayerIndex = 0;

// Initialize canvas
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
// Render color palette UI
const paletteContainer = document.getElementById('palette');
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
    paletteContainer.appendChild(swatch);
  });
}
renderPalette();
// Layer controls UI
const layerList = document.getElementById('layer-list');
function renderLayers() {
  layerList.innerHTML = '';
  project.layers.forEach((layer, idx) => {
    const li = document.createElement('li');
    li.textContent = layer.id;
    li.style.cursor = 'pointer';
    li.style.fontWeight = idx === currentLayerIndex ? 'bold' : 'normal';
    li.addEventListener('click', () => {
      currentLayerIndex = idx;
      renderLayers();
    });
    layerList.appendChild(li);
  });
}
renderLayers();

// Current tool state
let tool = 'pen';
document.getElementById('pen').addEventListener('click', () => tool = 'pen');
document.getElementById('eraser').addEventListener('click', () => tool = 'eraser');
document.getElementById('clear').addEventListener('click', () => {
  project.layers[currentLayerIndex].pixels.data.fill(0);
  drawProject(ctx, project, palette);
});
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
// Add Layer button
document.getElementById('add-layer').addEventListener('click', () => {
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
  drawProject(ctx, project, palette);
});
// Remove Layer button
document.getElementById('remove-layer').addEventListener('click', () => {
  if (project.layers.length <= 1) {
    alert('Cannot remove the last layer.');
    return;
  }
  project.layers.splice(currentLayerIndex, 1);
  currentLayerIndex = Math.max(0, currentLayerIndex - 1);
  renderLayers();
  drawProject(ctx, project, palette);
});
        drawProject(ctx, project, palette);
    } catch (err) {
      alert('Error parsing JSON: ' + err);
    }
  };
  reader.readAsText(file);
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
    project.layers[currentLayerIndex].pixels.data[idx] = currentColorIndex + 1;
  } else if (tool === 'eraser') {
    // Clear pixel
    project.layers[currentLayerIndex].pixels.data[idx] = 0;
  }
  drawProject(ctx, project, palette);
});

// Initial render
drawProject(ctx, project, palette);