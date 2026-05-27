import {
  BOARD_THEMES,
  MAX_TOTAL_PRESETS,
  STANDARD_PRESETS_COUNT,
  STORAGE_KEYS,
  WOOD_PRESET
} from '@/constants';
import { getStoredString, getStoredValue } from '@/utils/validation';

/**
 * Builds the default preset list from built-in board themes.
 *
 * @returns {Object[]} Default preset objects
 */
export function getDefaultPresets() {
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
      isDeletable: true
    }))
  ];
}

function normalizePresets(presets) {
  const source = Array.isArray(presets) ? presets : [];
  const withoutWood = source.filter(
    (preset) =>
      preset && typeof preset === 'object' && preset.id !== WOOD_PRESET.id
  );
  return [WOOD_PRESET, ...withoutWood].slice(0, MAX_TOTAL_PRESETS);
}
/**
 * Loads saved presets from localStorage, ensuring the Wood preset is always first.
 *
 * @returns {Object[]} Loaded or default presets
 */
export function loadPresets() {
  try {
    const loaded = getStoredValue(STORAGE_KEYS.PRESETS, null);
    if (loaded) {
      return normalizePresets(loaded);
    }
  } catch {
    return getDefaultPresets();
  }
  return getDefaultPresets();
}
/**
 * Saves presets to localStorage.
 *
 * @param {Object[]} presets
 */
export function savePresets(presets) {
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
 * @param {string} key - localStorage key
 * @param {string} fallback - Value to return on error or missing key
 * @returns {string}
 */
export function readSquare(key, fallback) {
  try {
    return getStoredString(key, fallback);
  } catch {
    return fallback;
  }
}
