#!/usr/bin/env node
import assert from 'assert';
import { createEmptyProject } from './packages/core/index.js';
import { drawProject } from './packages/renderer/index.js';

async function runCoreTests() {
  console.log('Running core tests...');
  const width = 10;
  const height = 20;
  const project = createEmptyProject(width, height);
  assert.strictEqual(project.format, 'MRPAF', 'format should be MRPAF');
  assert.strictEqual(project.version, '2.0.1', 'version should be 2.0.1');
  assert.strictEqual(project.canvas.width, width, 'canvas.width mismatch');
  assert.strictEqual(project.canvas.height, height, 'canvas.height mismatch');
  const layer = project.layers[0];
  assert.ok(Array.isArray(layer.pixels.data), 'layer.pixels.data should be an array');
  assert.strictEqual(layer.pixels.data.length, width * height, 'pixel data length mismatch');
  project.palette.forEach(entry => {
    assert.ok('id' in entry, 'palette entry missing id');
    assert.ok('hex' in entry, 'palette entry missing hex');
  });
  console.log('Core tests passed.');
}

async function runRendererTests() {
  console.log('Running renderer tests...');
  // Create empty project, expect no draw calls
  const emptyProj = createEmptyProject(4, 4);
  let calls = [];
  let ctx = {
    canvas: { width: 40, height: 40 },
    globalAlpha: 1,
    fillStyle: '',
    fillRect(x, y, w, h) { calls.push({ x, y, w, h, color: this.fillStyle }); }
  };
  drawProject(ctx, emptyProj, emptyProj.palette.map(e => e.hex));
  assert.strictEqual(calls.length, 0, 'Expected no draw calls for empty project');

  // Test single pixel draw
  const proj = createEmptyProject(4, 4);
  proj.layers[0].pixels.data[0] = 1;
  calls = [];
  ctx = {
    canvas: { width: 40, height: 40 },
    globalAlpha: 1,
    fillStyle: '',
    fillRect(x, y, w, h) { calls.push({ x, y, w, h, color: this.fillStyle }); }
  };
  drawProject(ctx, proj, proj.palette.map(e => e.hex));
  assert.strictEqual(calls.length, 1, 'Expected one draw call for single pixel');
  const call = calls[0];
  const pixelSize = 10; // floor(40/4)
  assert.deepStrictEqual(call, { x: 0, y: 0, w: pixelSize, h: pixelSize, color: proj.palette[0].hex });
  console.log('Renderer tests passed.');
}

async function main() {
  try {
    await runCoreTests();
    await runRendererTests();
    console.log('All tests passed.');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

main();