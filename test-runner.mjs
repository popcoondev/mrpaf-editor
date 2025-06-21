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

async function runColorTests() {
  console.log('Running color space tests...');
  // Test hexToRgba
  const { hexToRgba, rgbToHsv, rgbToXyz, xyzToLab, updateColorSpaces } = await import('./packages/core/index.js');
  let c = hexToRgba('#11223344');
  assert.strictEqual(c.r, 0x11, 'hexToRgba.r mismatch');
  assert.strictEqual(c.g, 0x22, 'hexToRgba.g mismatch');
  assert.strictEqual(c.b, 0x33, 'hexToRgba.b mismatch');
  assert.strictEqual(c.a, 0x44, 'hexToRgba.a mismatch');
  c = hexToRgba('#AA5500');
  assert.strictEqual(c.r, 0xAA, 'hexToRgba.r mismatch');
  assert.strictEqual(c.g, 0x55, 'hexToRgba.g mismatch');
  assert.strictEqual(c.b, 0x00, 'hexToRgba.b mismatch');
  assert.strictEqual(c.a, 0xFF, 'hexToRgba.a default alpha');
  // Test rgbToHsv
  let [h,s,v] = rgbToHsv(255,0,0);
  assert.strictEqual(h,0,'rgbToHsv red hue');
  assert.ok(Math.abs(s-1) < 1e-6,'rgbToHsv red saturation');
  assert.ok(Math.abs(v-1) < 1e-6,'rgbToHsv red value');
  // Test round-trip XYZ->Lab
  const [x,y,z] = rgbToXyz(128,128,128);
  const [L,A,B] = xyzToLab(x,y,z);
  assert.ok(Array.isArray([L,A,B]), 'xyzToLab output array');
  // Test updateColorSpaces
  const entry = { hex: '#00FF00' };
  updateColorSpaces(entry);
  assert.ok(Array.isArray(entry.rgb) && entry.rgb.length===4,'updateColorSpaces.rgb');
  assert.ok(Array.isArray(entry.hsv) && entry.hsv.length===4,'updateColorSpaces.hsv');
  assert.ok(Array.isArray(entry.lab) && entry.lab.length===4,'updateColorSpaces.lab');
  console.log('Color space tests passed.');
}
/**
 * Run pixel encoding/decoding tests.
 */
async function runEncodingTests() {
  console.log('Running pixel encoding tests...');
  const core = await import('./packages/core/index.js');
  // Raw
  const arr = [1,2,2,3,3,3];
  let rawEnc = core.encodeRaw(arr);
  let rawDec = core.decodeRaw(rawEnc);
  assert.deepStrictEqual(rawDec, arr, 'Raw encode/decode should preserve data');
  // RLE
  const rleEnc = core.encodeRle(arr);
  assert.strictEqual(rleEnc.format, 'rle', 'encodeRle.format');
  const rleDec = core.decodeRle(rleEnc);
  assert.deepStrictEqual(rleDec, arr, 'RLE decode should reconstruct original');
  // Sparse
  const sparseArr = [null, 5, null, 0, null];
  const sparseEnc = core.encodeSparse(sparseArr, null);
  assert.strictEqual(sparseEnc.format, 'sparse', 'encodeSparse.format');
  const sparseDec = core.decodeSparse(sparseEnc, sparseArr.length);
  assert.deepStrictEqual(sparseDec, sparseArr, 'Sparse decode should reconstruct original');
  console.log('Pixel encoding tests passed.');
}
/**
 * Run basic animations configuration tests.
 */
async function runAnimationTests() {
  console.log('Running animations tests...');
  const { createEmptyProject } = await import('./packages/core/index.js');
  const project = createEmptyProject();
  assert.ok(project.animations, 'animations property exists');
  const a = project.animations;
  assert.strictEqual(a.fps, 24, 'default fps');
  assert.strictEqual(a.loops, true, 'default loops');
  assert.strictEqual(a.pingPong, false, 'default pingPong');
  assert.strictEqual(a.interpolation, 'none', 'default interpolation');
  console.log('Animations tests passed.');
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
    await runColorTests();
    await runEncodingTests();
    await runAnimationTests();
    await runRendererTests();
    console.log('All tests passed.');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

main();