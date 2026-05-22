import { useCallback, useEffect } from 'react';

import { hexToRgb, hsvToRgb, rgbToHex, rgbToHsv } from '@/utils';

/**
 * Manages a hue-saturation-value color picker rendered on a canvas element.
 *
 * @param {React.RefObject<HTMLCanvasElement>} canvasRef - Canvas element ref
 * @param {string} currentColor - Current hex color value
 * @returns {{ onCanvasClick: function, onCanvasMouseMove: function }}
 */
export function useCanvasPicker(canvasRef, currentColor) {
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const width = canvas.width;
    const height = canvas.height;
    const rgb = hexToRgb(currentColor);
    if (!rgb) return;
    const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
    const hueRgb = hsvToRgb(hsv.h, 100, 100);
    const gradientH = ctx.createLinearGradient(0, 0, width, 0);
    gradientH.addColorStop(0, 'white');
    gradientH.addColorStop(1, `rgb(${hueRgb.r}, ${hueRgb.g}, ${hueRgb.b})`);
    ctx.fillStyle = gradientH;
    ctx.fillRect(0, 0, width, height);
    const gradientV = ctx.createLinearGradient(0, 0, 0, height);
    gradientV.addColorStop(0, 'rgba(0, 0, 0, 0)');
    gradientV.addColorStop(1, 'rgba(0, 0, 0, 1)');
    ctx.fillStyle = gradientV;
    ctx.fillRect(0, 0, width, height);
  }, [canvasRef, currentColor]);
  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);
  const handleCanvasClick = useCallback(
    (e, onColorSelect) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      const imageData = ctx.getImageData(x, y, 1, 1).data;
      const hex = rgbToHex(imageData[0], imageData[1], imageData[2]);
      if (onColorSelect) {
        onColorSelect(hex);
      }
    },
    [canvasRef]
  );
  return {
    drawCanvas,
    handleCanvasClick
  };
}
export default useCanvasPicker;
