import { describe, it, expect } from 'vitest';
import { createEmptyProject } from './index.js';

describe('createEmptyProject animations', () => {
  it('includes default animations settings', () => {
    const project = createEmptyProject();
    expect(project).toHaveProperty('animations');
    const anim = project.animations;
    expect(anim.fps).toBe(24);
    expect(anim.loops).toBe(true);
    expect(anim.pingPong).toBe(false);
    expect(anim.interpolation).toBe('none');
  });
  it('initializes default frames array', () => {
    const project = createEmptyProject();
    expect(Array.isArray(project.frames)).toBe(true);
    expect(project.frames.length).toBe(1);
    const frame = project.frames[0];
    expect(frame).toHaveProperty('duration', 1 / project.animations.fps);
    expect(Array.isArray(frame.layers)).toBe(true);
    expect(frame.layers).toEqual(project.layers);
    expect(frame).toHaveProperty('backgroundImageData', null);
  });
  it('sets up default animationController', () => {
    const project = createEmptyProject();
    expect(project).toHaveProperty('animationController');
    const ac = project.animationController;
    expect(ac.defaultAnimation).toBe(0);
    expect(Array.isArray(ac.transitions)).toBe(true);
    expect(ac.transitions.length).toBe(0);
    expect(Array.isArray(ac.tagGroups)).toBe(true);
    expect(ac.tagGroups.length).toBe(0);
  });
});