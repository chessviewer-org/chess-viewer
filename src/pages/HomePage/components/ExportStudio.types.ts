export interface BatchExportOverrides {
  boardSize?: number;
  exportQuality?: number;
}

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

export interface ThemeCard {
  id: string;
  name: string;
  light: string;
  dark: string;
  isSystem: boolean;
  rawId?: number;
  timestamp?: number;
}

export interface CustomThemeDraft {
  id: number;
  name: string;
  light: string;
  dark: string;
  timestamp: number;
}

export interface ThemePresetLike {
  id: number;
  name: string;
  light: string;
  dark: string;
  timestamp: number;
}

export const THEMES_PER_PAGE = 24;
export const MAX_THEMES = 48;
