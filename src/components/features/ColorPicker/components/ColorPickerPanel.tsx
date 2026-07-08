import { useCallback, useMemo, useState } from 'react';

import { BOARD_THEMES } from '@constants';

import {
  hexToRgb,
  hsvToRgb,
  rgbToHex,
  rgbToHsv,
  sanitizeHexColor,
  sanitizeInput
} from '@/shared/utils';
import { SaturationField } from './SaturationField';
import styles from '../styles/color-picker.module.scss';

const MAX_NAME_LEN = 10;
const DEFAULT_LIGHT = BOARD_THEMES['classic']?.light ?? '#f0d9b5';
const DEFAULT_DARK = BOARD_THEMES['classic']?.dark ?? '#b58863';

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

  const fieldClass =
    mode === 'live'
      ? styles['saturationFieldLive']
      : styles['saturationFieldSave'];

  return (
    <div className={styles['panelContainer']}>
      <div className={styles['squareGrid']}>
        {(['light', 'dark'] as const).map((side) => {
          const hex = side === 'light' ? light : dark;
          const label = side === 'light' ? 'Light square' : 'Dark square';
          return (
            <button
              key={side}
              type="button"
              onClick={() => setActive(side)}
              className={`${styles['squareBtn']} ${
                active === side
                  ? styles['squareBtnActive']
                  : styles['squareBtnInactive']
              }`}
            >
              <span
                className={styles['squareColorPreview']}
                style={{ backgroundColor: hex }}
              />
              <span className={styles['squareInfo']}>
                <span className={styles['squareLabel']}>{label}</span>
                <span className={styles['squareHex']}>{hex}</span>
              </span>
            </button>
          );
        })}
      </div>

      <span className={styles['sectionHeading']}>Color Picker</span>

      <SaturationField
        hue={hsv.h}
        s={hsv.s}
        v={hsv.v}
        onChange={handleSv}
        className={fieldClass ?? ''}
      />

      <div className={styles['hueContainer']}>
        <span className={styles['sectionHeading']}>Hue</span>
        <input
          type="range"
          min={0}
          max={360}
          value={Math.round(hsv.h * 360)}
          onChange={(e) => handleHue(Number(e.target.value))}
          className={styles['hueInput']}
          style={{
            background: `linear-gradient(to right,
              hsl(0,100%,50%),hsl(60,100%,50%),hsl(120,100%,50%),
              hsl(180,100%,50%),hsl(240,100%,50%),hsl(300,100%,50%),
              hsl(360,100%,50%))`
          }}
          aria-label="Hue"
        />
      </div>

      {mode === 'save' && (
        <div className={styles['saveContainer']}>
          <input
            id="board-theme-name"
            autoFocus
            value={name}
            maxLength={MAX_NAME_LEN}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name (optional)"
            aria-label="Theme name"
            className={styles['saveInput']}
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
            className={styles['saveBtn']}
          >
            Save
          </button>
        </div>
      )}
    </div>
  );
}
