import { safeJSONParse } from '@chessviewer-org/chess-viewer';

export type ColorVisionPreference =
  | 'none'
  | 'deuteranopia'
  | 'protanopia'
  | 'tritanopia';

const DEFAULT_COLOR_VISION: ColorVisionPreference = 'none';

export const COLOR_VISION_STORAGE_KEY = 'cv_color_vision';
export const COLOR_VISION_CHANGE_EVENT = 'cv-color-vision-change';

export function isColorVisionPreference(
  value: unknown
): value is ColorVisionPreference {
  return (
    value === 'none' ||
    value === 'deuteranopia' ||
    value === 'protanopia' ||
    value === 'tritanopia'
  );
}

export function readColorVisionPreference(): ColorVisionPreference {
  try {
    const raw = window.localStorage.getItem(COLOR_VISION_STORAGE_KEY);
    if (raw) {
      const parsed = safeJSONParse<ColorVisionPreference | null>(raw, null);
      if (isColorVisionPreference(parsed)) return parsed;
      if (isColorVisionPreference(raw)) return raw;
    }
  } catch {
    return DEFAULT_COLOR_VISION;
  }
  return DEFAULT_COLOR_VISION;
}

const SVG_NS = 'http://www.w3.org/2000/svg';
const DEFS_ID = 'cv-cvd-defs';

const CVD_MATRICES: Record<Exclude<ColorVisionPreference, 'none'>, string> = {
  deuteranopia: [
    '0.29901 0.58699 0.11400 0',
    '0.29901 0.58699 0.11400 0',
    '0.00000 0.19333 0.80667 0',
    '0 0 0 1 0'
  ].join(' '),

  protanopia: [
    '0.10889 0.89111 0.00000 0',
    '0.10889 0.89111 0.00000 0',
    '0.00000 0.25238 0.74762 0',
    '0 0 0 1 0'
  ].join(' '),

  tritanopia: [
    '0.96720 0.03280 0.00000 0',
    '0.02138 0.97862 0.00000 0',
    '0.02138 0.52552 0.45310 0',
    '0 0 0 1 0'
  ].join(' ')
};

function ensureSvgDefs(): SVGDefsElement {
  const defsEl = document.querySelector<SVGDefsElement>(`#${DEFS_ID}`);
  if (defsEl) return defsEl;

  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('aria-hidden', 'true');
  svg.style.cssText =
    'position:absolute;width:0;height:0;overflow:hidden;pointer-events:none';

  const defs = document.createElementNS(SVG_NS, 'defs');
  defs.id = DEFS_ID;
  svg.appendChild(defs);
  document.body.prepend(svg);
  return defs;
}

function ensureCvdFilter(
  defs: SVGDefsElement,
  type: Exclude<ColorVisionPreference, 'none'>
): void {
  const filterId = `cv-cvd-${type}`;
  if (document.getElementById(filterId)) return;

  const filter = document.createElementNS(SVG_NS, 'filter');
  filter.id = filterId;

  const matrix = document.createElementNS(SVG_NS, 'feColorMatrix');
  matrix.setAttribute('type', 'matrix');
  matrix.setAttribute('values', CVD_MATRICES[type]);
  filter.appendChild(matrix);
  defs.appendChild(filter);
}

export function applyColorVision(preference: ColorVisionPreference): void {
  const root = document.documentElement;

  if (preference === 'none') {
    root.style.removeProperty('filter');
    return;
  }

  const defs = ensureSvgDefs();
  ensureCvdFilter(defs, preference);
  root.style.filter = `url(#cv-cvd-${preference})`;
}

export type ContrastPreference = 'normal' | 'high';

const DEFAULT_CONTRAST: ContrastPreference = 'normal';

export const CONTRAST_STORAGE_KEY = 'cv_contrast';
export const CONTRAST_CHANGE_EVENT = 'cv-contrast-change';

export function isContrastPreference(
  value: unknown
): value is ContrastPreference {
  return value === 'normal' || value === 'high';
}

export function readContrastPreference(): ContrastPreference {
  try {
    const raw = window.localStorage.getItem(CONTRAST_STORAGE_KEY);
    if (raw) {
      const parsed = safeJSONParse<ContrastPreference | null>(raw, null);
      if (isContrastPreference(parsed)) return parsed;
      if (isContrastPreference(raw)) return raw;
    }
  } catch {
    return DEFAULT_CONTRAST;
  }
  return DEFAULT_CONTRAST;
}

export function applyContrast(preference: ContrastPreference): void {
  const root = document.documentElement;
  if (preference === 'high') {
    root.setAttribute('data-contrast', 'high');
  } else {
    root.removeAttribute('data-contrast');
  }
}

export type ReducedMotionPreference = 'system' | 'reduce' | 'full';

const DEFAULT_REDUCED_MOTION: ReducedMotionPreference = 'system';

export const REDUCED_MOTION_STORAGE_KEY = 'cv_reduced_motion';

export const REDUCED_MOTION_CHANGE_EVENT = 'cv-reduced-motion-change';

export function isReducedMotionPreference(
  value: unknown
): value is ReducedMotionPreference {
  return value === 'system' || value === 'reduce' || value === 'full';
}

export function readReducedMotionPreference(): ReducedMotionPreference {
  try {
    const raw = window.localStorage.getItem(REDUCED_MOTION_STORAGE_KEY);
    if (raw) {
      const parsed = safeJSONParse<ReducedMotionPreference | null>(raw, null);
      if (isReducedMotionPreference(parsed)) return parsed;
      if (isReducedMotionPreference(raw)) return raw;
    }
  } catch {
    return DEFAULT_REDUCED_MOTION;
  }
  return DEFAULT_REDUCED_MOTION;
}

function prefersReducedMotionOS(): boolean {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

export function resolveReducedMotion(
  preference: ReducedMotionPreference
): boolean {
  if (preference === 'reduce') return true;
  if (preference === 'full') return false;
  return prefersReducedMotionOS();
}

export function applyReducedMotion(preference: ReducedMotionPreference): void {
  const root = document.documentElement;
  if (preference === 'reduce') {
    root.setAttribute('data-reduced-motion', 'reduce');
  } else if (preference === 'full') {
    root.setAttribute('data-reduced-motion', 'full');
  } else {
    root.removeAttribute('data-reduced-motion');
  }
}
