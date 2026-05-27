import {
  BOARD_THEMES,
  MAX_TOTAL_PRESETS,
  STANDARD_PRESETS_COUNT,
  STORAGE_KEYS,
  WOOD_PRESET
} from '@constants';
import { safeJSONParse } from '@utils/validation';
import { BoardPreset } from '@app-types';

/**
 * Builds the default preset list from built-in board themes.
 *
 * @returns Array of default preset objects
 */
export function getDefaultPresets(): BoardPreset[] {
  const themes = Object.entries(BOARD_THEMES).slice(
    0,
    STANDARD_PRESETS_COUNT - 1
  );
  return [
    WOOD_PRESET,
    ...themes.map(([_key, t], i) => ({
      id: `preset-${i + 1}`,
      name: t.name,
      light: t.light,
      dark: t.dark,
      isDefault: true,
      isDeletable: true,
      isEditable: true
    }))
  ];
}

/**
 * Ensures the Wood preset is always first and limits total count to `MAX_TOTAL_PRESETS`.
 *
 * @param presets - Array of presets to normalize
 * @returns Normalized array
 */
function normalizePresets(presets: BoardPreset[]): BoardPreset[] {
  const source = Array.isArray(presets) ? presets : [];
  const withoutWood = source.filter(
    (preset) =>
      preset && typeof preset === 'object' && preset.id !== WOOD_PRESET.id
  );
  return [WOOD_PRESET, ...withoutWood].slice(0, MAX_TOTAL_PRESETS);
}

/**
 * Loads saved presets from localStorage.
 *
 * @returns Loaded presets, or the default list if nothing is stored or parsing fails
 */
export function loadPresets(): BoardPreset[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PRESETS);
    if (raw) {
      const loaded = safeJSONParse<BoardPreset[] | null>(raw, null);
      if (loaded) {
        return normalizePresets(loaded);
      }
    }
  } catch {
    return getDefaultPresets();
  }
  return getDefaultPresets();
}

/**
 * Saves presets to localStorage.
 *
 * @param presets - Array of presets to persist
 */
export function savePresets(presets: BoardPreset[]): void {
  try {
    localStorage.setItem(
      STORAGE_KEYS.PRESETS,
      JSON.stringify(normalizePresets(presets))
    );
  } catch {
    return;
  }
}

/**
 * Reads a square color from localStorage, stripping surrounding quotes.
 *
 * @param key - localStorage key
 * @param fallback - Value to return on error or missing key
 * @returns Sanitized color string
 */
export function readSquare(key: string, fallback: string): string {
  try {
    const v = localStorage.getItem(key);
    return v ? v.replace(/"/g, '') : fallback;
  } catch {
    return fallback;
  }
}
