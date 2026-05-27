import { useCallback, useMemo, useState } from 'react';

import { hexToRgb, hsvToRgb, rgbToHex, rgbToHsv } from '@utils';

/** Props for the inline panel used to create a new custom board theme. */
export interface AddThemePanelProps {
  onSave: (name: string, light: string, dark: string) => void;
  onCancel: () => void;
}

/** Form for naming and colour-picking a new custom board theme before saving. */
export default function AddThemePanel({ onSave, onCancel }: AddThemePanelProps) {
  const [name, setName] = useState('');
  const [light, setLight] = useState('#f0d9b5');
  const [dark, setDark] = useState('#b58863');
  const [activeColor, setActiveColor] = useState<'light' | 'dark'>('light');

  const selectedColor = activeColor === 'light' ? light : dark;
  const currentHsv = useMemo(() => {
    const rgb = hexToRgb(selectedColor);
    if (!rgb) return { h: 0, s: 0, v: 0 };
    return rgbToHsv(rgb.r, rgb.g, rgb.b);
  }, [selectedColor]);

  const updateActiveColor = useCallback(
    (nextColor: string) => {
      if (activeColor === 'light') setLight(nextColor);
      else setDark(nextColor);
    },
    [activeColor]
  );

  const handleHueChange = useCallback(
    (hue: number) => {
      const nextRgb = hsvToRgb(hue, currentHsv.s, currentHsv.v);
      updateActiveColor(rgbToHex(nextRgb.r, nextRgb.g, nextRgb.b));
    },
    [currentHsv.s, currentHsv.v, updateActiveColor]
  );

  return (
    <div className="flex-1 flex flex-col gap-6">
      <div className="space-y-2">
        <label className="block text-xs font-semibold text-text-secondary">
          Add theme name
        </label>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="e.g. Midnight Board"
          className="w-full rounded-lg border border-border/60 bg-surface-elevated px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
          autoFocus
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setActiveColor('light')}
          className={`rounded-xl border px-3 py-3 text-xs font-semibold transition-colors ${
            activeColor === 'light'
              ? 'border-accent bg-accent/10 text-text-primary'
              : 'border-border/60 text-text-secondary hover:bg-surface-elevated'
          }`}
        >
          <span
            className="block w-8 h-8 rounded-full border border-border mx-auto mb-2"
            style={{ backgroundColor: light }}
          />
          Light Square
        </button>
        <button
          type="button"
          onClick={() => setActiveColor('dark')}
          className={`rounded-xl border px-3 py-3 text-xs font-semibold transition-colors ${
            activeColor === 'dark'
              ? 'border-accent bg-accent/10 text-text-primary'
              : 'border-border/60 text-text-secondary hover:bg-surface-elevated'
          }`}
        >
          <span
            className="block w-8 h-8 rounded-full border border-border mx-auto mb-2"
            style={{ backgroundColor: dark }}
          />
          Dark Square
        </button>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-text-secondary">Color Picker</label>
          <input
            type="color"
            value={selectedColor}
            onChange={(event) => updateActiveColor(event.target.value)}
            className="w-full h-12 rounded-lg cursor-pointer border border-border/50 bg-transparent"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-semibold text-text-secondary">Hue Slider</label>
          <input
            type="range"
            min={0}
            max={360}
            value={currentHsv.h}
            onChange={(event) => handleHueChange(Number(event.target.value))}
            className="w-full accent-accent"
          />
        </div>
      </div>

      <div className="mt-auto flex items-center gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-lg border border-border/60 py-2 text-sm font-semibold text-text-secondary hover:text-text-primary hover:bg-surface-elevated transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={!name.trim()}
          onClick={() => onSave(name.trim(), light, dark)}
          className="flex-1 rounded-lg bg-accent text-bg py-2 text-sm font-semibold hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Save
        </button>
      </div>
    </div>
  );
}
