import { createEmptyProject } from '../core/index.js';
import { drawProject } from '../renderer/index.js';
// Background image layer handling
const bgFileInput = document.createElement('input');
bgFileInput.type = 'file';
bgFileInput.accept = 'image/*';
bgFileInput.style.display = 'none';
document.body.appendChild(bgFileInput);
// Background image state
// Background image state
let backgroundImg = null;
let backgroundVisible = true;
let backgroundOpacity = 1;
// Onion skin state
let onionEnabled = false;
let onionOpacity = 0.5;

// Configuration
let width = 16;
let height = 16;

// Create a new project
// Initialize project and per-layer grid toggles
// Create a new project and initialize animation timeline
let project = createEmptyProject(width, height);
// Initialize frames: each frame holds its own layers and background
project.frames = [{
  layers: project.layers,
  backgroundImageData: project.backgroundImage || null
}];
let currentFrameIndex = 0;
// Grid visibility toggles per layer (editor-only state)
let layerGridToggles = [];
function syncLayerGridToggles() {
  // preserve existing toggles where possible
  layerGridToggles = project.layers.map((_, idx) => layerGridToggles[idx] || false);
}
syncLayerGridToggles();
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
  syncLayerGridToggles();
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
  // Draw background image full canvas with visibility and opacity
  if (backgroundImg && backgroundVisible) {
    ctx.globalAlpha = backgroundOpacity;
    ctx.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = 1;
  }
  // Apply pan and zoom for pixel layers
  ctx.translate(panX, panY);
  ctx.scale(zoom, zoom);
  // Onion skin overlay: draw adjacent frames behind current
  if (onionEnabled && project.frames && project.frames.length > 1) {
    ctx.globalAlpha = onionOpacity;
    // Previous frame
    if (currentFrameIndex > 0) {
      const prevFrame = project.frames[currentFrameIndex - 1];
      const prevProj = { canvas: project.canvas, layers: prevFrame.layers };
      drawProject(ctx, prevProj, palette);
    }
    // Next frame
    if (currentFrameIndex < project.frames.length - 1) {
      const nextFrame = project.frames[currentFrameIndex + 1];
      const nextProj = { canvas: project.canvas, layers: nextFrame.layers };
      drawProject(ctx, nextProj, palette);
    }
    ctx.globalAlpha = 1;
  }
  // Draw pixel layers for current frame on top
  drawProject(ctx, project, palette);
  // Draw per-layer grid overlays
  // Compute base pixel size (before zoom transform)
  const baseW = project.canvas.width;
  const baseH = project.canvas.height;
  const pixelSize = Math.floor(Math.min(ctx.canvas.width / baseW, ctx.canvas.height / baseH));
  layerGridToggles.forEach((show, idx) => {
    if (!show) return;
    const layer = project.layers[idx];
    if (!layer) return;
    const res = layer.resolution || { pixelArraySize: { width: baseW, height: baseH }, scale: 1 };
    const arr = res.pixelArraySize;
    const scale = res.scale;
    const offset = layer.placement || { x: 0, y: 0 };
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 1;
    // Vertical lines
    for (let x = 0; x <= arr.width; x++) {
      const gx = (offset.x + x * scale) * pixelSize;
      const y0 = offset.y * pixelSize;
      const y1 = (offset.y + arr.height * scale) * pixelSize;
      ctx.beginPath(); ctx.moveTo(gx, y0); ctx.lineTo(gx, y1); ctx.stroke();
    }
    // Horizontal lines
    for (let y = 0; y <= arr.height; y++) {
      const gy = (offset.y + y * scale) * pixelSize;
      const x0 = offset.x * pixelSize;
      const x1 = (offset.x + arr.width * scale) * pixelSize;
      ctx.beginPath(); ctx.moveTo(x0, gy); ctx.lineTo(x1, gy); ctx.stroke();
    }
  });
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
  // Ensure grid toggles array matches current layers
  syncLayerGridToggles();
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
    // Grid toggle per layer
    const gridCheckbox = document.createElement('input');
    gridCheckbox.type = 'checkbox';
    gridCheckbox.checked = layerGridToggles[idx];
    gridCheckbox.title = 'Toggle grid overlay';
    gridCheckbox.style.marginLeft = '4px';
    gridCheckbox.addEventListener('change', () => {
      layerGridToggles[idx] = gridCheckbox.checked;
      renderCanvas();
    });
    li.appendChild(gridCheckbox);
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
    opacityInput.translated = true; // Ensure it is translated properly
    li.appendChild(opacityInput);
    // Resolution controls: pixel array size and scale
    (function() {
      const res = layer.resolution || { pixelArraySize: { width, height }, scale: 1 };
      // Width input
      const wInput = document.createElement('input');
      wInput.type = 'number';
      wInput.min = 1;
      wInput.value = res.pixelArraySize.width;
      wInput.style.width = '50px';
      wInput.title = 'Layer pixel width';
      wInput.addEventListener('change', () => {
        pushHistory();
        // Resize layer pixel array when width changes
        const newW = parseInt(wInput.value, 10) || res.pixelArraySize.width;
        const oldW = res.pixelArraySize.width;
        const oldH = res.pixelArraySize.height;
        res.pixelArraySize.width = newW;
        // Rebuild pixel data array to match new dimensions
        const oldData = layer.pixels.data;
        const newH = oldH;
        const newData = new Array(newW * newH).fill(null);
        for (let y = 0; y < newH; y++) {
          for (let x = 0; x < Math.min(oldW, newW); x++) {
            newData[y * newW + x] = oldData[y * oldW + x] || 0;
          }
        }
        layer.pixels.data = newData;
        // Update pixel metadata
        layer.pixels.width = newW;
        layer.pixels.height = newH;
        renderCanvas();
      });
      li.appendChild(wInput);
      // Height input
      const hInput = document.createElement('input');
      hInput.type = 'number';
      hInput.min = 1;
      hInput.value = res.pixelArraySize.height;
      hInput.style.width = '50px';
      hInput.title = 'Layer pixel height';
      hInput.addEventListener('change', () => {
        pushHistory();
        // Resize layer pixel array when height changes
        const newH = parseInt(hInput.value, 10) || res.pixelArraySize.height;
        const oldW = res.pixelArraySize.width;
        const oldH = res.pixelArraySize.height;
        res.pixelArraySize.height = newH;
        // Rebuild pixel data array to match new dimensions
        const oldData = layer.pixels.data;
        const newW = oldW;
        const newData = new Array(newW * newH).fill(null);
        for (let y = 0; y < Math.min(oldH, newH); y++) {
          for (let x = 0; x < newW; x++) {
            newData[y * newW + x] = oldData[y * oldW + x] || 0;
          }
        }
        layer.pixels.data = newData;
        // Update pixel metadata
        layer.pixels.width = newW;
        layer.pixels.height = newH;
        renderCanvas();
      });
      li.appendChild(hInput);
      // Scale input
      const sInput = document.createElement('input');
      sInput.type = 'number';
      sInput.step = 0.1;
      sInput.min = 0.1;
      sInput.value = res.scale;
      sInput.style.width = '50px';
      sInput.title = 'Layer scale factor';
      sInput.addEventListener('change', () => {
        pushHistory();
        layer.resolution.scale = parseFloat(sInput.value) || res.scale;
        renderCanvas();
      });
      li.appendChild(sInput);
      // Layer placement offset inputs
      const xOffInput = document.createElement('input');
      xOffInput.type = 'number';
      xOffInput.value = (layer.placement && layer.placement.x) || 0;
      xOffInput.style.width = '50px';
      xOffInput.title = 'Layer offset X';
      xOffInput.addEventListener('change', () => {
        pushHistory();
        layer.placement = layer.placement || { x: 0, y: 0 };
        layer.placement.x = parseInt(xOffInput.value, 10) || 0;
        renderCanvas();
      });
      li.appendChild(xOffInput);
      const yOffInput = document.createElement('input');
      yOffInput.type = 'number';
      yOffInput.value = (layer.placement && layer.placement.y) || 0;
      yOffInput.style.width = '50px';
      yOffInput.title = 'Layer offset Y';
      yOffInput.addEventListener('change', () => {
        pushHistory();
        layer.placement = layer.placement || { x: 0, y: 0 };
        layer.placement.y = parseInt(yOffInput.value, 10) || 0;
        renderCanvas();
      });
      li.appendChild(yOffInput);
    })();
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
    // Multi-resolution support
    resolution: {
      pixelArraySize: { width, height },
      scale: 1.0
    },
    placement: { x: 0, y: 0 },
    pixels: {
      format: 'Array',
      width,
      height,
      // null represents transparent/undrawn pixel
      data: new Array(width * height).fill(null)
    }
  };
  project.layers.push(newLayer);
  currentLayerIndex = project.layers.length - 1;
  syncLayerGridToggles();
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
  syncLayerGridToggles();
  renderLayers();
  renderCanvas();
});

// Current tool state
let tool = 'pen';
// Symmetry mode: none, vertical, horizontal, both
let symmetryMode = 'none';
// For line tool: store starting point
let lineStart = null;
// Draw a straight line on the current layer using Bresenham's algorithm
function drawLine(x0, y0, x1, y1) {
  const layer = project.layers[currentLayerIndex];
  if (!layer.pixels || !layer.pixels.data) return;
  const data = layer.pixels.data;
  // Determine layer dimensions from resolution
  const res = layer.resolution || { pixelArraySize: { width, height }, scale: 1 };
  const arr = res.pixelArraySize;
  const w = arr.width;
  const h = arr.height;
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
// Symmetry mode selector binding
const symmetrySelect = document.getElementById('symmetry-mode');
symmetrySelect.addEventListener('change', () => {
  symmetryMode = symmetrySelect.value;
});
// Brush shape selector binding
const brushShapeSelect = document.getElementById('brush-shape');
let brushShape = brushShapeSelect.value;
brushShapeSelect.addEventListener('change', () => {
  brushShape = brushShapeSelect.value;
});
// Onion skin controls binding
const onionCheckbox = document.getElementById('onion-enable');
const onionOpacityInput = document.getElementById('onion-opacity');
onionCheckbox.addEventListener('change', () => {
  onionEnabled = onionCheckbox.checked;
  renderCanvas();
});
onionOpacityInput.addEventListener('input', () => {
  onionOpacity = parseFloat(onionOpacityInput.value);
  renderCanvas();
});
// Animation timeline bindings
const prevFrameBtn = document.getElementById('prev-frame');
const nextFrameBtn = document.getElementById('next-frame');
const addFrameBtn = document.getElementById('add-frame');
const removeFrameBtn = document.getElementById('remove-frame');
const playBtn = document.getElementById('play');
const fpsInput = document.getElementById('fps-input');
const frameIndicator = document.getElementById('frame-indicator');
function updateFrameIndicator() {
  frameIndicator.textContent = `Frame ${currentFrameIndex+1}/${project.frames.length}`;
}
function setFrame(idx) {
  // Save current state
  project.frames[currentFrameIndex].layers = project.layers;
  project.frames[currentFrameIndex].backgroundImageData = project.backgroundImage || null;
  // Bound index
  currentFrameIndex = Math.max(0, Math.min(idx, project.frames.length - 1));
  // Load new frame state
  project.layers = project.frames[currentFrameIndex].layers;
  const bgData = project.frames[currentFrameIndex].backgroundImageData;
  if (bgData) {
    const img = new Image();
    img.onload = () => { backgroundImg = img; renderCanvas(); };
    img.src = bgData;
    project.backgroundImage = bgData;
  } else {
    backgroundImg = null;
    project.backgroundImage = null;
    renderCanvas();
  }
  syncLayerGridToggles();
  renderLayers();
  updateFrameIndicator();
}
prevFrameBtn.addEventListener('click', () => setFrame(currentFrameIndex - 1));
nextFrameBtn.addEventListener('click', () => setFrame(currentFrameIndex + 1));
addFrameBtn.addEventListener('click', () => {
  // Save current state
  project.frames[currentFrameIndex].layers = project.layers;
  project.frames[currentFrameIndex].backgroundImageData = project.backgroundImage || null;
  // Duplicate layers for new frame
  const newLayers = JSON.parse(JSON.stringify(project.layers));
  project.frames.push({ layers: newLayers, backgroundImageData: null });
  setFrame(project.frames.length - 1);
});
removeFrameBtn.addEventListener('click', () => {
  if (project.frames.length <= 1) { alert('Cannot remove the last frame.'); return; }
  project.frames.splice(currentFrameIndex, 1);
  setFrame(Math.min(currentFrameIndex, project.frames.length - 1));
});
// Play / stop animation preview
let isPlaying = false;
let playTimer = null;
playBtn.addEventListener('click', () => {
  if (!isPlaying) {
    // Start playback
    const fps = Math.max(1, parseInt(fpsInput.value, 10) || 1);
    playBtn.textContent = 'Stop';
    isPlaying = true;
    playTimer = setInterval(() => {
      const next = (currentFrameIndex + 1) % project.frames.length;
      setFrame(next);
    }, 1000 / fps);
  } else {
    // Stop playback
    clearInterval(playTimer);
    playBtn.textContent = 'Play';
    isPlaying = false;
  }
});
updateFrameIndicator();
document.getElementById('clear').addEventListener('click', () => {
  pushHistory();
  // Clear pixel data to transparent (null)
  project.layers[currentLayerIndex].pixels.data.fill(null);
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
  // Download MRPAF project with .mrpaf extension (JSON format)
  a.download = 'project.mrpaf';
  a.click();
  URL.revokeObjectURL(url);
});
// Export current pixel art as PNG image
document.getElementById('export-image').addEventListener('click', () => {
  const w = project.canvas.width;
  const h = project.canvas.height;
  // Create offscreen canvas at base resolution
  const exportCanvas = document.createElement('canvas');
  exportCanvas.width = w;
  exportCanvas.height = h;
  const exportCtx = exportCanvas.getContext('2d');
  exportCtx.imageSmoothingEnabled = false;
  // Clear
  exportCtx.clearRect(0, 0, w, h);
  // Draw background if present
  if (backgroundImg && backgroundVisible) {
    exportCtx.globalAlpha = backgroundOpacity;
    exportCtx.drawImage(backgroundImg, 0, 0, w, h);
    exportCtx.globalAlpha = 1;
  }
  // Draw pixel layers without pan/zoom
  drawProject(exportCtx, project, palette);
  // Download as PNG
  exportCanvas.toBlob(blob => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'project.png';
    a.click();
    URL.revokeObjectURL(url);
  });
});
// Export all frames as a single sprite sheet PNG
document.getElementById('export-spritesheet').addEventListener('click', () => {
  // Export all frames as a single sprite sheet PNG at UI canvas resolution
  const frameCount = project.frames.length;
  const wPx = project.canvas.width;
  const hPx = project.canvas.height;
  const sheetCanvas = document.createElement('canvas');
  sheetCanvas.width = wPx * frameCount;
  sheetCanvas.height = hPx;
  const sheetCtx = sheetCanvas.getContext('2d');
  sheetCtx.imageSmoothingEnabled = false;
  // Save current state
  const origFrame = currentFrameIndex;
  const origZoom = zoom, origPanX = panX, origPanY = panY;
  // Reset pan/zoom for export
  zoom = 1; panX = 0; panY = 0;
  // Render each frame and blit
  for (let i = 0; i < frameCount; i++) {
    setFrame(i);
    renderCanvas();
    sheetCtx.drawImage(canvas, i * wPx, 0, wPx, hPx);
  }
  // Restore state
  zoom = origZoom; panX = origPanX; panY = origPanY;
  setFrame(origFrame);
  renderCanvas();
  // Download sprite sheet
  sheetCanvas.toBlob(blob => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'spritesheet.png';
    a.click();
    URL.revokeObjectURL(url);
  });
});
// Export animated GIF of all frames
document.getElementById('export-gif').addEventListener('click', () => {
  // Ensure GIF.js is available in this module (globalThis.GIF)
  // Export animated GIF of all frames
  const GIFCtor = globalThis.GIF || window.GIF;
  if (!GIFCtor) {
    alert('GIF.js library not loaded. Cannot export GIF.');
    return;
  }
  const frameCount = project.frames.length;
  // Use UI canvas resolution for crisp pixel art in GIF
  const wPx = canvas.width;
  const hPx = canvas.height;
  console.log('Export GIF using resolution', wPx, 'x', hPx, 'for', frameCount, 'frames');
  const fps = Math.max(1, parseInt(document.getElementById('fps-input').value, 10) || 1);
  // Load worker script via fetch to avoid cross-origin Worker errors
  fetch('https://cdn.jsdelivr.net/npm/gif.js/dist/gif.worker.js')
    .then(res => {
      if (!res.ok) throw new Error(res.statusText);
      return res.text();
    })
    .then(workerSource => {
      const workerBlob = new Blob([workerSource], { type: 'application/javascript' });
      const workerBlobUrl = URL.createObjectURL(workerBlob);
      const gif = new GIFCtor({
        workers: 2,
        workerScript: workerBlobUrl,
        quality: 10,
        width: wPx,
        height: hPx
      });
      // Save state
      const origFrame = currentFrameIndex;
      const origZoom = zoom, origPanX = panX, origPanY = panY;
      zoom = 1; panX = 0; panY = 0;
      // Build frames by capturing the rendered canvas
      for (let i = 0; i < frameCount; i++) {
        setFrame(i);
        renderCanvas();
        gif.addFrame(canvas, { delay: 1000 / fps, copy: true });
      }
      // Restore state
      zoom = origZoom; panX = origPanX; panY = origPanY;
      setFrame(origFrame);
      renderCanvas();
      // Render and download
      gif.on('finished', blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'animation.gif';
        a.click();
        URL.revokeObjectURL(url);
      });
      gif.render();
    })
    .catch(err => {
      alert('Failed to load GIF worker script: ' + err);
    });
});
// Import JSON functionality
// File input used for importing MRPAF JSON (.mrpaf/.json)
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
        syncLayerGridToggles();
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
// Background image import
document.getElementById('add-background').addEventListener('click', () => {
  bgFileInput.value = '';
  bgFileInput.click();
});
bgFileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const dataUrl = reader.result;
    const img = new Image();
    img.onload = () => {
      pushHistory();
      backgroundImg = img;
      project.backgroundImage = dataUrl;
      renderCanvas();
    };
    img.src = dataUrl;
  };
  reader.readAsDataURL(file);
});
// Background visibility and opacity controls
const bgVisibleCheckbox = document.getElementById('background-visible');
const bgOpacityInput = document.getElementById('background-opacity');
bgVisibleCheckbox.addEventListener('change', () => {
  backgroundVisible = bgVisibleCheckbox.checked;
  renderCanvas();
});
bgOpacityInput.addEventListener('input', () => {
  backgroundOpacity = parseFloat(bgOpacityInput.value);
  renderCanvas();
});

// Bind Undo/Redo buttons
document.getElementById('undo').addEventListener('click', () => {
  if (undoStack.length > 0) {
    redoStack.push(JSON.stringify(project));
    project = JSON.parse(undoStack.pop());
    syncLayerGridToggles();
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
    syncLayerGridToggles();
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
  // Convert screen click to layer pixel coordinates (pan/zoom + resolution scale)
  const rect = canvas.getBoundingClientRect();
  const canvasX = e.clientX - rect.left;
  const canvasY = e.clientY - rect.top;
  const worldX = (canvasX - panX) / zoom;
  const worldY = (canvasY - panY) / zoom;
  const pixelSize = Math.floor(Math.min(canvas.width / width, canvas.height / height));
  const gridX = worldX / pixelSize;
  const gridY = worldY / pixelSize;
  const layer = project.layers[currentLayerIndex];
  const res = layer.resolution || { pixelArraySize: { width, height }, scale: 1 };
  const arr = res.pixelArraySize;
  const scale = res.scale;
  const offset = layer.placement || { x: 0, y: 0 };
  const layerX = Math.floor((gridX - offset.x) / scale);
  const layerY = Math.floor((gridY - offset.y) / scale);
  const layerW = arr.width;
  const layerH = arr.height;
  // If click is outside layer bounds, ignore
  if (layerX < 0 || layerY < 0 || layerX >= layerW || layerY >= layerH) return;
  if (tool === 'pen') {
    // Set pixel to selected color (1-based index)
    pushHistory();
    const brushSize = parseInt(document.getElementById('brush-size').value) || 1;
    const half = Math.floor(brushSize / 2);
    const layer = project.layers[currentLayerIndex];
    const data = layer.pixels.data;
    const value = currentColorIndex + 1;
    const w = layerW, h = layerH;
    for (let dy = -half; dy <= half; dy++) {
      for (let dx = -half; dx <= half; dx++) {
        // Brush shape filter
        if (brushShape === 'circle' && dx * dx + dy * dy > half * half) continue;
        if (brushShape === 'cross' && dx !== 0 && dy !== 0) continue;
        // Brush shape filter
        if (brushShape === 'circle' && dx * dx + dy * dy > half * half) continue;
        if (brushShape === 'cross' && dx !== 0 && dy !== 0) continue;
        const xi = layerX + dx;
        const yi = layerY + dy;
        if (xi >= 0 && xi < w && yi >= 0 && yi < h) {
          // Apply symmetry: original and mirrored points
          const pts = [{ x: xi, y: yi }];
          if (symmetryMode === 'vertical' || symmetryMode === 'both') pts.push({ x: w - 1 - xi, y: yi });
          if (symmetryMode === 'horizontal' || symmetryMode === 'both') pts.push({ x: xi, y: h - 1 - yi });
          if (symmetryMode === 'both') pts.push({ x: w - 1 - xi, y: h - 1 - yi });
          pts.forEach(pt => {
            if (pt.x >= 0 && pt.x < w && pt.y >= 0 && pt.y < h) {
              data[pt.y * w + pt.x] = value;
            }
          });
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
    const w = layerW, h = layerH;
    const value = 0;
    for (let dy = -half; dy <= half; dy++) {
      for (let dx = -half; dx <= half; dx++) {
        const xi = layerX + dx;
        const yi = layerY + dy;
        if (xi >= 0 && xi < w && yi >= 0 && yi < h) {
          const pts = [{ x: xi, y: yi }];
          if (symmetryMode === 'vertical' || symmetryMode === 'both') pts.push({ x: w - 1 - xi, y: yi });
          if (symmetryMode === 'horizontal' || symmetryMode === 'both') pts.push({ x: xi, y: h - 1 - yi });
          if (symmetryMode === 'both') pts.push({ x: w - 1 - xi, y: h - 1 - yi });
          pts.forEach(pt => {
            if (pt.x >= 0 && pt.x < w && pt.y >= 0 && pt.y < h) {
              data[pt.y * w + pt.x] = value;
            }
          });
        }
      }
    }
  } else if (tool === 'colorpicker') {
    // Pick color from topmost visible layer at clicked pixel
    let picked = 0;
    for (let li = project.layers.length - 1; li >= 0; li--) {
      const lyr = project.layers[li];
      if (!lyr.visible || !lyr.pixels || !lyr.pixels.data) continue;
      const r = lyr.resolution || { pixelArraySize: { width, height }, scale: 1 };
      const a = r.pixelArraySize;
      const s = r.scale;
      const off = lyr.placement || { x: 0, y: 0 };
      const lx = Math.floor((gridX - off.x) / s);
      const ly = Math.floor((gridY - off.y) / s);
      if (lx < 0 || lx >= a.width || ly < 0 || ly >= a.height) continue;
      const vidx = ly * a.width + lx;
      const val = lyr.pixels.data[vidx];
      if (val > 0) { picked = val - 1; break; }
    }
    currentColorIndex = picked;
    renderPalette();
  } else if (tool === 'bucket') {
    // Flood fill on current layer with symmetry support
    pushHistory();
    const layer = project.layers[currentLayerIndex];
    if (layer.pixels && layer.pixels.data) {
      const data = layer.pixels.data;
      const w = layerW, h = layerH;
      const replacement = currentColorIndex + 1;
      // Prepare seeds and targets for symmetric fills
      const seeds = [];
      const targets = [];
      // Original point
      seeds.push({ x: layerX, y: layerY });
      targets.push(data[layerY * w + layerX]);
      // Vertical symmetry
      if (symmetryMode === 'vertical' || symmetryMode === 'both') {
        const sx = w - 1 - layerX, sy = layerY;
        seeds.push({ x: sx, y: sy });
        targets.push(data[sy * w + sx]);
      }
      // Horizontal symmetry
      if (symmetryMode === 'horizontal' || symmetryMode === 'both') {
        const sx = layerX, sy = h - 1 - layerY;
        seeds.push({ x: sx, y: sy });
        targets.push(data[sy * w + sx]);
      }
      // Both axes symmetry
      if (symmetryMode === 'both') {
        const sx = w - 1 - layerX, sy = h - 1 - layerY;
        seeds.push({ x: sx, y: sy });
        targets.push(data[sy * w + sx]);
      }
      // Flood fill function
      const floodFillAt = (startX, startY, target) => {
        if (target === replacement) return;
        const stack = [startY * w + startX];
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
      };
      // Apply flood fill for each seed
      seeds.forEach((s, idx) => {
        floodFillAt(s.x, s.y, targets[idx]);
      });
    }
  } else if (tool === 'line') {
    // Draw line on current layer between two clicks
    if (lineStart == null) {
      lineStart = { x: layerX, y: layerY };
    } else {
      pushHistory();
      // Draw primary line
      const w = layerW, h = layerH;
      const x0 = lineStart.x, y0 = lineStart.y;
      const x1 = layerX, y1 = layerY;
      drawLine(x0, y0, x1, y1);
      // Symmetrical lines
      if (symmetryMode === 'vertical' || symmetryMode === 'both') {
        drawLine(w - 1 - x0, y0, w - 1 - x1, y1);
      }
      if (symmetryMode === 'horizontal' || symmetryMode === 'both') {
        drawLine(x0, h - 1 - y0, x1, h - 1 - y1);
      }
      if (symmetryMode === 'both') {
        drawLine(w - 1 - x0, h - 1 - y0, w - 1 - x1, h - 1 - y1);
      }
      lineStart = null;
    }
  }
  renderCanvas();
});

// Initial render
renderCanvas();