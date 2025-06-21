import { describe, it, expect } from 'vitest';
import { drawProject } from './index.js';
import { createEmptyProject } from '../core/index.js';

// Helper to create a dummy canvas context
function createDummyContext(canvasWidth: number, canvasHeight: number) {
  const calls: Array<{ x: number; y: number; w: number; h: number; color: string }> = [];
  const ctx: any = {
    canvas: { width: canvasWidth, height: canvasHeight },
    globalAlpha: 1,
    fillStyle: '',
    fillRect(x: number, y: number, w: number, h: number) {
      calls.push({ x, y, w, h, color: this.fillStyle });
    }
  };
  return { ctx, calls };
}

describe('drawProject', () => {
  it('does not draw any pixel when project is empty', () => {
    const project = createEmptyProject(8, 8);
    const { ctx, calls } = createDummyContext(80, 80);
    drawProject(ctx, project, project.palette.map(e => e.hex));
    expect(calls.length).toBe(0);
  });

  it('draws a pixel for non-null data entries', () => {
    const project = createEmptyProject(4, 4);
    // Set a single pixel in first layer to color index 1
    project.layers[0].pixels.data[0] = 1;
    const palette = project.palette.map(e => e.hex);
    const { ctx, calls } = createDummyContext(40, 40);
    drawProject(ctx, project, palette);
    // pixelSize = floor(min(40/4,40/4)) = floor(10) = 10
    expect(calls.length).toBe(1);
    const call = calls[0];
    expect(call).toEqual({ x: 0, y: 0, w: 10, h: 10, color: palette[0] });
  });
});