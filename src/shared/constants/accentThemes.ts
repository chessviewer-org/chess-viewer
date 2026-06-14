/**
 * Site accent themes — the user-selectable colour for the `--val-accent` family.
 *
 * Each preset carries TWO triples: one for dark mode and one for light mode.
 * They are split because the same colour cannot stay readable on both a near
 * black surface and a near white surface. Following the existing hand-tuned gold
 * (`:root` vs `[data-theme='light']` in `src/index.css`):
 *
 *   - DARK triples are lighter / brighter so the accent reads against dark
 *     surfaces and, used as a button/scrollbar fill behind `--color-bg` text,
 *     keeps comfortable contrast.
 *   - LIGHT triples are darker / more saturated so the accent (and accent text
 *     on light surfaces) stays legible against white/near-white surfaces.
 *
 * Values are space-separated "R G B" strings — the exact format `--val-*` uses,
 * so they drop straight into `document.documentElement.style.setProperty`.
 *
 * `gold` reproduces the current built-in default, so selecting it is identical
 * to having no override.
 */

/** One (accent, hover, muted) colour triple as space-separated "R G B". */
export interface AccentTriple {
  accent: string;
  hover: string;
  muted: string;
}

/** A selectable accent theme with a dark- and light-mode triple. */
export interface AccentTheme {
  id: string;
  label: string;
  dark: AccentTriple;
  light: AccentTriple;
}

export const ACCENT_THEMES: readonly AccentTheme[] = [
  {
    id: 'gold',
    label: 'Gold',
    // Mirrors the built-in default in src/index.css.
    dark: { accent: '198 156 48', hover: '218 176 68', muted: '158 126 38' },
    light: { accent: '160 120 25', hover: '140 100 15', muted: '180 145 55' }
  },
  {
    id: 'green',
    label: 'Green',
    dark: { accent: '74 188 122', hover: '96 208 142', muted: '54 150 96' },
    light: { accent: '24 132 78', hover: '16 112 64', muted: '70 158 110' }
  },
  {
    id: 'blue',
    label: 'Blue',
    dark: { accent: '92 152 246', hover: '120 176 255', muted: '70 122 200' },
    light: { accent: '36 96 210', hover: '24 80 184', muted: '92 140 224' }
  },
  {
    id: 'red',
    label: 'Red',
    dark: { accent: '236 100 110', hover: '248 126 134', muted: '196 78 90' },
    light: { accent: '194 44 60', hover: '170 32 48', muted: '212 88 102' }
  },
  {
    id: 'purple',
    label: 'Purple',
    dark: { accent: '178 132 248', hover: '198 158 255', muted: '142 104 204' },
    light: { accent: '118 56 200', hover: '100 42 178', muted: '150 102 220' }
  },
  {
    id: 'teal',
    label: 'Teal',
    dark: { accent: '52 188 178', hover: '76 208 198', muted: '40 150 142' },
    light: { accent: '14 130 122', hover: '8 110 104', muted: '52 158 150' }
  }
] as const;

/** Default accent id; equals the built-in stylesheet gold. */
export const DEFAULT_ACCENT_ID = 'gold';

/** Set of valid accent ids for validating a stored / untrusted value. */
const ACCENT_IDS = new Set(ACCENT_THEMES.map((t) => t.id));

/** Returns the stored id if it is a known accent, otherwise the default. */
export function normalizeAccentId(value: unknown): string {
  return typeof value === 'string' && ACCENT_IDS.has(value)
    ? value
    : DEFAULT_ACCENT_ID;
}

/** Looks up an accent theme by id, falling back to the default. */
export function getAccentTheme(id: string): AccentTheme {
  return (
    ACCENT_THEMES.find((t) => t.id === id) ??
    ACCENT_THEMES.find((t) => t.id === DEFAULT_ACCENT_ID) ??
    ACCENT_THEMES[0]!
  );
}
