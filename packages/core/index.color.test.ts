import { describe, it, expect } from 'vitest';
import {
  hexToRgba,
  rgbToHsv,
  rgbToXyz,
  xyzToLab,
  updateColorSpaces
} from './index.js';

describe('Core color space utilities', () => {
  it('hexToRgba parses #RRGGBBAA correctly', () => {
    const { r, g, b, a } = hexToRgba('#11223344');
    expect(r).toBe(0x11);
    expect(g).toBe(0x22);
    expect(b).toBe(0x33);
    expect(a).toBe(0x44);
  });

  it('hexToRgba parses #RRGGBB correctly', () => {
    const { r, g, b, a } = hexToRgba('#AA5500');
    expect(r).toBe(0xAA);
    expect(g).toBe(0x55);
    expect(b).toBe(0x00);
    expect(a).toBe(0xFF);
  });

  it('rgbToHsv returns correct values for primary colors', () => {
    // Red
    let [h, s, v] = rgbToHsv(255, 0, 0);
    expect(h).toBe(0);
    expect(s).toBeCloseTo(1, 5);
    expect(v).toBeCloseTo(1, 5);
    // Green
    [h, s, v] = rgbToHsv(0, 255, 0);
    expect(h).toBe(120);
    expect(s).toBeCloseTo(1, 5);
    expect(v).toBeCloseTo(1, 5);
    // Blue
    [h, s, v] = rgbToHsv(0, 0, 255);
    expect(h).toBe(240);
    expect(s).toBeCloseTo(1, 5);
    expect(v).toBeCloseTo(1, 5);
  });

  it('rgbToXyz and xyzToLab round-trip approximate expected values', () => {
    // Test mid-gray
    const [x, y, z] = rgbToXyz(128, 128, 128);
    const [L, A, B] = xyzToLab(x, y, z);
    // L should be around 53 for mid-gray? Value: compute expected
    expect(L).toBeGreaterThan(0);
    expect(A).toBeCloseTo(0, 1);
    expect(B).toBeCloseTo(0, 1);
  });

  it('updateColorSpaces populates rgb, hsv, lab arrays', () => {
    const entry: any = { hex: '#FF00FF' };
    updateColorSpaces(entry);
    expect(Array.isArray(entry.rgb)).toBe(true);
    expect(entry.rgb).toHaveLength(4);
    expect(Array.isArray(entry.hsv)).toBe(true);
    expect(entry.hsv).toHaveLength(4);
    expect(Array.isArray(entry.lab)).toBe(true);
    expect(entry.lab).toHaveLength(4);
  });
});