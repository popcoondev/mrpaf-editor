import { describe, it, expect } from 'vitest';
import { createEmptyProject } from './index.js';

describe('createEmptyProject', () => {
  it('creates a valid MRPAF project with given dimensions', () => {
    const width = 10;
    const height = 20;
    const project = createEmptyProject(width, height);
    // Schema and version
    expect(project.$schema).toBe('https://mrpaf.org/schemas/v2.0.1/mrpaf.schema.json');
    expect(project.format).toBe('MRPAF');
    expect(project.version).toBe('2.0.1');
    // Canvas settings
    expect(project.canvas.width).toBe(width);
    expect(project.canvas.height).toBe(height);
    expect(project.canvas.baseWidth).toBe(width);
    expect(project.canvas.baseHeight).toBe(height);
    // Layers
    expect(Array.isArray(project.layers)).toBe(true);
    expect(project.layers.length).toBeGreaterThan(0);
    const layer = project.layers[0];
    // Pixel data array
    expect(Array.isArray(layer.pixels.data)).toBe(true);
    expect(layer.pixels.data).toHaveLength(width * height);
    expect(layer.pixels.data.every(v => v === null)).toBe(true);
    // Layer hierarchy and properties
    expect(layer.parent).toBeNull();
    expect(layer.blending).toBe('normal');
    expect(layer).toHaveProperty('transform');
    expect(layer.transform).toEqual({ scale: 1.0, rotation: 0 });
    // Resolution effectiveSize
    expect(layer.resolution).toHaveProperty('effectiveSize');
    // Placement defaults
    expect(layer.placement).toHaveProperty('anchor', 'top-left');
    expect(layer.placement).toHaveProperty('allowSubPixel', false);
    expect(layer.resolution.effectiveSize).toEqual({ width: width * layer.resolution.scale, height: height * layer.resolution.scale });
    // Palette defaults
    expect(Array.isArray(project.palette)).toBe(true);
    expect(project.palette.length).toBe(4);
    project.palette.forEach(entry => {
      expect(entry).toHaveProperty('id');
      expect(entry).toHaveProperty('name');
      expect(entry).toHaveProperty('hex');
      expect(entry).toHaveProperty('locked');
      // Auto-derived color space fields
      expect(Array.isArray(entry.rgb)).toBe(true);
      expect(entry.rgb).toHaveLength(4);
      expect(Array.isArray(entry.hsv)).toBe(true);
      expect(entry.hsv).toHaveLength(4);
      expect(Array.isArray(entry.lab)).toBe(true);
      expect(entry.lab).toHaveLength(4);
    });
    // Metadata timestamps
    expect(new Date(project.metadata.created).toString()).not.toBe('Invalid Date');
    expect(new Date(project.metadata.modified).toString()).not.toBe('Invalid Date');
  });
});