// MRPAF renderer module: draw project data onto HTML canvas
// Cache loaded images by URI to avoid reloading
const imageCache = new Map();
/**
 * Render the project (image and pixel layers) onto the canvas context.
 */
export function drawProject(ctx, project, palette = []) {
  const width = project.canvas.width;
  const height = project.canvas.height;
  // Determine pixel size to fit canvas
  const pixelSize = Math.floor(Math.min(ctx.canvas.width / width, ctx.canvas.height / height));
  // Clear canvas
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  // Draw grid
  ctx.strokeStyle = '#ccc';
  for (let x = 0; x <= width; x++) {
    ctx.beginPath();
    ctx.moveTo(x * pixelSize, 0);
    ctx.lineTo(x * pixelSize, height * pixelSize);
    ctx.stroke();
  }
  for (let y = 0; y <= height; y++) {
    ctx.beginPath();
    ctx.moveTo(0, y * pixelSize);
    ctx.lineTo(width * pixelSize, y * pixelSize);
    ctx.stroke();
  }
  // Draw layers in order (image first, then pixel layers)
  project.layers.forEach(layer => {
    // Image layer support
    if (layer.type === 'image' && layer.visible && layer.source && layer.source.uri) {
      const uri = layer.source.uri;
      let img = imageCache.get(uri);
      if (!img) {
        img = new Image();
        // Register onload before setting src to catch immediate loads
        img.onload = () => {
          // Re-render once image is loaded
          drawProject(ctx, project, palette);
        };
        img.src = uri;
        imageCache.set(uri, img);
      }
      if (img.complete) {
        ctx.globalAlpha = layer.opacity != null ? layer.opacity : 1;
        ctx.drawImage(img, 0, 0, width * pixelSize, height * pixelSize);
        ctx.globalAlpha = 1;
      }
      return;
    }
    // Pixel layer
    if (layer.type !== 'pixel' || !layer.visible || !layer.pixels || !layer.pixels.data) return;
    const data = layer.pixels.data;
    ctx.globalAlpha = layer.opacity != null ? layer.opacity : 1;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        const val = data[idx];
        if (val > 0) {
          const color = palette[val - 1] || '#000';
          ctx.fillStyle = color;
          ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
        }
      }
    }
    ctx.globalAlpha = 1;
  });
}