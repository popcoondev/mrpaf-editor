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
    coordinateSystem: { xOffset: 0, yOffset: 0 },
    canvas: { width, height },
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