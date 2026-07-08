import { AdvancedFenConfig } from '@app-types';

export const BOARD_COLOR_KEYS = {
  LIGHT: 'chess-light-square',
  DARK: 'chess-dark-square'
} as const;

export const PERSIST_DEBOUNCE_MS = 350;

export const PIECE_SORT_OPTIONS = [
  { value: 'popular' as const, label: 'Most popular' },
  { value: 'name' as const, label: 'Name (A–Z)' }
];

export const ADVANCED_FEN_CONFIG: AdvancedFenConfig = {
  MAX_FENS: 10,
  DEFAULT_FENS: ['', '', ''],
  DEFAULT_INTERVAL: 3,
  INTERVAL_OPTIONS: [
    { value: 1, label: '1s' },
    { value: 2, label: '2s' },
    { value: 3, label: '3s' },
    { value: 5, label: '5s' },
    { value: 10, label: '10s' }
  ],
  TABS: {
    POSITIONS: 'positions',
    PREVIEW: 'preview',
    EXPORT: 'export'
  },
  STORAGE_KEYS: {
    HISTORY: 'advancedFENHistory',
    FAVORITES: 'advancedFENFavorites'
  }
};
