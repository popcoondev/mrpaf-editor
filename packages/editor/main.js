import { createEmptyProject } from '../core/index.js';
import { drawProject } from '../renderer/index.js';

// Configuration
const width = 16;
const height = 16;
const palette = ['#000000']; // value 1 => #000, only one color for now

// Create a new project
const project = createEmptyProject(width, height);

// Initialize canvas
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// Current tool state
let tool = 'pen';
document.getElementById('pen').addEventListener('click', () => tool = 'pen');
document.getElementById('eraser').addEventListener('click', () => tool = 'eraser');
document.getElementById('clear').addEventListener('click', () => {
  project.layers[0].pixels.data.fill(0);
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

// Determine pixel drawing size
const pixelSize = Math.floor(Math.min(canvas.width / width, canvas.height / height));

// Handle canvas clicks
canvas.addEventListener('click', (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = Math.floor((e.clientX - rect.left) / pixelSize);
  const y = Math.floor((e.clientY - rect.top) / pixelSize);
  const idx = y * width + x;
  if (tool === 'pen') {
    project.layers[0].pixels.data[idx] = 1;
  } else if (tool === 'eraser') {
    project.layers[0].pixels.data[idx] = 0;
  }
  drawProject(ctx, project, palette);
});

// Initial render
drawProject(ctx, project, palette);