import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { Sliders } from 'lucide-react';
import { hexToRgb, hsvToRgb, rgbToHex, rgbToHsv } from '@utils';

/** Props for the `ThemeAdvancedPickerView` full-screen color editor. */
export interface ThemeAdvancedPickerViewProps {
  activeSquare: 'light' | 'dark';
  setActiveSquare: (square: 'light' | 'dark') => void;
  lightSquare: string;
  setLightSquare: (color: string) => void;
  darkSquare: string;
  setDarkSquare: (color: string) => void;
}

/**
 * Side-by-side board preview and HSV canvas picker for individually editing
 * the light and dark square colors of the active board theme.
 */
const ThemeAdvancedPickerView = memo(
  function ThemeAdvancedPickerView({
    activeSquare,
    setActiveSquare,
    lightSquare,
    setLightSquare,
    darkSquare,
    setDarkSquare
  }: ThemeAdvancedPickerViewProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const currentValue = activeSquare === 'light' ? lightSquare : darkSquare;
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
      (e: React.MouseEvent<HTMLCanvasElement> | { clientX: number; clientY: number }) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = (('clientX' in e ? e.clientX - rect.left : 0) / rect.width) * canvas.width;
        const y = (('clientY' in e ? e.clientY - rect.top : 0) / rect.height) * canvas.height;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const imageData = ctx.getImageData(x, y, 1, 1).data;
        if (imageData[0] !== undefined && imageData[1] !== undefined && imageData[2] !== undefined) {
          const newColor = rgbToHex(imageData[0], imageData[1], imageData[2]);
          setTempColor(newColor);
          if (activeSquare === 'light') setLightSquare(newColor);
          else setDarkSquare(newColor);
        }
      },
      [activeSquare, setLightSquare, setDarkSquare]
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
        if (activeSquare === 'light') setLightSquare(newColor);
        else setDarkSquare(newColor);
      },
      [tempColor, activeSquare, setLightSquare, setDarkSquare]
    );

    const getCurrentHue = useCallback(() => {
      const rgb = hexToRgb(tempColor);
      return rgb ? rgbToHsv(rgb.r, rgb.g, rgb.b).h : 0;
    }, [tempColor]);

    return (
      <div className="h-full flex flex-col bg-surface-elevated rounded-2xl border border-border overflow-hidden">
        <div className="flex-1 grid lg:grid-cols-[1fr,1fr] gap-6 p-6 overflow-hidden">
          <div className="flex items-center justify-center min-h-0">
            <div className="relative inline-flex flex-col items-center">
              <div className="flex items-center">
                <div
                  className="flex flex-col justify-between pr-2"
                  style={{
                    height: 'min(65vh, 60vw)'
                  }}
                >
                  {[8, 7, 6, 5, 4, 3, 2, 1].map((num) => (
                    <div
                      key={num}
                      className="text-sm font-semibold text-text-muted flex items-center justify-center select-none"
                      style={{
                        height: 'calc(min(65vh, 60vw) / 8)'
                      }}
                    >
                      {num}
                    </div>
                  ))}
                </div>

                <div
                  className="grid grid-cols-8 border-2 border-border shadow-2xl"
                  style={{
                    width: 'min(65vh, 60vw)',
                    height: 'min(65vh, 60vw)',
                    contain: 'strict'
                  }}
                >
                  {Array.from({
                    length: 64
                  }).map((_, i) => {
                    const row = Math.floor(i / 8);
                    const col = i % 8;
                    const isLight = (row + col) % 2 === 0;
                    return (
                      <div
                        key={`sq-${row}-${col}`}
                        style={{
                          backgroundColor: isLight ? lightSquare : darkSquare,
                          outline: '1px solid transparent'
                        }}
                      />
                    );
                  })}
                </div>
              </div>

              <div
                className="flex mt-2 justify-between"
                style={{
                  width: 'min(65vh, 60vw)'
                }}
              >
                {['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map((letter) => (
                  <div
                    key={letter}
                    className="text-sm font-semibold text-text-muted text-center select-none"
                    style={{
                      width: 'calc(min(65vh, 60vw) / 8)'
                    }}
                  >
                    {letter}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 min-h-0 overflow-y-auto pr-2">
            <div className="grid grid-cols-2 gap-2 shrink-0">
              <div className="flex items-center gap-2 p-2.5 bg-surface rounded-lg border border-border">
                <div
                  className="w-10 h-10 border border-border shadow-sm shrink-0 rounded"
                  style={{
                    backgroundColor: lightSquare
                  }}
                />
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] text-text-muted mb-0.5">
                    Light Square
                  </div>
                  <div className="text-[10px] font-mono text-text-primary font-semibold truncate">
                    {lightSquare}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2.5 bg-surface rounded-lg border border-border">
                <div
                  className="w-10 h-10 border border-border shadow-sm shrink-0 rounded"
                  style={{
                    backgroundColor: darkSquare
                  }}
                />
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] text-text-muted mb-0.5">
                    Dark Square
                  </div>
                  <div className="text-[10px] font-mono text-text-primary font-semibold truncate">
                    {darkSquare}
                  </div>
                </div>
              </div>
            </div>

            <div className="shrink-0">
              <div className="flex items-center gap-2 mb-3">
                <Sliders className="w-4 h-4 text-accent" />
                <h3 className="text-sm font-semibold text-text-primary">
                  Color Picker
                </h3>
              </div>

              <div className="flex gap-2 mb-3">
                {(['light', 'dark'] as const).map((sq) => (
                  <button
                    key={sq}
                    onClick={() => setActiveSquare(sq)}
                    className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${activeSquare === sq ? 'bg-accent text-bg shadow-md' : 'bg-surface-elevated text-text-secondary hover:bg-surface-hover border border-border'}`}
                  >
                    {sq.charAt(0).toUpperCase() + sq.slice(1)}
                  </button>
                ))}
              </div>

              <div className="bg-surface rounded-xl border border-border p-3">
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
                  aria-label="Advanced Saturation and Lightness Picker"
                  aria-valuenow={50}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  className="w-full rounded-lg cursor-crosshair shadow-inner focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                />
              </div>

              <div className="bg-surface rounded-xl border border-border p-3">
                <div className="flex justify-between text-xs text-text-muted mb-2">
                  <span className="font-semibold">Hue</span>
                  <span className="font-mono">
                    {Math.round(getCurrentHue())}°
                  </span>
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
          </div>
        </div>
      </div>
    );
  },
  (prev, next) =>
    prev.activeSquare === next.activeSquare &&
    prev.lightSquare === next.lightSquare &&
    prev.darkSquare === next.darkSquare
);

ThemeAdvancedPickerView.displayName = 'ThemeAdvancedPickerView';
export default ThemeAdvancedPickerView;
