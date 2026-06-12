import { PieceSymbol } from './chess';

export * from './chess';
export * from './history';

export type BoardMatrix = PieceSymbol[][];

export type FENString = string;

export interface ValidationResult {
  isValid: boolean;
  errorMessage: string | null;
}

/** Board style family a preset belongs to (drives 2D / 3D grouping). */
export type ThemeFamily = '2D' | '3D';

export interface ThemeConfig {
  name: string;
  light: string;
  dark: string;
  /** Board style family this preset renders as. Defaults to '2D' when absent. */
  family?: ThemeFamily;
  /** Curated "most-used" flag — surfaced in the compact editor settings panel. */
  popular?: boolean;
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

export interface BoardPreset {
  id: string;
  name: string;
  light: string;
  dark: string;
  isDefault?: boolean;
  isDeletable?: boolean;
  isEditable?: boolean;
}
