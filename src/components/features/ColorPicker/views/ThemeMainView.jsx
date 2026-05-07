import { memo, useCallback, useEffect, useRef, useState } from 'react';

import { Palette, Wand2 } from 'lucide-react';

import { BOARD_THEMES } from '@/constants';
import { useIntersectionObserver } from '@/hooks';
import { hexToRgb, hsvToRgb, rgbToHex, rgbToHsv } from '@/utils';

/**
 * @param {Object} props
 * @returns {JSX.Element}
 */
const ThemePresetButton = memo(function ThemePresetButton({
  themeKey,
  theme,
  isActive,
  onClick
}) {
  const { ref, isVisible } = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: '100px'
  });
  return (
    <button
      ref={ref}
      onClick={() => onClick(themeKey, theme)}
      aria-label={`Apply ${theme.name || themeKey} theme: light ${theme.light}, dark ${theme.dark}`}
      className={`group relative p-2 rounded-xl transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 hover:shadow-md hover:bg-surface-hover overflow-hidden ${isActive ? 'bg-accent/20 shadow-lg shadow-accent/20' : 'hover:bg-surface-elevated'}`}
    >
      {isVisible ? (
        <div className="relative">
          <div
            className="flex w-full h-12 rounded-lg overflow-hidden shadow-sm"
            aria-hidden="true"
          >
            <div
              className="flex-1"
              style={{
                backgroundColor: theme.light
              }}
              title={`Light: ${theme.light}`}
            />
            <div
              className="flex-1"
              style={{
                backgroundColor: theme.dark
              }}
              title={`Dark: ${theme.dark}`}
            />
          </div>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm rounded-lg flex items-center justify-center translate-x-full group-hover:translate-x-0 transition-transform duration-300 ease-out">
            <span className="text-white text-xs font-semibold px-2 text-center">
              {theme.name || themeKey}
            </span>
          </div>
        </div>
      ) : (
        <div className="w-full h-12 bg-surface-elevated rounded-lg animate-pulse" />
      )}
    </button>
  );
});
ThemePresetButton.displayName = 'ThemePresetButton';
/**
 * @param {Object} props
 * @returns {JSX.Element}
 */
const CustomThemeCard = memo(function CustomThemeCard({ isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      aria-label="Create custom theme"
      className={`group relative p-2 rounded-xl transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 hover:shadow-md hover:bg-surface-hover overflow-hidden ${isActive ? 'bg-accent/20 shadow-lg shadow-accent/20' : 'hover:bg-surface-elevated'}`}
    >
      <div className="relative">
        <div
          className="flex w-full h-12 rounded-lg overflow-hidden shadow-sm bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500"
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm rounded-lg flex items-center justify-center translate-x-full group-hover:translate-x-0 transition-transform duration-300 ease-out">
          <Wand2 className="w-4 h-4 text-white mr-1.5" />
          <span className="text-white text-xs font-semibold">Custom</span>
        </div>
      </div>
    </button>
  );
});
CustomThemeCard.displayName = 'CustomThemeCard';
/**
 * @param {Object} props
 * @returns {JSX.Element}
 */
const ThemeMainView = memo(function ThemeMainView({
  currentLight,
  currentDark,
  onThemeApply
}) {
  const [mode, setMode] = useState('main');
  const [activeSquare, setActiveSquare] = useState('light');
  const canvasRef = useRef(null);
  const [tempColor, setTempColor] = useState(currentLight);
  const currentValue = activeSquare === 'light' ? currentLight : currentDark;
  const isCustomTheme = !Object.values(BOARD_THEMES)
    .slice(0, 19)
    .some(
      (theme) => theme.light === currentLight && theme.dark === currentDark
    );
  useEffect(() => {
    setTempColor(currentValue);
  }, [currentValue, activeSquare]);
  useEffect(() => {
    if (mode !== 'custom') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width,
      h = canvas.height;
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
  }, [tempColor, mode]);
  const handleCanvasClick = useCallback(
    (e) => {
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
      const y = ((e.clientY - rect.top) / rect.height) * canvas.height;
      const ctx = canvas.getContext('2d');
      const [r, g, b] = ctx.getImageData(x, y, 1, 1).data;
      const newColor = rgbToHex(r, g, b);
      setTempColor(newColor);
      if (activeSquare === 'light') {
        onThemeApply(newColor, currentDark);
      } else {
        onThemeApply(currentLight, newColor);
      }
    },
    [activeSquare, currentLight, currentDark, onThemeApply]
  );
  const handleHueChange = useCallback(
    (e) => {
      const hue = parseFloat(e.target.value);
      const rgb = hexToRgb(tempColor);
      if (!rgb) return;
      const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
      const newRgb = hsvToRgb(hue, hsv.s, hsv.v);
      const newColor = rgbToHex(newRgb.r, newRgb.g, newRgb.b);
      setTempColor(newColor);
      if (activeSquare === 'light') {
        onThemeApply(newColor, currentDark);
      } else {
        onThemeApply(currentLight, newColor);
      }
    },
    [tempColor, activeSquare, currentLight, currentDark, onThemeApply]
  );
  const getCurrentHue = useCallback(() => {
    const rgb = hexToRgb(tempColor);
    return rgb ? rgbToHsv(rgb.r, rgb.g, rgb.b).h : 0;
  }, [tempColor]);
  const handleThemeClick = useCallback(
    (key, theme) => {
      onThemeApply(theme.light, theme.dark);
      setMode('main');
    },
    [onThemeApply]
  );
  const handleCustomCardClick = useCallback(() => {
    setMode('custom');
  }, []);
  const sortedThemes = Object.entries(BOARD_THEMES)
    .slice(0, 19)
    .sort((a, b) => {
      const getLightness = (hex) => {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return (r + g + b) / 3;
      };
      return getLightness(b[1].light) - getLightness(a[1].light);
    });
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
                        backgroundColor: isLight ? currentLight : currentDark,
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
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={() => setMode('main')}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${mode === 'main' ? 'bg-accent text-bg shadow-md' : 'bg-surface-elevated text-text-secondary hover:bg-surface-hover border border-border'}`}
            >
              <Palette className="w-4 h-4" />
              Main
            </button>
            <button
              onClick={() => setMode('custom')}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${mode === 'custom' ? 'bg-accent text-bg shadow-md' : 'bg-surface-elevated text-text-secondary hover:bg-surface-hover border border-border'}`}
            >
              <Wand2 className="w-4 h-4" />
              Custom
            </button>
          </div>

          {mode === 'main' ? (
            <>
              <div className="flex items-center gap-2 flex-shrink-0 mt-6">
                <Palette className="w-4 h-4 text-accent" />
                <h2 className="font-semibold text-text-primary">
                  Theme Presets
                </h2>
              </div>
              <div
                className="grid grid-cols-4 gap-2"
                role="group"
                aria-label="Theme preset options"
              >
                {sortedThemes.map(([key, theme]) => {
                  const isActive =
                    theme.light === currentLight && theme.dark === currentDark;
                  return (
                    <ThemePresetButton
                      key={key}
                      themeKey={key}
                      theme={theme}
                      isActive={isActive}
                      onClick={handleThemeClick}
                    />
                  );
                })}
                <CustomThemeCard
                  isActive={isCustomTheme}
                  onClick={handleCustomCardClick}
                />
              </div>
            </>
          ) : (
            <div className="flex-shrink-0 space-y-3">
              <div className="flex gap-2">
                {['light', 'dark'].map((sq) => (
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
          )}
        </div>
      </div>
    </div>
  );
});
ThemeMainView.displayName = 'ThemeMainView';
export default ThemeMainView;
