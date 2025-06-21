import { describe, it, expect } from 'vitest';
import { createEmptyProject } from './index.js';

describe('createEmptyProject animations', () => {
  it('includes default animations settings', () => {
    const project = createEmptyProject();
    expect(project).toHaveProperty('animations');
    const anim = project.animations;
    expect(anim).toHaveProperty('fps', 24);
    expect(anim).toHaveProperty('loops', true);
    expect(anim).toHaveProperty('pingPong', false);
    expect(anim).toHaveProperty('interpolation', 'none');
  });
});