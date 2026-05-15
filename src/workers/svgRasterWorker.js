/**
 * Worker that rasterizes SVG markup into PNG/JPEG blobs using OffscreenCanvas.
 */
self.onmessage = async (event) => {
  const data = event.data || {};
  if (data.type !== 'rasterize') return;

  const { jobId, svgString, width, height, format, quality } = data;

  const postProgress = (progress, label) => {
    self.postMessage({
      type: 'progress',
      jobId,
      progress,
      label
    });
  };

  try {
    if (typeof OffscreenCanvas === 'undefined') {
      throw new Error('OffscreenCanvas is not available');
    }
    if (typeof createImageBitmap !== 'function') {
      throw new Error('createImageBitmap is not available in worker');
    }
    if (
      !Number.isFinite(width) ||
      !Number.isFinite(height) ||
      width <= 0 ||
      height <= 0
    ) {
      throw new Error('Invalid raster target dimensions');
    }

    postProgress(10, 'Decoding SVG');
    const svgBlob = new Blob([svgString], {
      type: 'image/svg+xml;charset=utf-8'
    });
    const bitmap = await createImageBitmap(svgBlob);

    postProgress(45, 'Rendering');
    const canvas = new OffscreenCanvas(width, height);
    const useAlpha = format !== 'jpeg';
    const ctx = canvas.getContext('2d', {
      alpha: useAlpha,
      desynchronized: true
    });
    if (!ctx) {
      throw new Error('Failed to create 2D worker canvas context');
    }
    if (!useAlpha) {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);
    }
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(bitmap, 0, 0, width, height);
    if (typeof bitmap.close === 'function') {
      bitmap.close();
    }

    postProgress(80, 'Encoding');
    const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
    const blob = await canvas.convertToBlob({
      type: mimeType,
      quality: format === 'jpeg' ? quality : undefined
    });

    self.postMessage({
      type: 'done',
      jobId,
      blob
    });
  } catch (error) {
    self.postMessage({
      type: 'error',
      jobId,
      error: error instanceof Error ? error.message : String(error)
    });
  }
};
