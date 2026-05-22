import React, { useCallback, useEffect } from 'react';

import { hexToRgb, hsvToRgb, rgbToHex, rgbToHsv } from '@utils/colorConversions';

/**
 * Manages a hue-saturation-value color picker rendered on a canvas element.
 *
 * @param {React.RefObject<HTMLCanvasElement | null>} canvasRef - Canvas element ref
 * @param {string} currentColor - Current hex color value
 * @returns {{ drawCanvas: () => void, handleCanvasClick: (e: React.MouseEvent | React.TouchEvent, onColorSelect: (hex: string) => void) => void }}
 */
export function useCanvasPicker(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  currentColor: string
) {
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    const width = canvas.width;
    const height = canvas.height;
    const rgb = hexToRgb(currentColor);
    if (!rgb) return;
    const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
    const hueRgb = hsvToRgb(hsv.h, 1, 1);
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
    (e: React.MouseEvent | React.TouchEvent, onColorSelect: (hex: string) => void) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      let clientX, clientY;
      if ('touches' in e) {
        clientX = e.touches[0]?.clientX ?? 0;
        clientY = e.touches[0]?.clientY ?? 0;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }

      const x = (clientX - rect.left) * scaleX;
      const y = (clientY - rect.top) * scaleY;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;
      const imageData = ctx.getImageData(x, y, 1, 1).data;
      const r = imageData[0] ?? 0;
      const g = imageData[1] ?? 0;
      const b = imageData[2] ?? 0;
      const hex = rgbToHex(r, g, b);
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
