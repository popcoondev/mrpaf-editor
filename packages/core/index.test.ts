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
    expect(Array.isArray(layer.pixels.data)).toBe(true);
    expect(layer.pixels.data).toHaveLength(width * height);
    expect(layer.pixels.data.every(v => v === null)).toBe(true);
    // Palette defaults
    expect(Array.isArray(project.palette)).toBe(true);
    expect(project.palette.length).toBe(4);
    project.palette.forEach(entry => {
      expect(entry).toHaveProperty('id');
      expect(entry).toHaveProperty('name');
      expect(entry).toHaveProperty('hex');
      expect(entry).toHaveProperty('locked');
    });
    // Metadata timestamps
    expect(new Date(project.metadata.created).toString()).not.toBe('Invalid Date');
    expect(new Date(project.metadata.modified).toString()).not.toBe('Invalid Date');
  });
});