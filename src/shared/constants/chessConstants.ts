import {
  AdvancedFenConfig,
  BoardThemes,
  PieceSet,
  QualityPreset
} from '@app-types';

/** Canonical full-game starting position. */
export const STARTING_FEN =
  'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

/** Empty board (no pieces), white to move. */
export const EMPTY_FEN = '8/8/8/8/8/8/8/8 w - - 0 1';

export const PIECE_MAP: Record<string, string> = {
  wK: 'wK',
  wQ: 'wQ',
  wR: 'wR',
  wB: 'wB',
  wN: 'wN',
  wP: 'wP',
  bK: 'bK',
  bQ: 'bQ',
  bR: 'bR',
  bB: 'bB',
  bN: 'bN',
  bP: 'bP'
};

export const PIECE_SETS: PieceSet[] = [
  { id: 'alpha', name: 'Alpha' },
  { id: 'cardinal', name: 'Cardinal' },
  { id: 'california', name: 'California' },
  { id: 'cburnett', name: 'Classic (CBurnett)' },
  { id: 'companion', name: 'Companion' },
  { id: 'dubrovny', name: 'Dubrovny' },
  { id: 'fantasy', name: 'Fantasy' },
  { id: 'fresca', name: 'Fresca' },
  { id: 'gioco', name: 'Gioco' },
  { id: 'governor', name: 'Governor' },
  { id: 'horsey', name: 'Horsey' },
  { id: 'icpieces', name: 'IC Pieces' },
  { id: 'kosal', name: 'Kosal' },
  { id: 'leipzig', name: 'Leipzig' },
  { id: 'merida', name: 'Merida' },
  { id: 'maestro', name: 'Maestro' },
  { id: 'pirouetti', name: 'Pirouetti' },
  { id: 'pixel', name: 'Pixel' },
  { id: 'reillycraig', name: 'Reilly Craig' },
  { id: 'riohacha', name: 'Riohacha' },
  { id: 'spatial', name: 'Spatial' },
  { id: 'staunty', name: 'Staunty' },
  { id: 'tatiana', name: 'Tatiana' }
];

/**
 * Curated popularity ranking of piece-set ids (most → least used), used to
 * drive the "Most Popular" sort in the Board settings picker. Ids not listed
 * fall back behind the ranked ones, then alphabetically. Order reflects the
 * common Lichess defaults / community favourites — `cburnett` is the app
 * default, so it leads.
 */
export const PIECE_SET_POPULARITY: readonly string[] = [
  'cburnett',
  'merida',
  'alpha',
  'staunty',
  'maestro',
  'horsey',
  'fantasy',
  'leipzig',
  'pixel',
  'gioco',
  'governor',
  'tatiana',
  'dubrovny',
  'fresca',
  'cardinal',
  'icpieces',
  'companion',
  'california',
  'pirouetti',
  'kosal',
  'reillycraig',
  'spatial',
  'riohacha'
];

export const BOARD_THEMES: BoardThemes = {
  classic: { name: 'Classic', light: '#f0d9b5', dark: '#b58863' },
  brown: { name: 'Brown', light: '#f0d9b5', dark: '#946f51' },
  wood: { name: 'Wood', light: '#d4af7a', dark: '#8b4513' },
  sand: { name: 'Sand', light: '#f5deb3', dark: '#d2b48c' },
  slate: { name: 'Slate', light: '#d0d0d0', dark: '#4a4a4a' },
  marble: { name: 'Marble', light: '#e3e6e8', dark: '#6e7a8a' },
  blue: { name: 'Blue', light: '#dee3e6', dark: '#8ca2ad' },
  ocean: { name: 'Ocean', light: '#c9e4f5', dark: '#4a90a4' },
  green: { name: 'Green', light: '#ffffdd', dark: '#86a666' },
  forest: { name: 'Forest', light: '#d4e8d4', dark: '#2d6930' },
  mint: { name: 'Mint', light: '#e0f5e9', dark: '#6fb98f' },
  purple: { name: 'Purple', light: '#e8d5c7', dark: '#9f7ab9' },
  lavender: { name: 'Lavender', light: '#e6e6fa', dark: '#9370db' },
  red: { name: 'Red', light: '#ffe0c5', dark: '#c97866' },
  coral: { name: 'Coral', light: '#ffebcd', dark: '#ff7f50' },
  sunset: { name: 'Sunset', light: '#ffe4b5', dark: '#ff8c42' },
  pink: { name: 'Pink', light: '#ffd7e0', dark: '#d87093' },
  burgundy: { name: 'Burgundy', light: '#e8d0d0', dark: '#8b3a3a' },
  navy: { name: 'Navy', light: '#d9e3f0', dark: '#405d7f' },
  ice: { name: 'Ice', light: '#e8f4f8', dark: '#7eb8da' }
};

export const QUALITY_PRESETS: QualityPreset[] = [
  {
    value: 1,
    label: 'Print 1× (300 DPI)',
    description: 'Standard print resolution — 300 DPI at physical size',
    mode: 'print',
    forceCoordinateBorder: false,
    estimatedSize: '10-110 KB'
  },
  {
    value: 2,
    label: 'Print 2× (600 DPI)',
    description: 'High print resolution — 600 DPI at physical size',
    mode: 'print',
    forceCoordinateBorder: false,
    estimatedSize: '50-440 KB'
  },
  {
    value: 3,
    label: 'Social 3× (900 DPI)',
    description: 'Keeps board size, higher zoom quality — 900 DPI',
    mode: 'social',
    forceCoordinateBorder: true,
    estimatedSize: '170KB-1.5MB'
  },
  {
    value: 4,
    label: 'Max 4× (1200 DPI)',
    description: 'Keeps board size, maximum zoom quality — 1200 DPI',
    mode: 'social',
    forceCoordinateBorder: true,
    estimatedSize: '300KB-2.7MB'
  }
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
