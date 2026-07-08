export {};

interface WorkerScope {
  onmessage: ((ev: MessageEvent) => unknown) | null;
  postMessage(message: unknown): void;
}

const workerContext = self as unknown as WorkerScope;

workerContext.onmessage = async (event: MessageEvent) => {
  const data = event.data || {};
  if (data.type !== 'start') return;

  const taskId: number = data.taskId;
  const { svgString, width, height, format, quality } = data.payload;

  const postProgress = (progress: number, label: string) => {
    workerContext.postMessage({
      type: 'progress',
      taskId,
      payload: { progress, label }
    });
  };

  let bitmap: ImageBitmap | null = null;
  let canvas: OffscreenCanvas | null = null;

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
    bitmap = await createImageBitmap(svgBlob);

    postProgress(45, 'Rendering');
    canvas = new OffscreenCanvas(width, height);
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

    postProgress(80, 'Encoding');
    const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
    const blob = await canvas.convertToBlob({
      type: mimeType,
      quality: format === 'jpeg' ? quality : undefined
    });

    workerContext.postMessage({
      type: 'done',
      taskId,
      payload: { blob }
    });
  } catch (error: unknown) {
    workerContext.postMessage({
      type: 'error',
      taskId,
      payload: {
        message: error instanceof Error ? error.message : String(error)
      }
    });
  } finally {
    bitmap?.close();
    if (canvas) {
      canvas.width = 0;
      canvas.height = 0;
    }
  }
};
