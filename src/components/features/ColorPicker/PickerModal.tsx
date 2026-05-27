import { useState, ChangeEvent, MouseEvent, RefObject } from 'react';
import { ArrowLeft, X } from 'lucide-react';
import { ThemeSettingsView } from './views';

/** Props for the `PickerModal` dropdown dialog. */
export interface PickerModalProps {
  isOpen: boolean;
  tempColor: string;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  activePalette: string;
  setActivePalette: (palette: string) => void;
  copiedText: string;
  onClose: () => void;
  onCanvasClick: (e: MouseEvent<HTMLCanvasElement>) => void;
  onHueChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onColorSelect: (color: string) => void;
  onRandom: () => void;
  onReset: () => void;
  onCopy: () => void;
  onApply: () => void;
  getCurrentHue: () => number;
  getRgbValues: () => string;
}

type ActiveView = 'main' | 'palettes' | 'settings';

/**
 * Floating color picker dialog anchored to its parent container.
 *
 * Manages its own view state (`main` | `palettes` | `settings`) and renders
 * the gradient canvas, hue slider, and quick-action buttons. Returns `null`
 * while closed to avoid unnecessary DOM nodes.
 */
function PickerModal({
  isOpen,
  tempColor,
  canvasRef,
  copiedText,
  onClose,
  onCanvasClick,
  onHueChange,
  onRandom,
  onReset,
  onCopy,
  onApply,
  getCurrentHue,
  getRgbValues
}: PickerModalProps) {
  const [activeView, setActiveView] = useState<ActiveView>('main');

  if (!isOpen) return null;

  const viewConfig = {
    main: {
      title: 'Advanced Color Picker',
      gradient: 'from-blue-600/10 to-purple-600/10'
    },
    palettes: {
      title: 'Color Palettes',
      gradient: 'from-purple-600/10 to-pink-600/10'
    },
    settings: {
      title: 'Settings',
      gradient: 'from-blue-600/10 to-cyan-600/10'
    }
  } as const;

  const currentView = viewConfig[activeView];

  return (
    <div
      className="absolute z-50 mt-2 bg-surface border border-border/50 rounded-2xl shadow-2xl overflow-hidden"
      style={{
        width: 'min(380px, calc(100vw - 2rem))',
        maxHeight: 'calc(100dvh - 8rem)',
        overflowY: 'auto',
        right: 0
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="color-picker-title"
    >
      <div
        className={`flex items-center gap-3 p-4 border-b border-border/50 bg-linear-to-r ${currentView.gradient}`}
      >
        {activeView !== 'main' && (
          <button
            onClick={() => setActiveView('main')}
            className="p-1.5 hover:bg-surface-hover/80 rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            aria-label="Go back to main view"
          >
            <ArrowLeft
              className="w-5 h-5 text-text-secondary"
              aria-hidden="true"
            />
          </button>
        )}
        <div className="flex items-center gap-2 flex-1">
          {activeView === 'main' && (
            <div
              className="w-8 h-8 rounded-lg border-2 border-border shadow-lg"
              style={{
                background: tempColor
              }}
              aria-label={`Current color: ${tempColor}`}
            />
          )}
          <span
            id="color-picker-title"
            className="text-sm font-bold text-text-primary"
          >
            {currentView.title}
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-surface-hover/80 rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          aria-label="Close color picker"
        >
          <X className="w-4 h-4 text-text-muted" aria-hidden="true" />
        </button>
      </div>

      {activeView === 'main' && (
        <div className="p-5 space-y-4">
          <div className="relative group">
            <canvas
              ref={canvasRef}
              width={348}
              height={200}
              onClick={onCanvasClick}
              className="w-full rounded-xl cursor-crosshair border-2 border-border/50 hover:border-accent/50 transition-all shadow-lg"
              role="img"
              aria-label="Color gradient picker canvas. Click to select a color."
            />
            <div
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
              aria-hidden="true"
            >
              <div className="bg-black/70 backdrop-blur-sm px-2 py-1 rounded text-xs text-white font-semibold">
                Click to pick
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="hue-slider"
                className="text-xs text-text-muted font-semibold uppercase tracking-wider"
              >
                Hue
              </label>
              <span
                className="text-xs text-text-muted font-mono"
                aria-live="polite"
              >
                {Math.round(getCurrentHue())}°
              </span>
            </div>
            <input
              id="hue-slider"
              type="range"
              min="0"
              max="360"
              step="1"
              value={getCurrentHue()}
              onChange={onHueChange}
              className="hue-slider w-full h-4 rounded-full appearance-none cursor-pointer"
              style={{
                background:
                  'linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)'
              }}
              aria-label={`Hue value: ${Math.round(getCurrentHue())} degrees`}
            />
          </div>

          <div
            className="grid grid-cols-3 gap-2"
            role="group"
            aria-label="Color actions"
          >
            <button
              onClick={onRandom}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-info/20 hover:bg-info/30 border border-info/50 rounded-lg text-info text-xs font-semibold transition-all  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              type="button"
            >
              Random
            </button>
            <button
              onClick={onReset}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-warning/20 hover:bg-warning/30 border border-warning/50 rounded-lg text-warning text-xs font-semibold transition-all  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              type="button"
            >
              Reset
            </button>
            <button
              onClick={onCopy}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-linear-to-br from-success/20 to-success/10 hover:from-success/30 hover:to-success/20 border border-success/50 rounded-lg text-success text-xs font-semibold transition-all  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              type="button"
              aria-live="polite"
            >
              {copiedText === tempColor ? 'Copied!' : 'Copy'}
            </button>
          </div>

          <div className="flex items-center gap-3 p-4 bg-linear-to-br from-surface-elevated/80 to-surface/80 rounded-xl border border-border/50">
            <div
              className="w-16 h-16 rounded-xl border-2 border-border"
              style={{
                background: tempColor
              }}
              role="img"
              aria-label={`Color preview: ${tempColor}`}
            />
            <div className="flex-1">
              <div className="text-xs text-text-muted mb-1">Selected Color</div>
              <div className="text-sm font-mono text-text-primary font-bold">
                {tempColor.toUpperCase()}
              </div>
              <div className="text-xs text-text-muted font-mono">
                RGB: {getRgbValues()}
              </div>
            </div>
            <button
              onClick={onApply}
              className="px-5 py-3 bg-linear-to-br from-accent to-accent/90 hover:from-accent/90 hover:to-accent/80 text-bg text-sm font-bold rounded-xl transition-all  shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
              type="button"
              aria-label={`Apply color ${tempColor}`}
            >
              Apply
            </button>
          </div>
        </div>
      )}

      {activeView === 'palettes' && <div className="p-5">Palettes View</div>}
      {activeView === 'settings' && <ThemeSettingsView onSettingsChange={() => {}} />}
    </div>
  );
}

export default PickerModal;
