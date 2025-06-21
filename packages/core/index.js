// MRPAF core module: create and manage MRPAF project data
/**
 * Convert hex string to RGBA components [0-255].
 * @param {string} hex - Hex color string (#RRGGBB or #RRGGBBAA).
 * @returns {{r:number,g:number,b:number,a:number}}
 */
export function hexToRgba(hex) {
  let h = hex.replace(/^#/, '');
  let r=0,g=0,b=0,a=255;
  if (h.length === 8) {
    r = parseInt(h.slice(0,2),16);
    g = parseInt(h.slice(2,4),16);
    b = parseInt(h.slice(4,6),16);
    a = parseInt(h.slice(6,8),16);
  } else if (h.length === 6) {
    r = parseInt(h.slice(0,2),16);
    g = parseInt(h.slice(2,4),16);
    b = parseInt(h.slice(4,6),16);
    a = 255;
  }
  return { r, g, b, a };
}
/**
 * Convert RGB to HSV [h (0-360), s (0-1), v (0-1)].
 * @param {number} r
 * @param {number} g
 * @param {number} b
 * @returns {[number, number, number]}
 */
export function rgbToHsv(r, g, b) {
  const _r = r/255, _g = g/255, _b = b/255;
  const max = Math.max(_r, _g, _b), min = Math.min(_r, _g, _b);
  const d = max - min;
  let h = 0;
  if (d) {
    if (max === _r) h = ((_g - _b) / d) % 6;
    else if (max === _g) h = ((_b - _r) / d) + 2;
    else h = ((_r - _g) / d) + 4;
    h = Math.round(h * 60);
    if (h < 0) h += 360;
  }
  const s = max ? d / max : 0;
  const v = max;
  return [h, s, v];
}
/**
 * Convert RGB to CIE XYZ (D65).
 * @param {number} r
 * @param {number} g
 * @param {number} b
 * @returns {[number, number, number]}
 */
export function rgbToXyz(r, g, b) {
  const toLin = c => c > 0.04045 ? Math.pow((c + 0.055)/1.055, 2.4) : c/12.92;
  const _r = toLin(r/255), _g = toLin(g/255), _b = toLin(b/255);
  const x = _r*0.4124 + _g*0.3576 + _b*0.1805;
  const y = _r*0.2126 + _g*0.7152 + _b*0.0722;
  const z = _r*0.0193 + _g*0.1192 + _b*0.9505;
  return [x, y, z];
}
/**
 * Convert CIE XYZ to CIE Lab.
 * @param {number} x
 * @param {number} y
 * @param {number} z
 * @returns {[number, number, number]}
 */
export function xyzToLab(x, y, z) {
  const refX = 0.95047, refY = 1.00000, refZ = 1.08883;
  const f = t => t > 0.008856 ? Math.cbrt(t) : (7.787 * t + 16/116);
  const fx = f(x / refX), fy = f(y / refY), fz = f(z / refZ);
  const L = 116 * fy - 16;
  const a = 500 * (fx - fy);
  const b = 200 * (fy - fz);
  return [L, a, b];
}
/**
 * Update a palette entry object with derived rgb, hsv, lab arrays.
 * @param {{ hex: string, rgb?: number[], hsv?: number[], lab?: number[] }} entry
 */
export function updateColorSpaces(entry) {
  const { r, g, b, a } = hexToRgba(entry.hex);
  entry.rgb = [r, g, b, a];
  const [h, s, v] = rgbToHsv(r, g, b);
  entry.hsv = [h, s, v, a];
  const [L, A, B] = xyzToLab(...rgbToXyz(r, g, b));
  entry.lab = [L, A, B, a];
}
/**
 * Create an empty MRPAF project object.
 * @param {number} [width=16]
 * @param {number} [height=16]
 */
export function createEmptyProject(width = 16, height = 16) {
  const now = new Date().toISOString();
  return {
    // JSON Schema reference for MRPAF v2.0.1
    "$schema": "https://mrpaf.org/schemas/v2.0.1/mrpaf.schema.json",
    // Format identifier
    format: "MRPAF",
    // Format version
    version: "2.0.1",
    // Project metadata
    metadata: {
      title: "",
      author: "",
      created: now,
      modified: now,
      description: "",
      tags: [],
      license: "",
      work: { series: "", character: "", scene: "", variation: "" },
      tool: { name: "MRPAF Editor MVP", version: "2.0.1", exporter: "MRPAF Editor MVP" },
      compatibility: { minVersion: "2.0.1", features: [] }
    },
    // Coordinate system configuration
    coordinateSystem: {
      origin: "top-left",
      xAxis: "right",
      yAxis: "down",
      unit: "pixel",
      baseUnit: 1.0,
      subPixelPrecision: 4,
      allowFloatingPoint: false
    },
    // Canvas settings (legacy and new)
    canvas: {
      // Legacy resolution fields for compatibility
      width: width,
      height: height,
      // Base resolution fields
      baseWidth: width,
      baseHeight: height,
      // Physical display settings
      pixelUnit: 1.0,
      pixelAspectRatio: 1.0,
      // Background color (hex RGB). Default to white.
      backgroundColor: "#ffffff"
    },
    // Color space settings
    colorSpace: {
      profile: "sRGB",
      bitDepth: 8,
      gamma: 2.2,
      whitePoint: "D65"
    },
    // Compression profile
    compressionProfile: {
      name: "balanced",
      settings: {
        autoSelect: true,
        quality: 0.95
      }
    },
    // Default palette entries: id, display name, hex color, usage tag, locked flag
    palette: [
      { id: 0, name: 'Color 1', hex: '#000000', usage: '', locked: false },
      { id: 1, name: 'Color 2', hex: '#FF0000', usage: '', locked: false },
      { id: 2, name: 'Color 3', hex: '#00FF00', usage: '', locked: false },
      { id: 3, name: 'Color 4', hex: '#0000FF', usage: '', locked: false }
    ],
    layers: [
      {
        id: "layer-1",
        type: "pixel",
        visible: true,
        locked: false,
        opacity: 1,
        // Multi-resolution support: pixel array size and scale
        resolution: {
          pixelArraySize: { width, height },
          scale: 1.0
        },
        // Placement offset (in base pixels)
        placement: { x: 0, y: 0 },
        pixels: {
          format: "Array",
          width,
          height,
          // null represents transparent/undrawn pixel
          data: new Array(width * height).fill(null)
        }
      }
    ],
    editorSettings: []
  };
}