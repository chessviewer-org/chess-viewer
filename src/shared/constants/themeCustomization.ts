import { BoardPreset } from '@app-types';

export const MAX_TOTAL_PRESETS = 80;
export const STANDARD_PRESETS_COUNT = 19;
export const RANK_GUTTER = 20;
export const BOARD_SIZE_EXPR = 'min(48vh, 40vw, 420px)';
export const CELL_SIZE_EXPR = `calc(${BOARD_SIZE_EXPR} / 8)`;

export const STORAGE_KEYS = {
  PRESETS: 'chess-diagram-presets',
  SETTINGS: 'chess-diagram-settings',
  LIGHT_SQUARE: 'chess-light-square',
  DARK_SQUARE: 'chess-dark-square'
} as const;

export const WOOD_PRESET: BoardPreset = {
  id: 'wood-default',
  name: 'Wood',
  light: '#d4af7a',
  dark: '#8b4513',
  isDefault: true,
  isDeletable: false,
  isEditable: false
};
