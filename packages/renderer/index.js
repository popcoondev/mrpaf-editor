// MRPAF renderer module: draw project data onto HTML canvas
export function drawProject(ctx, project, palette = []) {
  const width = project.canvas.width;
  const height = project.canvas.height;
  // Find first pixel layer
  const pixelLayer = project.layers.find(l => l.type === "pixel");
  if (!pixelLayer || !pixelLayer.pixels || !pixelLayer.pixels.data) return;
  const data = pixelLayer.pixels.data;
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
  // Draw pixels
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const val = data[idx];
      if (val) {
        ctx.fillStyle = palette[val] || '#000';
        ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
      }
    }
  }
}