import { PieceSymbol } from './chess';

export * from './chess';
export * from './history';

export type BoardMatrix = PieceSymbol[][];

export type FENString = string;

export interface ValidationResult {
  isValid: boolean;
  errorMessage: string | null;
}

interface ThemeConfig {
  name: string;
  light: string;
  dark: string;
}

export type BoardThemes = Record<string, ThemeConfig>;

type ExportMode = 'print' | 'social';

export interface QualityPreset {
  value: number;
  label: string;
  description: string;
  mode: ExportMode;
  forceCoordinateBorder: boolean;
  estimatedSize: string;
}

interface AdvancedFenIntervalOption {
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
