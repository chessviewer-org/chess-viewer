import React, { memo, useCallback, useEffect, useRef, useState } from 'react';

import { hexToRgb, hsvToRgb, rgbToHex, rgbToHsv } from '@utils';

export interface ColorPickerPanelProps {
  currentLight: string;
  currentDark: string;
  onColorChange: (light: string, dark: string) => void;
}

/**
 * @param {ColorPickerPanelProps} props
 * @returns {JSX.Element}
 */
const ColorPickerPanel = memo(function ColorPickerPanel({
  currentLight,
  currentDark,
  onColorChange
}: ColorPickerPanelProps) {
  const [activeSquare, setActiveSquare] = useState<'light' | 'dark'>('light');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDragging = useRef(false);
  const currentValue = activeSquare === 'light' ? currentLight : currentDark;
  const [tempColor, setTempColor] = useState(currentValue);
  useEffect(() => {
    setTempColor(currentValue);
  }, [currentValue]);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;
    const rgb = hexToRgb(tempColor);
    if (!rgb) return;
    const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
    const hueRgb = hsvToRgb(hsv.h, 1, 1); // hsvToRgb takes 0-1 for s and v
    const gH = ctx.createLinearGradient(0, 0, w, 0);
    gH.addColorStop(0, 'white');
    gH.addColorStop(1, `rgb(${hueRgb.r},${hueRgb.g},${hueRgb.b})`);
    ctx.fillStyle = gH;
    ctx.fillRect(0, 0, w, h);
    const gV = ctx.createLinearGradient(0, 0, 0, h);
    gV.addColorStop(0, 'rgba(0,0,0,0)');
    gV.addColorStop(1, 'rgba(0,0,0,1)');
    ctx.fillStyle = gV;
    ctx.fillRect(0, 0, w, h);
    return () => {
      canvas.width = 0;
      canvas.height = 0;
    };
  }, [tempColor]);
  const pickColorAt = useCallback(
    (clientX: number, clientY: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = Math.max(
        0,
        Math.min(
          canvas.width - 1,
          ((clientX - rect.left) / rect.width) * canvas.width
        )
      );
      const y = Math.max(
        0,
        Math.min(
          canvas.height - 1,
          ((clientY - rect.top) / rect.height) * canvas.height
        )
      );
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const data = ctx.getImageData(x, y, 1, 1).data;
      const r = data[0]!;
      const g = data[1]!;
      const b = data[2]!;
      const newColor = rgbToHex(r, g, b);
      setTempColor(newColor);
      if (activeSquare === 'light') onColorChange(newColor, currentDark);
      else onColorChange(currentLight, newColor);
    },
    [activeSquare, currentLight, currentDark, onColorChange]
  );

  const handleCanvasPointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      isDragging.current = true;
      e.currentTarget.setPointerCapture(e.pointerId);
      pickColorAt(e.clientX, e.clientY);
    },
    [pickColorAt]
  );

  const handleCanvasPointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (isDragging.current) pickColorAt(e.clientX, e.clientY);
    },
    [pickColorAt]
  );

  const handleCanvasPointerUp = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    isDragging.current = false;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  }, []);

  useEffect(() => {
    function stopDragging() {
      isDragging.current = false;
    }

    window.addEventListener('pointerup', stopDragging);
    return () => window.removeEventListener('pointerup', stopDragging);
  }, []);
  const handleHueChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const hue = parseFloat(e.target.value);
      const rgb = hexToRgb(tempColor);
      if (!rgb) return;
      const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
      const newRgb = hsvToRgb(hue / 360, hsv.s, hsv.v); // hsvToRgb takes 0-1 for h
      const newColor = rgbToHex(newRgb.r, newRgb.g, newRgb.b);
      setTempColor(newColor);
      if (activeSquare === 'light') onColorChange(newColor, currentDark);
      else onColorChange(currentLight, newColor);
    },
    [tempColor, activeSquare, currentLight, currentDark, onColorChange]
  );
  const getCurrentHue = useCallback(() => {
    const rgb = hexToRgb(tempColor);
    return rgb ? rgbToHsv(rgb.r, rgb.g, rgb.b).h * 360 : 0; // hsv.h is 0-1
  }, [tempColor]);
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex gap-1.5 p-1 bg-surface rounded-lg border border-border">
        {(['light', 'dark'] as const).map((sq) => (
          <button
            key={sq}
            onClick={() => setActiveSquare(sq)}
            className={`flex-1 py-1.5 text-[11px] font-bold rounded-md transition-all flex items-center justify-center gap-1 ${activeSquare === sq ? 'bg-accent text-bg shadow' : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'}`}
          >
            {sq.charAt(0).toUpperCase() + sq.slice(1)} Square
          </button>
        ))}
      </div>
      <div className="bg-surface rounded-lg p-2 border border-border">
        <canvas
          ref={canvasRef}
          width={240}
          height={100}
          onPointerDown={handleCanvasPointerDown}
          onPointerMove={handleCanvasPointerMove}
          onPointerUp={handleCanvasPointerUp}
          className="w-full h-25 rounded-md cursor-crosshair border border-border/50"
          style={{
            touchAction: 'none'
          }}
        />
      </div>
      <div className="bg-surface rounded-lg p-2 border border-border">
        <div className="flex justify-between text-[10px] text-text-muted mb-1">
          <span className="font-bold">Hue</span>
          <span className="font-mono bg-surface-elevated px-2 py-0.5 rounded text-[10px]">
            {Math.round(getCurrentHue())}°
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="360"
          value={getCurrentHue()}
          onChange={handleHueChange}
          className="w-full h-2 rounded-full cursor-pointer appearance-none"
          style={{
            background:
              'linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)'
          }}
        />
      </div>
    </div>
  );
});
ColorPickerPanel.displayName = 'ColorPickerPanel';
export default ColorPickerPanel;
