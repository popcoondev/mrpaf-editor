// MRPAF core module: create and manage MRPAF project data
export function createEmptyProject(width = 16, height = 16) {
  return {
    version: "2.0.1",
    metadata: {},
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
        pixels: {
          format: "Array",
          width,
          height,
          data: new Array(width * height).fill(0)
        }
      }
    ],
    editorSettings: []
  };
}