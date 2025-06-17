// MRPAF renderer module: draw project data onto HTML canvas
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
  project.layers.forEach(layer => {
    // Image layer support
    if (layer.type === 'image' && layer.visible && layer.source && layer.source.uri) {
      let img = layer.image;
      if (!img) {
        img = new Image();
        img.onload = () => {
          if (typeof window !== 'undefined' && typeof window.renderCanvas === 'function') {
            window.renderCanvas();
          } else {
            drawProject(ctx, project, palette);
          }
        };
        img.src = layer.source.uri;
        layer.image = img;
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
    for (let yy = 0; yy < height; yy++) {
      for (let xx = 0; xx < width; xx++) {
        const idx = yy * width + xx;
        const val = data[idx];
        if (val > 0) {
          const color = palette[val - 1] || '#000';
          ctx.fillStyle = color;
          ctx.fillRect(xx * pixelSize, yy * pixelSize, pixelSize, pixelSize);
        }
      }
    }
    ctx.globalAlpha = 1;
  });
}