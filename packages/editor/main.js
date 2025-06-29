import { createEmptyProject, updateColorSpaces } from '../core/index.js';
import { drawProject } from '../renderer/index.js';
// Graceful stub for missing UI elements to prevent null reference errors
{
  const _getById = document.getElementById.bind(document);
  document.getElementById = (id) => {
    const el = _getById(id);
    if (el) return el;
    const dummy = {};
    dummy.addEventListener = dummy.removeEventListener = () => {};
    dummy.style = {};
    dummy.value = '';
    dummy.checked = false;
    dummy.disabled = false;
    dummy.click = () => {};
    return dummy;
  };
}
// Background image layer handling
const bgFileInput = document.createElement('input');
bgFileInput.type = 'file';
bgFileInput.accept = 'image/*';
bgFileInput.style.display = 'none';
document.body.appendChild(bgFileInput);
// Background image state
// Background image state
// Background image state
let backgroundImg = null;
let backgroundVisible = true;
let backgroundOpacity = 1;
let backgroundOffset = { x: 0, y: 0 };
let backgroundScale = 1;
// Onion skin state
let onionEnabled = false;
let onionOpacity = 0.5;

// Configuration
let width = 16;
let height = 16;

// STL Export Settings
const STL_SETTINGS = {
  layerHeight: 0.4,    // mm per layer
  pixelSize: 1.2      // mm per pixel (width/height)
};

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
// --- Metadata panel setup ---
if (document.getElementById('meta-title')) {
const metaTitle = document.getElementById('meta-title');
const metaAuthor = document.getElementById('meta-author');
const metaDescription = document.getElementById('meta-description');
const metaTags = document.getElementById('meta-tags');
const metaLicense = document.getElementById('meta-license');
// Extended metadata inputs
const metaWorkSeries = document.getElementById('meta-work-series');
const metaWorkCharacter = document.getElementById('meta-work-character');
const metaWorkScene = document.getElementById('meta-work-scene');
const metaWorkVariation = document.getElementById('meta-work-variation');
const metaToolName = document.getElementById('meta-tool-name');
const metaToolVersion = document.getElementById('meta-tool-version');
const metaToolExporter = document.getElementById('meta-tool-exporter');
const metaCompatMinVersion = document.getElementById('meta-compat-min-version');
const metaCompatFeatures = document.getElementById('meta-compat-features');
/** Populate metadata inputs from the project object */
function updateMetadataPanel() {
  metaTitle.value = project.metadata.title || '';
  metaAuthor.value = project.metadata.author || '';
  metaDescription.value = project.metadata.description || '';
  metaTags.value = (project.metadata.tags || []).join(',');
  metaLicense.value = project.metadata.license || '';
  // Populate extended metadata fields
  metaWorkSeries.value = (project.metadata.work && project.metadata.work.series) || '';
  metaWorkCharacter.value = (project.metadata.work && project.metadata.work.character) || '';
  metaWorkScene.value = (project.metadata.work && project.metadata.work.scene) || '';
  metaWorkVariation.value = (project.metadata.work && project.metadata.work.variation) || '';
  metaToolName.value = (project.metadata.tool && project.metadata.tool.name) || '';
  metaToolVersion.value = (project.metadata.tool && project.metadata.tool.version) || '';
  metaToolExporter.value = (project.metadata.tool && project.metadata.tool.exporter) || '';
  metaCompatMinVersion.value = (project.metadata.compatibility && project.metadata.compatibility.minVersion) || '';
  metaCompatFeatures.value = (project.metadata.compatibility && project.metadata.compatibility.features)
    ? project.metadata.compatibility.features.join(',') : '';
}
// Initialize metadata panel
if (typeof updateMetadataPanel === 'function') updateMetadataPanel();
// Update metadata on user input
 [metaTitle, metaAuthor, metaDescription, metaTags, metaLicense].forEach(input => {
  input.addEventListener('input', () => {
    pushHistory();
    project.metadata.title = metaTitle.value;
    project.metadata.author = metaAuthor.value;
    project.metadata.description = metaDescription.value;
    project.metadata.tags = metaTags.value.split(',').map(s => s.trim()).filter(s => s);
    project.metadata.license = metaLicense.value;
    project.metadata.modified = new Date().toISOString();
  });
});
// Extended metadata input handlers
[metaWorkSeries, metaWorkCharacter, metaWorkScene, metaWorkVariation].forEach(input => {
  input.addEventListener('input', () => {
    pushHistory();
    project.metadata.work.series = metaWorkSeries.value;
    project.metadata.work.character = metaWorkCharacter.value;
    project.metadata.work.scene = metaWorkScene.value;
    project.metadata.work.variation = metaWorkVariation.value;
    project.metadata.modified = new Date().toISOString();
  });
});
[metaToolName, metaToolVersion, metaToolExporter].forEach(input => {
  input.addEventListener('input', () => {
    pushHistory();
    project.metadata.tool.name = metaToolName.value;
    project.metadata.tool.version = metaToolVersion.value;
    project.metadata.tool.exporter = metaToolExporter.value;
    project.metadata.modified = new Date().toISOString();
  });
});
metaCompatMinVersion.addEventListener('input', () => {
  pushHistory();
  project.metadata.compatibility.minVersion = metaCompatMinVersion.value;
  project.metadata.modified = new Date().toISOString();
});
metaCompatFeatures.addEventListener('input', () => {
  pushHistory();
  project.metadata.compatibility.features = metaCompatFeatures.value
    .split(',').map(s => s.trim()).filter(s => s);
  project.metadata.modified = new Date().toISOString();
});
}
// --- Canvas & Display Settings Setup ---
if (document.getElementById('canvas-pixel-unit')) {
  const canvasPixelUnitInput = document.getElementById('canvas-pixel-unit');
  const canvasAspectRatioInput = document.getElementById('canvas-aspect-ratio');
  const canvasBgColorInput = document.getElementById('canvas-bg-color');
  const bgOffsetXInput = document.getElementById('background-offset-x');
  const bgOffsetYInput = document.getElementById('background-offset-y');
  const bgScaleInput = document.getElementById('background-scale');
/** Populate canvas settings inputs from project.canvas */
function updateCanvasSettingsPanel() {
  const cs = project.canvas;
  canvasPixelUnitInput.value = cs.pixelUnit;
  canvasAspectRatioInput.value = cs.pixelAspectRatio;
    canvasBgColorInput.value = cs.backgroundColor;
    if (bgOffsetXInput) bgOffsetXInput.value = backgroundOffset.x;
    if (bgOffsetYInput) bgOffsetYInput.value = backgroundOffset.y;
    if (bgScaleInput) bgScaleInput.value = backgroundScale;
}
// Initialize canvas settings panel
updateCanvasSettingsPanel();
  // Update project.canvas on user input
  [canvasPixelUnitInput, canvasAspectRatioInput, canvasBgColorInput].forEach(input => {
    input.addEventListener('input', () => {
      pushHistory();
      project.canvas.pixelUnit = parseFloat(canvasPixelUnitInput.value) || 1.0;
      project.canvas.pixelAspectRatio = parseFloat(canvasAspectRatioInput.value) || 1.0;
      project.canvas.backgroundColor = canvasBgColorInput.value;
      project.metadata.modified = new Date().toISOString();
      renderCanvas();
    });
  });
  // Background offset inputs
  if (bgOffsetXInput) {
    bgOffsetXInput.addEventListener('input', () => {
      backgroundOffset.x = parseInt(bgOffsetXInput.value, 10) || 0;
      renderCanvas();
    });
  }
  if (bgOffsetYInput) {
    bgOffsetYInput.addEventListener('input', () => {
      backgroundOffset.y = parseInt(bgOffsetYInput.value, 10) || 0;
      renderCanvas();
    });
  }
  if (bgScaleInput) {
    bgScaleInput.addEventListener('input', () => {
      backgroundScale = parseFloat(bgScaleInput.value) || 1;
      renderCanvas();
    });
  }
}
// --- Coordinate System Settings Setup ---
if (document.getElementById('coord-origin')) {
const coordOriginInput = document.getElementById('coord-origin');
const coordXAxisInput = document.getElementById('coord-x-axis');
const coordYAxisInput = document.getElementById('coord-y-axis');
const coordUnitInput = document.getElementById('coord-unit');
const coordBaseUnitInput = document.getElementById('coord-base-unit');
const coordPrecisionInput = document.getElementById('coord-precision');
const coordAllowFloatInput = document.getElementById('coord-allow-float');
/** Populate coordinate system inputs from project.coordinateSystem */
function updateCoordSettingsPanel() {
  const cs = project.coordinateSystem;
  coordOriginInput.value = cs.origin;
  coordXAxisInput.value = cs.xAxis;
  coordYAxisInput.value = cs.yAxis;
  coordUnitInput.value = cs.unit;
  coordBaseUnitInput.value = cs.baseUnit;
  coordPrecisionInput.value = cs.subPixelPrecision;
  coordAllowFloatInput.checked = cs.allowFloatingPoint;
}
updateCoordSettingsPanel();
[coordOriginInput, coordXAxisInput, coordYAxisInput, coordUnitInput,
 coordBaseUnitInput, coordPrecisionInput, coordAllowFloatInput].forEach(el => {
  el.addEventListener('input', () => {
    pushHistory();
    const cs = project.coordinateSystem;
    cs.origin = coordOriginInput.value;
    cs.xAxis = coordXAxisInput.value;
    cs.yAxis = coordYAxisInput.value;
    cs.unit = coordUnitInput.value;
    cs.baseUnit = parseFloat(coordBaseUnitInput.value) || 1.0;
    cs.subPixelPrecision = parseInt(coordPrecisionInput.value, 10) || 0;
    cs.allowFloatingPoint = coordAllowFloatInput.checked;
    project.metadata.modified = new Date().toISOString();
    renderCanvas();
  });
});
}
// --- Color Space Settings Setup ---
if (document.getElementById('cs-profile')) {
const csProfileInput = document.getElementById('cs-profile');
const csBitdepthInput = document.getElementById('cs-bitdepth');
const csGammaInput = document.getElementById('cs-gamma');
const csWhitepointInput = document.getElementById('cs-whitepoint');
/** Populate color space inputs from project.colorSpace */
function updateColorSpacePanel() {
  const cs = project.colorSpace;
  csProfileInput.value = cs.profile;
  csBitdepthInput.value = cs.bitDepth;
  csGammaInput.value = cs.gamma;
  csWhitepointInput.value = cs.whitePoint;
}
updateColorSpacePanel();
[csProfileInput, csBitdepthInput, csGammaInput, csWhitepointInput].forEach(el => {
  el.addEventListener('input', () => {
    pushHistory();
    const cs = project.colorSpace;
    cs.profile = csProfileInput.value;
    cs.bitDepth = parseInt(csBitdepthInput.value, 10) || 8;
    cs.gamma = parseFloat(csGammaInput.value) || 1.0;
    cs.whitePoint = csWhitepointInput.value;
    project.metadata.modified = new Date().toISOString();
  });
});
}
// --- Compression Profile Settings Setup ---
if (document.getElementById('cp-name')) {
const cpNameInput = document.getElementById('cp-name');
const cpAutoInput = document.getElementById('cp-auto');
const cpQualityInput = document.getElementById('cp-quality');
/** Populate compression profile inputs from project.compressionProfile */
function updateCompressionProfilePanel() {
  const cp = project.compressionProfile;
  cpNameInput.value = cp.name;
  cpAutoInput.checked = cp.settings.autoSelect;
  cpQualityInput.value = cp.settings.quality;
}
updateCompressionProfilePanel();
[cpNameInput, cpAutoInput, cpQualityInput].forEach(el => {
  el.addEventListener('input', () => {
    pushHistory();
    const cp = project.compressionProfile;
    cp.name = cpNameInput.value;
    cp.settings.autoSelect = cpAutoInput.checked;
    cp.settings.quality = parseFloat(cpQualityInput.value) || cp.settings.quality;
    project.metadata.modified = new Date().toISOString();
  });
});
}
// History stacks for undo/redo
let undoStack = [];
let redoStack = [];
// Update Undo/Redo button states
function updateUndoRedoButtons() {
  const undoBtn = document.getElementById('undo');
  const redoBtn = document.getElementById('redo');
  if (undoBtn) undoBtn.disabled = undoStack.length === 0;
  if (redoBtn) redoBtn.disabled = redoStack.length === 0;
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
// Resolution controls (guarded)
if (document.getElementById('canvas-width')) {
  const widthInput = document.getElementById('canvas-width');
  const heightInput = document.getElementById('canvas-height');
  document.getElementById('set-resolution').addEventListener('click', () => {
    const newWidth = parseInt(widthInput.value, 10);
    const newHeight = parseInt(heightInput.value, 10);
    if (!newWidth || !newHeight || newWidth < 1 || newHeight < 1) {
      alert('Invalid dimensions');
      return;
    }
    // Resize project while preserving existing content
    const oldWidth = project.canvas.baseWidth != null ? project.canvas.baseWidth : project.canvas.width;
    const oldHeight = project.canvas.baseHeight != null ? project.canvas.baseHeight : project.canvas.height;
    pushHistory();
    // Update canvas dimensions
    project.canvas.baseWidth = newWidth;
    project.canvas.baseHeight = newHeight;
    project.canvas.width = newWidth;
    project.canvas.height = newHeight;
    project.metadata.modified = new Date().toISOString();
    // Resize each layer's pixel data and resolution
    project.layers.forEach(layer => {
      const res = layer.resolution || {};
      const oldW = res.pixelArraySize?.width ?? oldWidth;
      const oldH = res.pixelArraySize?.height ?? oldHeight;
      const scale = typeof res.scale === 'number' ? res.scale : 1;
      // Update resolution size
      layer.resolution.pixelArraySize = { width: newWidth, height: newHeight };
      if (layer.resolution.effectiveSize) {
        layer.resolution.effectiveSize.width = newWidth * scale;
        layer.resolution.effectiveSize.height = newHeight * scale;
      }
      // Resize pixel data array
      if (layer.pixels && Array.isArray(layer.pixels.data)) {
        const oldData = layer.pixels.data;
        const defaultValue = null;
        const newData = [];
        for (let y = 0; y < newHeight; y++) {
          for (let x = 0; x < newWidth; x++) {
            if (y < oldH && x < oldW) {
              newData.push(oldData[y * oldW + x]);
            } else {
              newData.push(defaultValue);
            }
          }
        }
        layer.pixels.data = newData;
        if ('width' in layer.pixels) layer.pixels.width = newWidth;
        if ('height' in layer.pixels) layer.pixels.height = newHeight;
      }
    });
    // Update local width/height variables
    width = newWidth;
    height = newHeight;
    // Update UI and re-render
    syncLayerGridToggles();
    renderLayers();
    renderCanvas();
    widthInput.value = newWidth;
    heightInput.value = newHeight;
  });
}
// Zoom and pan state
// Internal pixel zoom
let zoom = 1;
let panX = 0, panY = 0;
let isPanning = false;
let panStart = { x: 0, y: 0 };
let panOffsetStart = { x: 0, y: 0 };
// CSS scale for canvas element (container zoom)
let containerScale = 1;
// Cursor hover position in layer coordinates
let cursorLayer = { x: -1, y: -1 };

/** Update cursorLayer based on mouse event */
function updateCursor(e) {
  const rect = canvas.getBoundingClientRect();
  // Account for CSS scaling of canvas element
  const canvasX = (e.clientX - rect.left) / containerScale;
  const canvasY = (e.clientY - rect.top)  / containerScale;
  const baseW = project.canvas.baseWidth;
  const baseH = project.canvas.baseHeight;
  const pixelSize = Math.floor(Math.min(canvas.width / baseW, canvas.height / baseH));
  const worldX = (canvasX - panX) / zoom;
  const worldY = (canvasY - panY) / zoom;
  const gridX = worldX / pixelSize;
  const gridY = worldY / pixelSize;
  const layer = project.layers[currentLayerIndex];
  if (!layer) { cursorLayer = { x: -1, y: -1 }; return; }
  const res = layer.resolution || { pixelArraySize: { width: baseW, height: baseH }, scale: 1 };
  const scale = res.scale;
  const offset = layer.placement || { x: 0, y: 0 };
  const lx = Math.floor((gridX - offset.x) / scale);
  const ly = Math.floor((gridY - offset.y) / scale);
  if (lx >= 0 && ly >= 0 && lx < res.pixelArraySize.width && ly < res.pixelArraySize.height) {
    cursorLayer = { x: lx, y: ly };
  } else {
    cursorLayer = { x: -1, y: -1 };
  }
}

// Render canvas with zoom and pan
function renderCanvas() {
  // Reset transform and clear canvas
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  // Fill canvas background color if specified
  if (project.canvas && project.canvas.backgroundColor) {
    ctx.fillStyle = project.canvas.backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  // Draw background image with visibility and opacity, preserving aspect ratio
  if (backgroundImg && backgroundVisible) {
    ctx.globalAlpha = backgroundOpacity;
    // Compute draw dimensions based on intrinsic size and scale
    const imgW = backgroundImg.naturalWidth || backgroundImg.width;
    const imgH = backgroundImg.naturalHeight || backgroundImg.height;
    const drawW = imgW * backgroundScale;
    const drawH = imgH * backgroundScale;
    ctx.drawImage(backgroundImg,
                  backgroundOffset.x, backgroundOffset.y,
                  drawW, drawH);
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
  // Draw pixel layers using hex-only palette array
  drawProject(ctx, project, project.palette.map(e => e.hex));
  // Draw per-layer grid overlays
  // Compute base pixel size (before zoom transform)
  const baseW = project.canvas.baseWidth;
  const baseH = project.canvas.baseHeight;
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
  // Draw hover cursor overlay for pen/eraser
  if ((tool === 'pen' || tool === 'eraser') && cursorLayer.x >= 0) {
    const layer = project.layers[currentLayerIndex];
    const res = layer.resolution || { pixelArraySize: { width: baseW, height: baseH }, scale: 1 };
    const scale = res.scale;
    const offset = layer.placement || { x: 0, y: 0 };
    ctx.save();
    ctx.strokeStyle = '#f00';
    ctx.setLineDash([4 / zoom]);
    ctx.lineWidth = 1 / zoom;
    const x0 = (offset.x + cursorLayer.x * scale) * pixelSize;
    const y0 = (offset.y + cursorLayer.y * scale) * pixelSize;
    const size = pixelSize * scale;
    ctx.strokeRect(x0, y0, size, size);
    ctx.restore();
  }
  // Draw start point indicator for line tool
  if (tool === 'line' && lineStart) {
    const layer = project.layers[currentLayerIndex];
    const res = layer.resolution || { pixelArraySize: { width: baseW, height: baseH }, scale: 1 };
    const scale = res.scale;
    const offset = layer.placement || { x: 0, y: 0 };
    ctx.save();
    ctx.strokeStyle = '#0f0';
    ctx.setLineDash([4 / zoom]);
    ctx.lineWidth = 1 / zoom;
    const sx = (offset.x + lineStart.x * scale) * pixelSize;
    const sy = (offset.y + lineStart.y * scale) * pixelSize;
    const size = pixelSize * scale;
    ctx.strokeRect(sx, sy, size, size);
    ctx.restore();
  }
}

/**
 * Handle pen/eraser drawing at canvas-relative coordinates
 * @param {number} canvasX x-coordinate relative to canvas
 * @param {number} canvasY y-coordinate relative to canvas
 */
function handleBrush(canvasX, canvasY) {
  const width = project.canvas.baseWidth;
  const height = project.canvas.baseHeight;
  // Map to world then to grid coords
  const worldX = (canvasX - panX) / zoom;
  const worldY = (canvasY - panY) / zoom;
  const pixelSize = Math.floor(Math.min(canvas.width / width, canvas.height / height));
  const gridX = worldX / pixelSize;
  const gridY = worldY / pixelSize;
  const layer = project.layers[currentLayerIndex];
  if (!layer || !layer.pixels || !layer.pixels.data) return;
  const res = layer.resolution || { pixelArraySize: { width, height }, scale: 1 };
  const arr = res.pixelArraySize;
  const scale = res.scale;
  const offset = layer.placement || { x: 0, y: 0 };
  const layerX = Math.floor((gridX - offset.x) / scale);
  const layerY = Math.floor((gridY - offset.y) / scale);
  const w = arr.width, h = arr.height;
  if (layerX < 0 || layerY < 0 || layerX >= w || layerY >= h) return;
  const data = layer.pixels.data;
  const brushSize = parseInt(document.getElementById('brush-size').value, 10) || 1;
  const half = Math.floor(brushSize / 2);
  const doErase = (tool === 'eraser');
  const value = doErase ? 0 : (currentColorIndex + 1);
  for (let dy = -half; dy <= half; dy++) {
    for (let dx = -half; dx <= half; dx++) {
      if (brushShape === 'circle' && dx * dx + dy * dy > half * half) continue;
      if (brushShape === 'cross' && dx !== 0 && dy !== 0) continue;
      const xi = layerX + dx;
      const yi = layerY + dy;
      if (xi < 0 || yi < 0 || xi >= w || yi >= h) continue;
      const points = [{ x: xi, y: yi }];
      if (symmetryMode === 'vertical' || symmetryMode === 'both') points.push({ x: w - 1 - xi, y: yi });
      if (symmetryMode === 'horizontal' || symmetryMode === 'both') points.push({ x: xi, y: h - 1 - yi });
      if (symmetryMode === 'both') points.push({ x: w - 1 - xi, y: h - 1 - yi });
      points.forEach(pt => {
        data[pt.y * w + pt.x] = value;
      });
    }
  }
  renderCanvas();
}
// Render color palette UI
const paletteContainer = document.getElementById('palette');
// Hidden color input for palette editing
const paletteColorInput = document.createElement('input');
paletteColorInput.type = 'color';
paletteColorInput.style.display = 'none';
document.body.appendChild(paletteColorInput);
function renderPalette() {
  // Clear container and render palette entries as draggable items
  paletteContainer.innerHTML = '';
  palette.forEach((entry, idx) => {
    const entryDiv = document.createElement('div');
    entryDiv.draggable = true;
    entryDiv.style.display = 'inline-flex';
    entryDiv.style.alignItems = 'center';
    entryDiv.style.margin = '2px';
    entryDiv.style.border = idx === currentColorIndex ? '2px solid #000' : '1px solid #888';
    entryDiv.dataset.index = idx;
    // Drag & Drop handlers
    entryDiv.addEventListener('dragstart', e => {
      e.dataTransfer.setData('text/plain', idx.toString());
    });
    entryDiv.addEventListener('dragover', e => {
      e.preventDefault();
      entryDiv.style.border = '2px dashed #555';
    });
    entryDiv.addEventListener('dragleave', () => {
      entryDiv.style.border = idx === currentColorIndex ? '2px solid #000' : '1px solid #888';
    });
    entryDiv.addEventListener('drop', e => {
      e.preventDefault();
      const fromIdx = parseInt(e.dataTransfer.getData('text/plain'), 10);
      const toIdx = idx;
      if (fromIdx !== toIdx) {
        pushHistory();
        const moved = palette.splice(fromIdx, 1)[0];
        palette.splice(toIdx, 0, moved);
        project.palette = palette;
        currentColorIndex = toIdx;
        renderPalette();
      }
    });
    // Swatch button
    const swatch = document.createElement('button');
    swatch.style.backgroundColor = entry.hex;
    swatch.style.width = '24px';
    swatch.style.height = '24px';
    swatch.style.margin = '0 4px 0 0';
    swatch.title = entry.name || `Color ${idx + 1}`;
    swatch.addEventListener('click', () => { currentColorIndex = idx; renderPalette(); });
    swatch.addEventListener('dblclick', () => {
      if (entry.locked) return;
      paletteColorInput.value = entry.hex;
      paletteColorInput.onchange = () => {
        pushHistory();
        entry.hex = paletteColorInput.value;
        // Update derived fields
        updateColorSpaces(entry);
        project.palette = palette;
        renderPalette();
      };
      paletteColorInput.click();
    });
    entryDiv.appendChild(swatch);
    // Name input
    const nameInput = document.createElement('input');
    nameInput.type = 'text'; nameInput.value = entry.name;
    nameInput.disabled = entry.locked;
    nameInput.style.width = '60px'; nameInput.style.marginRight = '4px';
    nameInput.addEventListener('change', () => { pushHistory(); entry.name = nameInput.value; project.palette = palette; });
    entryDiv.appendChild(nameInput);
    // Usage input
    const usageInput = document.createElement('input');
    usageInput.type = 'text'; usageInput.value = entry.usage;
    usageInput.disabled = entry.locked;
    usageInput.placeholder = 'usage';
    usageInput.style.width = '60px'; usageInput.style.marginRight = '4px';
    usageInput.addEventListener('change', () => { pushHistory(); entry.usage = usageInput.value; project.palette = palette; });
    entryDiv.appendChild(usageInput);
    // Lock checkbox
    const lockCheckbox = document.createElement('input');
    lockCheckbox.type = 'checkbox'; lockCheckbox.checked = entry.locked;
    lockCheckbox.title = 'Locked'; lockCheckbox.style.marginRight = '4px';
    lockCheckbox.addEventListener('change', () => { pushHistory(); entry.locked = lockCheckbox.checked; project.palette = palette; renderPalette(); });
    entryDiv.appendChild(lockCheckbox);
    paletteContainer.appendChild(entryDiv);
  });
}
renderPalette();
// Palette editing controls
document.getElementById('add-color')?.addEventListener('click', () => {
    // Add new palette entry
    const ids = palette.map(e => e.id);
    const nextId = ids.length ? Math.max(...ids) + 1 : 0;
    const newEntry = { id: nextId, name: `Color ${nextId + 1}`, hex: '#000000', usage: '', locked: false };
    // Derive color spaces
    updateColorSpaces(newEntry);
    pushHistory();
    palette.push(newEntry);
    project.palette = palette;
    renderPalette();
});
document.getElementById('remove-color')?.addEventListener('click', () => {
  if (palette.length <= 1) {
    alert('At least one color must remain.');
    return;
  }
  // Remove last palette entry
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
const layerList = document.getElementById('layers');
function renderLayers() {
  // Ensure grid toggles array matches current layers
  syncLayerGridToggles();
  layerList.innerHTML = '';
  project.layers.forEach((layer, idx) => {
    const li = document.createElement('li');
    // Style layer container and highlight active
    li.style.border = '1px solid #ccc';
    li.style.padding = '4px';
    li.style.marginBottom = '4px';
    if (idx === currentLayerIndex) {
      li.style.backgroundColor = '#e0f7ff';
    }
    // Visibility toggle
    const visLabel = document.createElement('label');
    visLabel.style.marginRight = '8px';
    const visCheckbox = document.createElement('input');
    visCheckbox.type = 'checkbox';
    visCheckbox.checked = layer.visible;
    visCheckbox.addEventListener('change', () => {
      pushHistory();
      layer.visible = visCheckbox.checked;
      renderCanvas();
    });
    visLabel.appendChild(visCheckbox);
    visLabel.appendChild(document.createTextNode('Visible'));
    li.appendChild(visLabel);
    // Grid toggle per layer
    const gridLabel = document.createElement('label');
    gridLabel.style.marginRight = '8px';
    const gridCheckbox = document.createElement('input');
    gridCheckbox.type = 'checkbox';
    gridCheckbox.checked = layerGridToggles[idx];
    gridCheckbox.title = 'Grid';
    gridCheckbox.addEventListener('change', () => {
      layerGridToggles[idx] = gridCheckbox.checked;
      renderCanvas();
    });
    gridLabel.appendChild(gridCheckbox);
    gridLabel.appendChild(document.createTextNode('Grid'));
    li.appendChild(gridLabel);
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
    const opacityLabel = document.createElement('label');
    opacityLabel.style.marginLeft = '8px';
    opacityLabel.textContent = 'Opacity: ';
    const opacityInput = document.createElement('input');
    opacityInput.type = 'range';
    opacityInput.min = 0;
    opacityInput.max = 1;
    opacityInput.step = 0.1;
    opacityInput.value = layer.opacity != null ? layer.opacity : 1;
    opacityInput.addEventListener('input', () => {
      pushHistory();
      layer.opacity = parseFloat(opacityInput.value);
      renderCanvas();
    });
    opacityLabel.appendChild(opacityInput);
    li.appendChild(opacityLabel);
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
    // --- Advanced settings accordion ---
    const advToggle = document.createElement('button');
    advToggle.textContent = '▶ Details';
    advToggle.style.display = 'block';
    advToggle.style.width = '100%';
    advToggle.style.margin = '4px 0';
    advToggle.style.padding = '2px 4px';
    advToggle.style.textAlign = 'left';
    advToggle.style.backgroundColor = '#f5f5f5';
    advToggle.style.border = '1px solid #ccc';
    advToggle.style.cursor = 'pointer';
    const advPanel = document.createElement('div');
    advPanel.style.display = 'none';
    advPanel.style.marginLeft = '16px';
    advToggle.addEventListener('click', () => {
      const show = advPanel.style.display === 'none';
      advPanel.style.display = show ? 'block' : 'none';
      advToggle.textContent = show ? '▼ Details' : '▶ Details';
    });
    li.appendChild(advToggle);
    // --- Layer blending mode selector ---
    const blendSelect = document.createElement('select');
    ['normal','multiply','screen','overlay','darken','lighten','hard-light','soft-light','color-dodge','color-burn'].forEach(mode => {
      const opt = document.createElement('option');
      opt.value = mode;
      opt.textContent = mode;
      if (layer.blending === mode) opt.selected = true;
      blendSelect.appendChild(opt);
    });
    blendSelect.title = 'Blending mode';
    blendSelect.style.marginLeft = '8px';
    blendSelect.addEventListener('change', () => {
      pushHistory();
      layer.blending = blendSelect.value;
      project.metadata.modified = new Date().toISOString();
      renderCanvas();
    });
    advPanel.appendChild(blendSelect);
    // --- Layer transform controls: scale and rotation ---
    const scaleInput = document.createElement('input');
    scaleInput.type = 'number'; scaleInput.step = '0.1'; scaleInput.min = '0.1';
    scaleInput.value = layer.transform?.scale || 1.0;
    scaleInput.title = 'Transform scale';
    scaleInput.style.width = '50px'; scaleInput.style.marginLeft = '8px';
    scaleInput.addEventListener('change', () => {
      pushHistory();
      layer.transform = layer.transform || { scale: 1.0, rotation: 0 };
      layer.transform.scale = parseFloat(scaleInput.value) || 1.0;
      project.metadata.modified = new Date().toISOString();
      renderCanvas();
    });
    advPanel.appendChild(scaleInput);
    const rotInput = document.createElement('input');
    rotInput.type = 'number'; rotInput.step = '1'; rotInput.min = '0'; rotInput.max = '360';
    rotInput.value = layer.transform?.rotation || 0;
    rotInput.title = 'Transform rotation (deg)';
    rotInput.style.width = '50px'; rotInput.style.marginLeft = '4px';
    rotInput.addEventListener('change', () => {
      pushHistory();
      layer.transform = layer.transform || { scale: 1.0, rotation: 0 };
      layer.transform.rotation = parseFloat(rotInput.value) || 0;
      project.metadata.modified = new Date().toISOString();
      renderCanvas();
    });
    advPanel.appendChild(rotInput);
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
      // Anchor selector
      const anchorSelect = document.createElement('select');
      ['top-left','top-right','bottom-left','bottom-right','center'].forEach(opt => {
        const o = document.createElement('option');
        o.value = opt;
        o.textContent = opt;
        if (layer.placement.anchor === opt) o.selected = true;
        anchorSelect.appendChild(o);
      });
      anchorSelect.title = 'Layer anchor';
      anchorSelect.style.marginLeft = '4px';
      anchorSelect.addEventListener('change', () => {
        pushHistory();
        layer.placement.anchor = anchorSelect.value;
        project.metadata.modified = new Date().toISOString();
        renderCanvas();
      });
      li.appendChild(anchorSelect);
      // Allow sub-pixel checkbox
      const subPixelCheckbox = document.createElement('input');
      subPixelCheckbox.type = 'checkbox';
      subPixelCheckbox.checked = layer.placement.allowSubPixel;
      subPixelCheckbox.title = 'Allow sub-pixel placement';
      subPixelCheckbox.style.marginLeft = '4px';
      subPixelCheckbox.addEventListener('change', () => {
        pushHistory();
        layer.placement.allowSubPixel = subPixelCheckbox.checked;
        project.metadata.modified = new Date().toISOString();
        renderCanvas();
      });
      li.appendChild(subPixelCheckbox);
      // --- Pixel encoding selector ---
      const encSelect = document.createElement('select');
      ['raw','rle','sparse'].forEach(enc => {
        const o = document.createElement('option');
        o.value = enc;
        o.textContent = enc;
        if ((layer.pixels.encoding || 'raw') === enc) o.selected = true;
        encSelect.appendChild(o);
      });
      encSelect.title = 'Pixel encoding';
      encSelect.style.marginLeft = '8px';
      encSelect.addEventListener('change', () => {
        pushHistory();
        layer.pixels.encoding = encSelect.value;
        project.metadata.modified = new Date().toISOString();
        renderCanvas();
      });
      advPanel.appendChild(encSelect);
      // --- Pixel compression selector ---
      const compSelect = document.createElement('select');
      ['none','auto'].forEach(comp => {
        const o = document.createElement('option');
        o.value = comp;
        o.textContent = comp;
        if ((layer.pixels.compression || 'none') === comp) o.selected = true;
        compSelect.appendChild(o);
      });
      compSelect.title = 'Pixel compression';
      compSelect.style.marginLeft = '4px';
      compSelect.addEventListener('change', () => {
        pushHistory();
        layer.pixels.compression = compSelect.value;
        project.metadata.modified = new Date().toISOString();
      });
      advPanel.appendChild(compSelect);
    })();
    // Append advanced settings panel
    li.appendChild(advPanel);
    layerList.appendChild(li);
  });
}
renderLayers();
// Add Layer button
document.getElementById('add-layer')?.addEventListener('click', () => {
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
document.getElementById('remove-layer')?.addEventListener('click', () => {
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
// Current primary tool: 'pen', 'eraser', 'line', 'bucket', 'colorpicker', or 'pan'
let tool = 'pen';
// Remember last pen/eraser mode to apply shape tools accordingly
let lastMode = 'pen';
/** Update tool button UI to reflect current tool */
function updateToolUI() {
  document.querySelectorAll('#tool-controls button').forEach(btn => {
    const id = btn.id;
    if (id === 'pen' || id === 'eraser') {
      // Highlight current draw mode
      btn.classList.toggle('active', id === lastMode);
    } else if (id === 'line' || id === 'bucket' || id === 'color-picker' || id === 'pan') {
      // Highlight current shape/tool mode
      btn.classList.toggle('active', id === tool);
    } else {
      btn.classList.remove('active');
    }
  });
}
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
document.getElementById('pen')?.addEventListener('click', () => { tool = 'pen'; lastMode = 'pen'; updateToolUI(); });
document.getElementById('eraser')?.addEventListener('click', () => { tool = 'eraser'; lastMode = 'eraser'; updateToolUI(); });
// Line and bucket shape selectors
document.getElementById('line')?.addEventListener('click', () => { tool = 'line'; lineStart = null; updateToolUI(); });
document.getElementById('bucket')?.addEventListener('click', () => { tool = 'bucket'; updateToolUI(); });
document.getElementById('color-picker')?.addEventListener('click', () => { tool = 'colorpicker'; updateToolUI(); });
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
const durationInput = document.getElementById('frame-duration');
const loopCheckbox = document.getElementById('loop-check');
const pingpongCheckbox = document.getElementById('pingpong-check');
const interpSelect = document.getElementById('interp-select');
function updateFrameIndicator() {
  frameIndicator.textContent = `Frame ${currentFrameIndex+1}/${project.frames.length}`;
  if (durationInput) {
    const dur = project.frames[currentFrameIndex]?.duration;
    durationInput.value = typeof dur === 'number' ? dur : '';
  }
  if (loopCheckbox) loopCheckbox.checked = !!project.animations.loops;
  if (pingpongCheckbox) pingpongCheckbox.checked = !!project.animations.pingPong;
  if (interpSelect) interpSelect.value = project.animations.interpolation || 'none';
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
  // Update frame thumbnail list
  if (typeof renderFrameList === 'function') renderFrameList();
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
  // Prevent deletion if only one frame
  if (project.frames.length <= 1) {
    alert('Cannot remove the only remaining frame.');
    return;
  }
  // Prevent deletion of the last frame in the sequence
  if (currentFrameIndex === project.frames.length - 1) {
    alert('Cannot remove the last frame. Select another frame to remove.');
    return;
  }
  // Remove currently selected frame via filter
  const removeIdx = currentFrameIndex;
  project.frames = project.frames.filter((_, idx) => idx !== removeIdx);
  // After removal, select next frame (or last if removed was last)
  const newIdx = Math.min(removeIdx, project.frames.length - 1);
  setFrame(newIdx);
});
// Frame duration edit handler
if (durationInput) {
  durationInput.addEventListener('change', () => {
    const val = parseFloat(durationInput.value);
    if (isNaN(val) || val <= 0) {
      durationInput.value = project.frames[currentFrameIndex].duration;
      return;
    }
    pushHistory();
    project.frames[currentFrameIndex].duration = val;
    project.metadata.modified = new Date().toISOString();
  });
}
// Animation settings handlers
if (loopCheckbox) {
  loopCheckbox.addEventListener('change', () => {
    pushHistory(); project.animations.loops = loopCheckbox.checked;
    project.metadata.modified = new Date().toISOString();
  });
}
if (pingpongCheckbox) {
  pingpongCheckbox.addEventListener('change', () => {
    pushHistory(); project.animations.pingPong = pingpongCheckbox.checked;
    project.metadata.modified = new Date().toISOString();
  });
}
if (interpSelect) {
  interpSelect.addEventListener('change', () => {
    pushHistory(); project.animations.interpolation = interpSelect.value;
    project.metadata.modified = new Date().toISOString();
  });
}
// --- Frame tags editor setup ---
const frameTagInput = document.getElementById('frame-tag-input');
const addFrameTagBtn = document.getElementById('add-frame-tag');
const removeFrameTagBtn = document.getElementById('remove-frame-tag');
const frameTagList = document.getElementById('frame-tag-list');
let currentFrameTagIndex = -1;
/** Render the list of tags for the current frame */
function renderFrameTags() {
  if (!frameTagList) return;
  const tags = project.frames[currentFrameIndex]?.tags || [];
  frameTagList.innerHTML = '';
  tags.forEach((tag, idx) => {
    const li = document.createElement('li');
    li.textContent = tag;
    li.style.cursor = 'pointer';
    li.style.padding = '2px 4px';
    li.style.border = idx === currentFrameTagIndex ? '1px solid #000' : '1px solid #ccc';
    li.addEventListener('click', () => {
      currentFrameTagIndex = idx;
      renderFrameTags();
    });
    frameTagList.appendChild(li);
  });
  // Reset selection if out of range
  if (currentFrameTagIndex >= tags.length) currentFrameTagIndex = -1;
}
// Bind add/remove
if (addFrameTagBtn) {
  addFrameTagBtn.addEventListener('click', () => {
    const val = frameTagInput.value.trim();
    if (!val) return;
    pushHistory();
    const frame = project.frames[currentFrameIndex];
    frame.tags = Array.isArray(frame.tags) ? frame.tags : [];
    if (!frame.tags.includes(val)) {
      frame.tags.push(val);
      project.metadata.modified = new Date().toISOString();
    }
    frameTagInput.value = '';
    currentFrameTagIndex = frame.tags.length - 1;
    renderFrameTags();
  });
}
if (removeFrameTagBtn) {
  removeFrameTagBtn.addEventListener('click', () => {
    const frame = project.frames[currentFrameIndex];
    frame.tags = Array.isArray(frame.tags) ? frame.tags : [];
    if (currentFrameTagIndex < 0 || currentFrameTagIndex >= frame.tags.length) return;
    pushHistory();
    frame.tags.splice(currentFrameTagIndex, 1);
    project.metadata.modified = new Date().toISOString();
    currentFrameTagIndex = -1;
    renderFrameTags();
  });
}
// Hook into frame change to refresh tags and events UI
const origSetFrame = setFrame;
setFrame = function(idx) {
  origSetFrame(idx);
  // Ensure tags/events arrays exist on the frame
  const frame = project.frames[currentFrameIndex];
  if (!Array.isArray(frame.tags)) frame.tags = [];
  if (!Array.isArray(frame.events)) frame.events = [];
  renderFrameTags();
  renderFrameEvents();
};
// Initial render of tags
renderFrameTags();
// Frame thumbnails rendering
const frameListEl = document.getElementById('frame-list');
/** Render horizontal list of frame thumbnails */
function renderFrameList() {
  if (!frameListEl) return;
  frameListEl.innerHTML = '';
  project.frames.forEach((frame, i) => {
    const thumb = document.createElement('canvas');
    const size = 64;
    thumb.width = size;
    thumb.height = size;
    thumb.style.margin = '0 4px';
    thumb.style.cursor = 'pointer';
    // Draw frame layers into thumbnail
    const ctx = thumb.getContext('2d');
    // Optionally fill background
    ctx.fillStyle = project.canvas.backgroundColor || '#fff';
    ctx.fillRect(0, 0, size, size);
    // Temporarily set project.layers to frame.layers
    const origLayers = project.layers;
    project.layers = frame.layers;
    // Draw into thumb
    drawProject(ctx, project, project.palette);
    // Restore layers
    project.layers = origLayers;
    // Highlight active frame
    if (i === currentFrameIndex) {
      thumb.style.outline = '2px solid #007acc';
    }
    thumb.addEventListener('click', () => setFrame(i));
    frameListEl.appendChild(thumb);
  });
}
// Initial thumbnail list
renderFrameList();
// Frame events editor setup
const frameEventInput = document.getElementById('frame-event-input');
const addFrameEventBtn = document.getElementById('add-frame-event');
const removeFrameEventBtn = document.getElementById('remove-frame-event');
const frameEventList = document.getElementById('frame-event-list');
let currentFrameEventIndex = -1;
/** Render list of events for current frame */
function renderFrameEvents() {
  if (!frameEventList) return;
  const events = project.frames[currentFrameIndex]?.events || [];
  frameEventList.innerHTML = '';
  events.forEach((ev, idx) => {
    const li = document.createElement('li');
    li.textContent = ev;
    li.style.cursor = 'pointer';
    li.style.padding = '2px 4px';
    li.style.border = idx === currentFrameEventIndex ? '1px solid #000' : '1px solid #ccc';
    li.addEventListener('click', () => {
      currentFrameEventIndex = idx;
      renderFrameEvents();
    });
    frameEventList.appendChild(li);
  });
  if (currentFrameEventIndex >= events.length) currentFrameEventIndex = -1;
}
if (addFrameEventBtn) {
  addFrameEventBtn.addEventListener('click', () => {
    const val = frameEventInput.value.trim();
    if (!val) return;
    pushHistory();
    const frame = project.frames[currentFrameIndex];
    frame.events = Array.isArray(frame.events) ? frame.events : [];
    if (!frame.events.includes(val)) {
      frame.events.push(val);
      project.metadata.modified = new Date().toISOString();
    }
    frameEventInput.value = '';
    currentFrameEventIndex = frame.events.length - 1;
    renderFrameEvents();
  });
}
if (removeFrameEventBtn) {
  removeFrameEventBtn.addEventListener('click', () => {
    const frame = project.frames[currentFrameIndex];
    frame.events = Array.isArray(frame.events) ? frame.events : [];
    if (currentFrameEventIndex < 0 || currentFrameEventIndex >= frame.events.length) return;
    pushHistory();
    frame.events.splice(currentFrameEventIndex, 1);
    project.metadata.modified = new Date().toISOString();
    currentFrameEventIndex = -1;
    renderFrameEvents();
  });
}
// Hook into setFrame for events UI
const origSetFrameEvents = setFrame;
setFrame = function(idx) {
  origSetFrameEvents(idx);
  renderFrameEvents();
};
// Initial render of frame events
renderFrameEvents();
// Play / stop animation preview
let isPlaying = false;
let playTimer = null;
playBtn.addEventListener('click', () => {
  if (!isPlaying) {
    // Start playback
    const fpsVal = Math.max(1, parseInt(fpsInput.value, 10) || project.animations.fps);
    pushHistory(); project.animations.fps = fpsVal; project.metadata.modified = new Date().toISOString();
    playBtn.textContent = 'Stop';
    isPlaying = true;
    playTimer = setInterval(() => {
      const next = (currentFrameIndex + 1) % project.frames.length;
      setFrame(next);
    }, 1000 / fpsVal);
  } else {
    // Stop playback
    clearInterval(playTimer);
    playBtn.textContent = 'Play';
    isPlaying = false;
  }
});
updateFrameIndicator();
document.getElementById('clear')?.addEventListener('click', () => {
  pushHistory();
  // Clear pixel data to transparent (null)
  project.layers[currentLayerIndex].pixels.data.fill(null);
  renderCanvas();
});
// Zoom & pan tool bindings
document.getElementById('pan')?.addEventListener('click', () => { tool = 'pan'; updateToolUI(); });
document.getElementById('zoom-in').addEventListener('click', () => { zoom *= 1.2; renderCanvas(); });
document.getElementById('zoom-out').addEventListener('click', () => { zoom /= 1.2; renderCanvas(); });
 document.getElementById('reset-zoom').addEventListener('click', () => { zoom = 1; panX = 0; panY = 0; renderCanvas(); });
// Canvas zoom & drag tool bindings (scales and moves the canvas element)
// Canvas zoom & drag tool bindings (scales and moves the canvas element)
(function() {
  const canvasEl = document.getElementById('canvas');
  // Translation offset for canvas element
  let canvasOffset = { x: 0, y: 0 };
  function updateCanvasTransform() {
    if (canvasEl) {
      canvasEl.style.transform = `translate(${canvasOffset.x}px, ${canvasOffset.y}px) scale(${containerScale})`;
    }
  }
  if (canvasEl) {
    canvasEl.style.transformOrigin = 'center center';
  }
  document.getElementById('container-zoom-in')?.addEventListener('click', () => {
    containerScale *= 1.2;
    updateCanvasTransform();
  });
  document.getElementById('container-zoom-out')?.addEventListener('click', () => {
    containerScale /= 1.2;
    updateCanvasTransform();
  });
  document.getElementById('container-reset-zoom')?.addEventListener('click', () => {
    // Reset both container zoom scale and position offset
    containerScale = 1;
    canvasOffset = { x: 0, y: 0 };
    updateCanvasTransform();
  });
  // Drag to move canvas
  let isDraggingCanvas = false;
  let dragStart = { x: 0, y: 0 };
  let offsetStart = { x: 0, y: 0 };
  const containerEl = document.getElementById('canvas-container');
  // Mouse wheel to zoom container
  containerEl?.addEventListener('wheel', (e) => {
    e.preventDefault();
    const delta = e.deltaY;
    // Use a smaller zoom step for less sensitivity
    const factor = 1.1;
    if (delta < 0) containerScale *= factor;
    else containerScale /= factor;
    updateCanvasTransform();
  });
  // Mouse drag to move canvas (only when clicking container background)
  containerEl?.addEventListener('mousedown', (e) => {
    if (e.target !== containerEl) return;
    isDraggingCanvas = true;
    dragStart = { x: e.clientX, y: e.clientY };
    offsetStart = { x: canvasOffset.x, y: canvasOffset.y };
    e.preventDefault();
  });
  document.addEventListener('mousemove', (e) => {
    if (!isDraggingCanvas) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    canvasOffset = { x: offsetStart.x + dx, y: offsetStart.y + dy };
    updateCanvasTransform();
  });
  document.addEventListener('mouseup', () => {
    isDraggingCanvas = false;
  });
})();
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
  const w = project.canvas.baseWidth;
  const h = project.canvas.baseHeight;
  // Create offscreen canvas at base resolution
  const exportCanvas = document.createElement('canvas');
  exportCanvas.width = w;
  exportCanvas.height = h;
  const exportCtx = exportCanvas.getContext('2d');
  exportCtx.imageSmoothingEnabled = false;
  // Clear and fill background color
  exportCtx.clearRect(0, 0, w, h);
  if (project.canvas.backgroundColor) {
    exportCtx.fillStyle = project.canvas.backgroundColor;
    exportCtx.fillRect(0, 0, w, h);
  }
  // Draw background image if present
  if (backgroundImg && backgroundVisible) {
    exportCtx.globalAlpha = backgroundOpacity;
    exportCtx.drawImage(backgroundImg, 0, 0, w, h);
    exportCtx.globalAlpha = 1;
  }
  // Draw pixel layers without pan/zoom
  // Draw with hex-only palette
  drawProject(exportCtx, project, project.palette.map(e => e.hex));
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
  const wPx = project.canvas.baseWidth;
  const hPx = project.canvas.baseHeight;
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
        // Build frames by capturing the rendered canvas (with hex-only palette)
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

// STL Export functionality
function generateSTLGeometry(project) {
  const triangles = [];
  const { layerHeight, pixelSize } = STL_SETTINGS;

  console.log('STL_SETTINGS:', STL_SETTINGS);
  console.log('Processing', project.layers.length, 'layers');

  // Determine overall project dimensions for the height map
  const baseWidth = project.canvas.baseWidth;
  const baseHeight = project.canvas.baseHeight;

  // Step 1: Create a combined height map
  const { heightMap, fineWidth, fineHeight, minScale } = generateHeightMap(project, baseWidth, baseHeight, pixelSize);

  // Step 2: Generate mesh from the height map
  const finePixelSize = pixelSize * minScale;
  const generatedTriangles = generateMeshFromHeightMap(heightMap, layerHeight, finePixelSize, fineWidth, fineHeight);
  triangles.push(...generatedTriangles);

  return triangles;
}

// New function to generate the height map
function generateHeightMap(project, baseWidth, baseHeight, pixelSize) {
  // Find the minimum scale to determine the finest resolution needed
  let minScale = 1.0;
  project.layers.forEach(layer => {
    if (layer.visible && layer.resolution && layer.resolution.scale) {
      minScale = Math.min(minScale, layer.resolution.scale);
    }
  });

  // Calculate the dimensions of the height map at the finest resolution
  const fineWidth = Math.ceil(baseWidth / minScale);
  const fineHeight = Math.ceil(baseHeight / minScale);
  
  // Initialize height map with -1 (no pixel)
  const heightMap = Array(fineHeight).fill(0).map(() => Array(fineWidth).fill(-1));

  console.log(`Height map dimensions: ${fineWidth}x${fineHeight} (minScale: ${minScale})`);

  // Process layers in reverse order so layer0 is at bottom, layer1 at top
  const visibleLayers = project.layers.filter(layer => 
    layer.visible && layer.pixels && layer.pixels.data && layer.resolution && layer.resolution.pixelArraySize
  );
  
  visibleLayers.forEach((layer, visibleIndex) => {
    const { resolution, placement, pixels } = layer;
    const { pixelArraySize, scale } = resolution;
    const { width, height } = pixelArraySize;
    const { data } = pixels;

    const layerScale = scale || 1.0;
    console.log(`Processing layer ${visibleIndex}: ${width}x${height}, scale: ${layerScale}`);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const pixelIndex = y * width + x;
        const pixelValue = data[pixelIndex];

        if (pixelValue === null || pixelValue === 0) continue; // Skip transparent pixels

        // Calculate how many fine grid cells this pixel covers
        const cellsPerPixel = layerScale / minScale;
        
        // Calculate the position in the fine grid
        const placementX = (placement?.x || 0) / minScale;
        const placementY = (placement?.y || 0) / minScale;
        
        const fineXStart = Math.floor(placementX + (x * cellsPerPixel));
        const fineYStart = Math.floor(placementY + (y * cellsPerPixel));
        const fineXEnd = Math.ceil(fineXStart + cellsPerPixel);  // Changed to ceil for complete coverage
        const fineYEnd = Math.ceil(fineYStart + cellsPerPixel);  // Changed to ceil for complete coverage

        // Update all fine grid cells covered by this layer's pixel
        for (let fy = fineYStart; fy < fineYEnd; fy++) {
          for (let fx = fineXStart; fx < fineXEnd; fx++) {
            if (fx >= 0 && fx < fineWidth && fy >= 0 && fy < fineHeight) {
              heightMap[fy][fx] = Math.max(heightMap[fy][fx], visibleIndex);
            }
          }
        }
      }
    }
  });
  
  return { heightMap, fineWidth, fineHeight, minScale };
}

// New function to generate mesh from height map
function generateMeshFromHeightMap(heightMap, layerHeight, pixelSize, baseWidth, baseHeight) {
  const triangles = [];

  // Helper to add a quad (two triangles)
  const addQuad = (v0, v1, v2, v3, normal) => {
    triangles.push({ normal: normal, vertices: [v0, v1, v2] });
    triangles.push({ normal: normal, vertices: [v0, v2, v3] });
  };

  // Generate solid blocks for each layer
  const maxLayer = Math.max(...heightMap.flat().filter(h => h >= 0));
  
  for (let layer = 0; layer <= maxLayer; layer++) {
    const zBottom = layer * layerHeight;
    const zTop = zBottom + layerHeight;
    
    // Generate top and bottom faces for the entire layer
    for (let y = 0; y < baseHeight; y++) {
      for (let x = 0; x < baseWidth; x++) {
        if (heightMap[y][x] >= layer) {
          const xMin = x * pixelSize;
          const yMin = (baseHeight - 1 - y) * pixelSize; // Y軸反転
          const xMax = (x + 1) * pixelSize;
          const yMax = (baseHeight - y) * pixelSize; // Y軸反転

          // Top face (only if this is the highest layer for this position)
          if (heightMap[y][x] === layer) {
            const v_top = [
              [xMin, yMin, zTop], // front-left
              [xMax, yMin, zTop], // front-right
              [xMax, yMax, zTop], // back-right
              [xMin, yMax, zTop]  // back-left
            ];
            addQuad(v_top[0], v_top[1], v_top[2], v_top[3], [0, 0, 1]);
          }

          // Bottom face (only if this is the bottom layer or there's no pixel below)
          if (layer === 0) {
            const v_bottom = [
              [xMin, yMin, zBottom], // front-left
              [xMax, yMin, zBottom], // front-right
              [xMax, yMax, zBottom], // back-right
              [xMin, yMax, zBottom]  // back-left
            ];
            addQuad(v_bottom[0], v_bottom[3], v_bottom[2], v_bottom[1], [0, 0, -1]);
          }
        }
      }
    }

    // Generate side faces for the layer
    for (let y = 0; y < baseHeight; y++) {
      for (let x = 0; x < baseWidth; x++) {
        if (heightMap[y][x] >= layer) {
          const xMin = x * pixelSize;
          const yMin = (baseHeight - 1 - y) * pixelSize; // Y軸反転
          const xMax = (x + 1) * pixelSize;
          const yMax = (baseHeight - y) * pixelSize; // Y軸反転

          // Right side (x+1) - only generate face if neighbor is not at same or higher layer
          const rightHeight = (x + 1 < baseWidth) ? heightMap[y][x + 1] : -1;
          if (rightHeight < layer) {
            const v_right = [
              [xMax, yMin, zBottom], // bottom-front
              [xMax, yMax, zBottom], // bottom-back
              [xMax, yMax, zTop],    // top-back
              [xMax, yMin, zTop]     // top-front
            ];
            addQuad(v_right[0], v_right[1], v_right[2], v_right[3], [1, 0, 0]);
          }

          // Left side (x-1)
          const leftHeight = (x - 1 >= 0) ? heightMap[y][x - 1] : -1;
          if (leftHeight < layer) {
            const v_left = [
              [xMin, yMin, zBottom], // bottom-front
              [xMin, yMax, zBottom], // bottom-back
              [xMin, yMax, zTop],    // top-back
              [xMin, yMin, zTop]     // top-front
            ];
            addQuad(v_left[0], v_left[3], v_left[2], v_left[1], [-1, 0, 0]);
          }

          // Front side (y-1)
          const frontHeight = (y - 1 >= 0) ? heightMap[y - 1][x] : -1;
          if (frontHeight < layer) {
            const v_front = [
              [xMin, yMin, zBottom], // bottom-left
              [xMax, yMin, zBottom], // bottom-right
              [xMax, yMin, zTop],    // top-right
              [xMin, yMin, zTop]     // top-left
            ];
            addQuad(v_front[0], v_front[1], v_front[2], v_front[3], [0, -1, 0]);
          }

          // Back side (y+1)
          const backHeight = (y + 1 < baseHeight) ? heightMap[y + 1][x] : -1;
          if (backHeight < layer) {
            const v_back = [
              [xMin, yMax, zBottom], // bottom-left
              [xMax, yMax, zBottom], // bottom-right
              [xMax, yMax, zTop],    // top-right
              [xMin, yMax, zTop]     // top-left
            ];
            addQuad(v_back[0], v_back[3], v_back[2], v_back[1], [0, 1, 0]);
          }
        }
      }
    }
  }

  return triangles;
}

function calculateNormal(v1, v2, v3) {
  // Calculate two edge vectors
  const edge1 = [v2[0] - v1[0], v2[1] - v1[1], v2[2] - v1[2]];
  const edge2 = [v3[0] - v1[0], v3[1] - v1[1], v3[2] - v1[2]];
  
  // Cross product to get normal
  const normal = [
    edge1[1] * edge2[2] - edge1[2] * edge2[1],
    edge1[2] * edge2[0] - edge1[0] * edge2[2],
    edge1[0] * edge2[1] - edge1[1] * edge2[0]
  ];
  
  // Normalize
  const length = Math.sqrt(normal[0] * normal[0] + normal[1] * normal[1] + normal[2] * normal[2]);
  if (length > 0) {
    normal[0] /= length;
    normal[1] /= length;
    normal[2] /= length;
  }
  
  return normal;
}

function generateSTLBinary(triangles) {
  // STL Binary format:
  // - 80 byte header
  // - 4 byte triangle count (little-endian)
  // - For each triangle:
  //   - 12 bytes: normal vector (3 floats)
  //   - 36 bytes: 3 vertices (9 floats)
  //   - 2 bytes: attribute byte count (usually 0)
  
  const triangleCount = triangles.length;
  const headerSize = 80;
  const countSize = 4;
  const triangleSize = 50; // 12 + 36 + 2 bytes per triangle
  const totalSize = headerSize + countSize + (triangleCount * triangleSize);
  
  const buffer = new ArrayBuffer(totalSize);
  const view = new DataView(buffer);
  let offset = 0;
  
  // Write 80-byte header (filled with zeros)
  const header = `STL generated by MRPAF Editor - ${triangleCount} triangles`;
  const headerBytes = new TextEncoder().encode(header);
  for (let i = 0; i < Math.min(headerBytes.length, 80); i++) {
    view.setUint8(offset + i, headerBytes[i]);
  }
  offset += 80;
  
  // Write triangle count (little-endian 32-bit integer)
  view.setUint32(offset, triangleCount, true);
  offset += 4;
  
  // Write triangles
  triangles.forEach(triangle => {
    // Write normal vector (3 x 32-bit float, little-endian)
    view.setFloat32(offset, triangle.normal[0], true);
    view.setFloat32(offset + 4, triangle.normal[1], true);
    view.setFloat32(offset + 8, triangle.normal[2], true);
    offset += 12;
    
    // Write vertices (3 vertices x 3 coordinates x 32-bit float)
    triangle.vertices.forEach(vertex => {
      view.setFloat32(offset, vertex[0], true);
      view.setFloat32(offset + 4, vertex[1], true);
      view.setFloat32(offset + 8, vertex[2], true);
      offset += 12;
    });
    
    // Write attribute byte count (16-bit integer, usually 0)
    view.setUint16(offset, 0, true);
    offset += 2;
  });
  
  return buffer;
}

function exportSTL() {
  try {
    console.log('STL Export started');
    console.log('Project:', project);
    console.log('Project layers:', project.layers);
    
    // Generate 3D geometry from current project
    const triangles = generateSTLGeometry(project);
    console.log('Generated triangles:', triangles.length);
    
    if (triangles.length === 0) {
      alert('No visible pixels found to export. Please ensure you have drawn something on visible layers.');
      return;
    }
    
    // Generate binary STL data
    const stlBuffer = generateSTLBinary(triangles);
    
    // Create and download file
    const blob = new Blob([stlBuffer], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.metadata.title || 'pixel-art'}.stl`;
    a.click();
    URL.revokeObjectURL(url);
    
    console.log(`STL exported: ${triangles.length} triangles`);
  } catch (error) {
    console.error('STL export failed:', error);
    alert('STL export failed: ' + error.message);
  }
}

// STL Export button event listener
document.getElementById('export-stl').addEventListener('click', () => {
  console.log('STL Export button clicked');
  exportSTL();
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
        // Minimal MRPAF JSON validation
        if (!imported || imported.format !== 'MRPAF' || !imported.version || !imported.$schema) {
          alert('Invalid MRPAF JSON: missing format/version/schema');
          return;
        }
        if (!imported.canvas || typeof imported.canvas.baseWidth !== 'number' || typeof imported.canvas.baseHeight !== 'number') {
          alert('Invalid MRPAF JSON: missing canvas settings');
          return;
        }
        if (!Array.isArray(imported.layers)) {
          alert('Invalid MRPAF JSON: missing layers');
          return;
        }
        project = imported;
        syncLayerGridToggles();
        // Refresh metadata and settings panels
        if (typeof updateMetadataPanel === 'function') updateMetadataPanel();
        if (typeof updateCanvasSettingsPanel === 'function') updateCanvasSettingsPanel();
        if (typeof updateCoordSettingsPanel === 'function') updateCoordSettingsPanel();
        if (typeof updateColorSpacePanel === 'function') updateColorSpacePanel();
        if (typeof updateCompressionProfilePanel === 'function') updateCompressionProfilePanel();
        // Derive color spaces for imported entries
        project.palette.forEach(entry => {
          if (entry.hex) updateColorSpaces(entry);
        });
        // Restore project state
        width = project.canvas.baseWidth;
        height = project.canvas.baseHeight;
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
      // Initialize background scale and offset (no auto-fit)
      backgroundScale = 1;
      backgroundOffset.x = 0;
      backgroundOffset.y = 0;
      // Update UI inputs
      const bgScaleInput = document.getElementById('background-scale');
      const bgOffsetXInput = document.getElementById('background-offset-x');
      const bgOffsetYInput = document.getElementById('background-offset-y');
      if (bgScaleInput) bgScaleInput.value = backgroundScale;
      if (bgOffsetXInput) bgOffsetXInput.value = backgroundOffset.x;
      if (bgOffsetYInput) bgOffsetYInput.value = backgroundOffset.y;
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
    width = project.canvas.baseWidth;
    height = project.canvas.baseHeight;
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
    width = project.canvas.baseWidth;
    height = project.canvas.baseHeight;
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
    // Refresh metadata and settings panels
    if (typeof updateMetadataPanel === 'function') updateMetadataPanel();
    if (typeof updateCanvasSettingsPanel === 'function') updateCanvasSettingsPanel();
    if (typeof updateCoordSettingsPanel === 'function') updateCoordSettingsPanel();
    if (typeof updateColorSpacePanel === 'function') updateColorSpacePanel();
    if (typeof updateCompressionProfilePanel === 'function') updateCompressionProfilePanel();
    width = project.canvas.baseWidth;
    height = project.canvas.baseHeight;
    palette = project.palette;
    renderPalette();
    renderLayers();
    renderCanvas();
  } catch (err) {
    alert('Error loading project: ' + err);
  }
});


// Drawing (pen/eraser) and pan event handlers
let isDrawing = false;
canvas.addEventListener('mousedown', (e) => {
  const rect = canvas.getBoundingClientRect();
  // Adjust for CSS scaling of canvas element
  const x = (e.clientX - rect.left) / containerScale;
  const y = (e.clientY - rect.top)  / containerScale;
  if ((tool === 'pen' || tool === 'eraser') && e.button === 0) {
    // Start drawing
    isDrawing = true;
    pushHistory();
    handleBrush(x, y);
  } else if (tool === 'pan' && e.button === 0) {
    isPanning = true;
    panStart = { x: e.clientX, y: e.clientY };
    panOffsetStart = { x: panX, y: panY };
  }
});
canvas.addEventListener('mousemove', (e) => {
  // Update hover cursor
  updateCursor(e);
  const rect = canvas.getBoundingClientRect();
  const x = (e.clientX - rect.left) / containerScale;
  const y = (e.clientY - rect.top)  / containerScale;
  if (isDrawing) {
    handleBrush(x, y);
  } else if (isPanning) {
    panX = panOffsetStart.x + (e.clientX - panStart.x);
    panY = panOffsetStart.y + (e.clientY - panStart.y);
    renderCanvas();
  }
});
canvas.addEventListener('mouseup', () => {
  if (isDrawing) isDrawing = false;
  if (isPanning) isPanning = false;
});
// Handle canvas clicks
canvas.addEventListener('click', (e) => {
  // Skip click drawing for pen/eraser as handled by drag
  if (tool === 'pen' || tool === 'eraser') return;
  // Convert screen click to layer pixel coordinates (pan/zoom + resolution scale)
  const rect = canvas.getBoundingClientRect();
  const canvasX = (e.clientX - rect.left) / containerScale;
  const canvasY = (e.clientY - rect.top)  / containerScale;
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
    // Flood fill on current layer (color or erase) with symmetry support
    pushHistory();
    const layer = project.layers[currentLayerIndex];
    if (layer.pixels && layer.pixels.data) {
      const data = layer.pixels.data;
      const w = layerW, h = layerH;
      // Determine fill value: 0 for erase, else selected color index+1
      const replacement = lastMode === 'eraser' ? 0 : (currentColorIndex + 1);
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
    // Draw or erase line on current layer between two clicks
    if (lineStart == null) {
      lineStart = { x: layerX, y: layerY };
    } else {
      pushHistory();
      // Draw primary line
      const w = layerW, h = layerH;
      const x0 = lineStart.x, y0 = lineStart.y;
      const x1 = layerX, y1 = layerY;
      // Determine eraser or pen mode
      const prevColorIdx = currentColorIndex;
      if (lastMode === 'eraser') currentColorIndex = -1;
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
      // Restore color index
      currentColorIndex = prevColorIdx;
      lineStart = null;
    }
  }
  renderCanvas();
});

// 初回キャンバス描画
renderCanvas();
// Initialize tool button UI state
updateToolUI();

// Initialize right sidebar tab switching
function initRightSidebarTabs() {
  if (initRightSidebarTabs._inited) return;
  initRightSidebarTabs._inited = true;
  const tabsEl = document.querySelector('#right-tabs');
  const panels = document.querySelectorAll('#right-panels .tab-panel');
  if (!tabsEl || panels.length === 0) {
    console.warn('Sidebar tabs init: no tabs or panels found');
    return;
  }
  const tabs = tabsEl.querySelectorAll('[data-tab]');
  console.log('Sidebar tabs count:', tabs.length, 'panels:', panels.length);
  tabsEl.addEventListener('click', e => {
    const btn = e.target.closest('[data-tab]');
    if (!btn || !tabsEl.contains(btn)) return;
    const sel = btn.dataset.tab;
    tabs.forEach(b => b.classList.toggle('active', b === btn));
    panels.forEach(p => {
      p.style.display = (p.dataset.tab === sel ? 'block' : 'none');
    });
  });
}

// Initialize right sidebar tabs immediately
initRightSidebarTabs();
// Also ensure binding after load in case script timing differs
window.addEventListener('DOMContentLoaded', initRightSidebarTabs);
window.addEventListener('load', initRightSidebarTabs);

// Panel Resizer Setup
(function() {
  const left = document.getElementById('left-panel');
  const right = document.getElementById('right-panel');
  const bottom = document.getElementById('bottom-toolbar');
  const resizers = document.querySelectorAll('.resizer');
  let startX, startY, startLeftWidth, startRightWidth, startBottomHeight;
  function initResize(e) {
    e.preventDefault();
    const type = e.target.dataset.resizer;
    startX = e.clientX;
    startY = e.clientY;
    if (type === 'left') {
      startLeftWidth = left.getBoundingClientRect().width;
    } else if (type === 'right') {
      startRightWidth = right.getBoundingClientRect().width;
    } else if (type === 'bottom') {
      startBottomHeight = bottom.getBoundingClientRect().height;
    }
    function onMouseMove(evt) {
      if (type === 'left') {
        const dx = evt.clientX - startX;
        left.style.width = (startLeftWidth + dx) + 'px';
      } else if (type === 'right') {
        const dx = startX - evt.clientX;
        right.style.width = (startRightWidth + dx) + 'px';
      } else if (type === 'bottom') {
        const dy = startY - evt.clientY;
        bottom.style.height = (startBottomHeight + dy) + 'px';
      }
    }
    function onMouseUp() {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    }
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }
  resizers.forEach(resizer => resizer.addEventListener('mousedown', initResize));
})();
// Handle browser Back navigation with confirmation
// Push dummy state to intercept back button
history.pushState(null, document.title, location.href);
window.addEventListener('popstate', () => {
  const msg = 'Do you really want to leave this page? Unsaved changes will be lost.';
  if (!confirm(msg)) {
    // Cancel back navigation by re-pushing state
    history.pushState(null, document.title, location.href);
  }
});
// Handle F5 / Ctrl+R refresh with confirmation
window.addEventListener('keydown', (e) => {
  const key = e.key;
  if (key === 'F5' || (e.ctrlKey && (key === 'r' || key === 'R'))) {
    e.preventDefault();
    const msg = 'Do you want to reload the page? Unsaved changes will be lost.';
    if (confirm(msg)) {
      location.reload();
    }
  }
});