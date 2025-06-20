// MRPAF renderer module: draw project data onto HTML canvas
export function drawProject(ctx, project, palette = []) {
  // Base canvas resolution
  const width = project.canvas.baseWidth != null ? project.canvas.baseWidth : project.canvas.width;
  const height = project.canvas.baseHeight != null ? project.canvas.baseHeight : project.canvas.height;
  // Determine pixel size to fit canvas
  const pixelSize = Math.floor(Math.min(ctx.canvas.width / width, ctx.canvas.height / height));
  // Preserve any existing globalAlpha (e.g., onion skin)
  const baseAlpha = ctx.globalAlpha != null ? ctx.globalAlpha : 1;
  // Background grid removed; per-layer grid overlay is handled in the editor
  // Draw pixel layers in order, with multi-resolution support
  project.layers.forEach(layer => {
    if (layer.type !== 'pixel' || !layer.visible || !layer.pixels || !layer.pixels.data) return;
    const data = layer.pixels.data;
    // Determine layer resolution and scale (fallback to base resolution)
    const res = layer.resolution || {};
    const layerArray = res.pixelArraySize || { width, height };
    const layerWidth = layerArray.width;
    const layerHeight = layerArray.height;
    const scale = typeof res.scale === 'number' ? res.scale : 1;
    // Placement offsets (in layer units)
    const offset = layer.placement || { x: 0, y: 0 };
    // Combine layer opacity with baseAlpha
    const layerAlpha = (layer.opacity != null ? layer.opacity : 1) * baseAlpha;
    ctx.globalAlpha = layerAlpha;
    // Iterate over layer pixels
    for (let y = 0; y < layerHeight; y++) {
      for (let x = 0; x < layerWidth; x++) {
        const idx = y * layerWidth + x;
        const val = data[idx];
        if (val > 0) {
        // Palette entry may be a string (legacy) or object with .hex
        const entry = palette[val - 1];
        const color = typeof entry === 'string' ? entry : (entry && entry.hex) ? entry.hex : '#000';
          ctx.fillStyle = color;
          // Compute draw position and size in canvas pixels
          const drawX = (offset.x + x * scale) * pixelSize;
          const drawY = (offset.y + y * scale) * pixelSize;
          const drawSize = pixelSize * scale;
          ctx.fillRect(drawX, drawY, drawSize, drawSize);
        }
      }
    }
    // Restore baseAlpha after drawing this layer
    ctx.globalAlpha = baseAlpha;
  });
  // Restore globalAlpha to baseAlpha after all layers
  ctx.globalAlpha = baseAlpha;
}