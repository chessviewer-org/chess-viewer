import { useCallback, useMemo, useState } from 'react';

import { BOARD_THEMES } from '@constants';

import { hexToRgb, hsvToRgb, rgbToHex, rgbToHsv } from '@utils';
import { sanitizeHexColor, sanitizeInput } from '@utils';
import { SaturationField } from './SaturationField';

const MAX_NAME_LEN = 10;
const DEFAULT_LIGHT = BOARD_THEMES['classic']?.light ?? '#f0d9b5';
const DEFAULT_DARK = BOARD_THEMES['classic']?.dark ?? '#b58863';

/**
 * The colour picker is the heart of the Custom tab. It has two modes:
 *
 *   - "live"  → no name field, no buttons. Choosing colours applies them to the
 *     board immediately via `onLiveChange` (Custom's default browsing mode —
 *     pick a colour without saving a theme).
 *   - "save"  → a compact name input + Save button on one row at the bottom.
 *     Reached by pressing "+" on the Presets tab, or Edit on a saved swatch. The
 *     header X (in the parent) closes the form, so there is no Cancel button.
 */
export function ColorPickerPanel({
  mode,
  initial,
  onLiveChange,
  onSave
}: {
  mode: 'live' | 'save';
  initial: { name: string; light: string; dark: string };
  onLiveChange?: (light: string, dark: string) => void;
  onSave?: (name: string, light: string, dark: string) => void;
}) {
  const [name, setName] = useState(initial.name);
  const [light, setLight] = useState(initial.light);
  const [dark, setDark] = useState(initial.dark);
  const [active, setActive] = useState<'light' | 'dark'>('light');

  const selectedHex = active === 'light' ? light : dark;

  // Every colour change pushes BOTH squares to the board so the preview and the
  // live board update dynamically as the user drags — in live AND save mode.
  const setSelected = useCallback(
    (hex: string) => {
      const nextLight = active === 'light' ? hex : light;
      const nextDark = active === 'dark' ? hex : dark;
      if (active === 'light') setLight(hex);
      else setDark(hex);
      onLiveChange?.(nextLight, nextDark);
    },
    [active, light, dark, onLiveChange]
  );

  const hsv = useMemo(() => {
    const rgb = hexToRgb(selectedHex);
    return rgbToHsv(rgb.r, rgb.g, rgb.b);
  }, [selectedHex]);

  const handleHue = useCallback(
    (hue: number) => {
      const { r, g, b } = hsvToRgb(hue / 360, hsv.s, hsv.v);
      setSelected(rgbToHex(r, g, b));
    },
    [hsv.s, hsv.v, setSelected]
  );

  const handleSv = useCallback(
    (s: number, v: number) => {
      const { r, g, b } = hsvToRgb(hsv.h, s, v);
      setSelected(rgbToHex(r, g, b));
    },
    [hsv.h, setSelected]
  );

  // live mode: SaturationField grows to fill all available height.
  // save mode: fixed compact height so it fits alongside the Presets grid.
  const fieldClass =
    mode === 'live'
      ? 'flex-1 min-h-[4.5rem] w-full cursor-crosshair touch-none overflow-hidden rounded-lg shadow-[inset_0_0_0_1px_rgba(128,128,128,0.25)]'
      : 'h-28 w-full cursor-crosshair touch-none overflow-hidden rounded-lg shadow-[inset_0_0_0_1px_rgba(128,128,128,0.25)]';

  return (
    <div className="flex h-full flex-col gap-2">
      {/* Light / Dark toggles with live hex */}
      <div className="grid grid-cols-2 gap-2">
        {(['light', 'dark'] as const).map((side) => {
          const hex = side === 'light' ? light : dark;
          const label = side === 'light' ? 'Light square' : 'Dark square';
          return (
            <button
              key={side}
              type="button"
              onClick={() => setActive(side)}
              className={`flex items-center gap-2 rounded-lg border px-2 py-1.5 text-left transition-colors ${
                active === side
                  ? 'border-accent bg-accent/10'
                  : 'border-border/60 hover:bg-surface'
              }`}
            >
              <span
                className="h-5 w-5 shrink-0 rounded-md border border-border/40"
                style={{ backgroundColor: hex }}
              />
              <span className="min-w-0">
                <span className="block text-xs font-semibold text-text-primary">
                  {label}
                </span>
                <span className="block font-mono text-xs uppercase text-text-secondary">
                  {hex}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {/* Color Picker label */}
      <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
        Color Picker
      </span>

      {/* 2D saturation/value field — grows in live mode, fixed in save mode */}
      <SaturationField
        hue={hsv.h}
        s={hsv.s}
        v={hsv.v}
        onChange={handleSv}
        className={fieldClass}
      />

      {/* Hue slider with label, pushed down with mt-1 */}
      <div className="mt-1 flex flex-col gap-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
          Hue
        </span>
        <input
          type="range"
          min={0}
          max={360}
          value={Math.round(hsv.h * 360)}
          onChange={(e) => handleHue(Number(e.target.value))}
          className="h-2 w-full cursor-pointer appearance-none rounded-full"
          style={{
            background: `linear-gradient(to right,
              hsl(0,100%,50%),hsl(60,100%,50%),hsl(120,100%,50%),
              hsl(180,100%,50%),hsl(240,100%,50%),hsl(300,100%,50%),
              hsl(360,100%,50%))`
          }}
          aria-label="Hue"
        />
      </div>

      {/* Save row — save mode only */}
      {mode === 'save' && (
        <div className="mt-2 flex items-center gap-2">
          <input
            id="board-theme-name"
            autoFocus
            value={name}
            maxLength={MAX_NAME_LEN}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name (optional)"
            aria-label="Theme name"
            className="min-w-0 flex-1 rounded-lg border border-border/60 bg-surface px-2 py-1.5 text-xs text-text-primary placeholder:text-text-muted outline-none"
          />
          <button
            type="button"
            onClick={() =>
              onSave?.(
                sanitizeInput(name).trim().slice(0, MAX_NAME_LEN),
                sanitizeHexColor(light, DEFAULT_LIGHT),
                sanitizeHexColor(dark, DEFAULT_DARK)
              )
            }
            className="shrink-0 rounded-lg bg-accent px-3 py-1.5 text-xs font-bold text-bg transition-colors hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Save
          </button>
        </div>
      )}
    </div>
  );
}
