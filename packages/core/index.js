// MRPAF core module: create and manage MRPAF project data
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
    // Canvas settings
    canvas: {
      baseWidth: width,
      baseHeight: height,
      pixelUnit: 1.0,
      // Background color (hex RGB)
      // Background color (hex RGB). Default to white for non-obtrusive background.
      backgroundColor: "#ffffff",
      pixelAspectRatio: 1.0
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
    // Default palette: black, red, green, blue
    palette: ['#000000', '#FF0000', '#00FF00', '#0000FF'],
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