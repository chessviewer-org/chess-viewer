import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { hexToRgb, hsvToRgb, rgbToHex, rgbToHsv } from '@utils';

/** Props for the `ThemeCustomPicker` inline color editor. */
interface ThemeCustomPickerProps {
  currentLight: string;
  currentDark: string;
  onThemeApply: (light: string, dark: string) => void;
}

const ThemeCustomPicker = memo(function ThemeCustomPicker({
  currentLight,
  currentDark,
  onThemeApply
}: ThemeCustomPickerProps) {
  const [activeSquare, setActiveSquare] = useState<'light' | 'dark'>('light');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const currentValue = activeSquare === 'light' ? currentLight : currentDark;
  const [tempColor, setTempColor] = useState(currentValue);

  useEffect(() => {
    setTempColor(currentValue);
  }, [currentValue, activeSquare]);

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
    const hueRgb = hsvToRgb(hsv.h, 100, 100);

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
  }, [tempColor]);

  const handleCanvasClick = useCallback(
    (
      e: React.MouseEvent<HTMLCanvasElement> | { clientX: number; clientY: number }
    ) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x =
        (('clientX' in e ? e.clientX - rect.left : 0) / rect.width) * canvas.width;
      const y =
        (('clientY' in e ? e.clientY - rect.top : 0) / rect.height) * canvas.height;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const imageData = ctx.getImageData(x, y, 1, 1).data;
      if (
        imageData[0] !== undefined &&
        imageData[1] !== undefined &&
        imageData[2] !== undefined
      ) {
        const newColor = rgbToHex(imageData[0], imageData[1], imageData[2]);
        setTempColor(newColor);
        if (activeSquare === 'light') onThemeApply(newColor, currentDark);
        else onThemeApply(currentLight, newColor);
      }
    },
    [activeSquare, currentLight, currentDark, onThemeApply]
  );

  const handleHueChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const hue = parseFloat(e.target.value);
      const rgb = hexToRgb(tempColor);
      if (!rgb) return;
      const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
      const newRgb = hsvToRgb(hue, hsv.s, hsv.v);
      const newColor = rgbToHex(newRgb.r, newRgb.g, newRgb.b);
      setTempColor(newColor);
      if (activeSquare === 'light') onThemeApply(newColor, currentDark);
      else onThemeApply(currentLight, newColor);
    },
    [tempColor, activeSquare, currentLight, currentDark, onThemeApply]
  );

  const getCurrentHue = useCallback(() => {
    const rgb = hexToRgb(tempColor);
    return rgb ? rgbToHsv(rgb.r, rgb.g, rgb.b).h : 0;
  }, [tempColor]);

  return (
    <div className="shrink-0 space-y-3">
      <div className="flex gap-2">
        {(['light', 'dark'] as const).map((sq) => (
          <button
            key={sq}
            onClick={() => setActiveSquare(sq)}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${activeSquare === sq ? 'bg-accent text-bg shadow-md' : 'bg-surface-elevated text-text-secondary hover:bg-surface-hover'}`}
          >
            {sq.charAt(0).toUpperCase() + sq.slice(1)}
          </button>
        ))}
      </div>

      <div className="bg-surface rounded-xl p-3">
        <canvas
          ref={canvasRef}
          width={280}
          height={200}
          onClick={handleCanvasClick}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              const canvas = canvasRef.current;
              if (!canvas) return;
              const rect = canvas.getBoundingClientRect();
              handleCanvasClick({
                clientX: rect.left + rect.width / 2,
                clientY: rect.top + rect.height / 2
              });
            }
          }}
          role="slider"
          tabIndex={0}
          aria-label="Saturation and Lightness Picker"
          aria-valuenow={50}
          aria-valuemin={0}
          aria-valuemax={100}
          className="w-full rounded-lg cursor-crosshair shadow-inner focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        />
      </div>

      <div className="bg-surface rounded-xl p-3">
        <div className="flex justify-between text-xs text-text-muted mb-2">
          <span className="font-semibold">Hue</span>
          <span className="font-mono">{Math.round(getCurrentHue())}°</span>
        </div>
        <input
          type="range"
          min="0"
          max="360"
          value={getCurrentHue()}
          onChange={handleHueChange}
          className="w-full h-3 rounded-lg cursor-pointer"
          style={{
            background:
              'linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)'
          }}
        />
      </div>
    </div>
  );
});

ThemeCustomPicker.displayName = 'ThemeCustomPicker';
export default ThemeCustomPicker;
