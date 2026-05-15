export type FENString = string;

export type PieceSymbol =
  | 'p' | 'n' | 'b' | 'r' | 'q' | 'k'
  | 'P' | 'N' | 'B' | 'R' | 'Q' | 'K'
  | '';

export type BoardMatrix = PieceSymbol[][];

export type PieceColor = 'white' | 'black';
export type FenActiveColor = 'w' | 'b';

export interface PieceStats {
  pawns: number;
  knights: number;
  bishops: number;
  rooks: number;
  queens: number;
  kings: number;
}

export interface PositionStats {
  white: PieceStats;
  black: PieceStats;
}

export interface ValidationResult {
  isValid: boolean;
  errorMessage: string | null;
}

export interface ThemeConfig {
  name: string;
  light: string;
  dark: string;
}

export type BoardThemes = Record<string, ThemeConfig>;

export type ExportMode = 'print' | 'social';

export interface QualityPreset {
  value: number;
  label: string;
  description: string;
  mode: ExportMode;
  forceCoordinateBorder: boolean;
  estimatedSize: string;
}

export interface ExportModeConfig {
  baseDPI?: number;
  maxPixels: number;
  preservePhysicalSize: boolean;
  forceCoordinateBorder?: boolean;
  description: string;
  fixedBoardPixels?: number;
}

export interface AdvancedFenIntervalOption {
  value: number;
  label: string;
}

export interface AdvancedFenConfig {
  MAX_FENS: number;
  DEFAULT_FENS: string[];
  DEFAULT_INTERVAL: number;
  INTERVAL_OPTIONS: AdvancedFenIntervalOption[];
  TABS: {
    POSITIONS: string;
    PREVIEW: string;
    EXPORT: string;
  };
  STORAGE_KEYS: {
    HISTORY: string;
    FAVORITES: string;
  };
}

export interface PieceSet {
  id: string;
  name: string;
}
