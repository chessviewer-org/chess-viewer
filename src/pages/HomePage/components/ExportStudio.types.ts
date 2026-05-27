/** Optional overrides applied per batch export run, bypassing saved defaults. */
export interface BatchExportOverrides {
  boardSize?: number;
  exportQuality?: number;
}

/** Slice of HomePage state passed down to ExportStudio for live preview and batch export. */
export interface HomeStateForExport {
  fen: string;
  pieceStyle: string;
  setPieceStyle: (style: string) => void;
  showCoords: boolean;
  setShowCoords: (show: boolean) => void;
  showCoordinateBorder: boolean;
  setShowCoordinateBorder: (show: boolean) => void;
  showThinFrame: boolean;
  setShowThinFrame: (show: boolean) => void;
  lightSquare: string;
  setLightSquare: (color: string) => void;
  darkSquare: string;
  setDarkSquare: (color: string) => void;
  exportQuality: number;
  setExportQuality: (quality: number) => void;
  boardSize: number;
  setBoardSize: (size: number) => void;
  flipped: boolean;
  handleBatchExport: (
    formats: string[],
    names?: string[],
    overrides?: BatchExportOverrides
  ) => Promise<void>;
}

/** A board color theme entry displayed in the theme carousel. */
export interface ThemeCard {
  id: string;
  name: string;
  light: string;
  dark: string;
  isSystem: boolean;
  rawId?: number;
  timestamp?: number;
}

/** In-memory draft of a user-created custom theme before it is persisted. */
export interface CustomThemeDraft {
  id: number;
  name: string;
  light: string;
  dark: string;
  timestamp: number;
}

/** Minimal shape expected when mapping persisted presets to draft objects. */
export interface ThemePresetLike {
  id: number;
  name: string;
  light: string;
  dark: string;
  timestamp: number;
}

export const THEMES_PER_PAGE = 24;
export const MAX_THEMES = 48;
