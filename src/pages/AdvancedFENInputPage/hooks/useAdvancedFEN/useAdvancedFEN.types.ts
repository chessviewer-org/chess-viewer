/** Optional initial overrides forwarded to useAdvancedFEN when the page is mounted with preset values. */
export interface AdvancedFENInitialProps {
  pieceStyle?: string;
  boardSize?: number;
  fileName?: string;
  exportQuality?: number;
  showCoords?: boolean;
  showCoordinateBorder?: boolean;
  showThinFrame?: boolean;
  lightSquare?: string;
  darkSquare?: string;
}

/** Live state of an in-progress batch or single export operation. */
export interface ExportState {
  isExporting: boolean;
  progress: number;
  currentFormat: string;
  status: string;
}

/** Per-FEN visual and export settings keyed by FEN string, persisted to localStorage. */
export interface PositionSettings {
  [fen: string]: {
    pieceStyle?: string;
    boardSize?: number;
    fileName?: string;
    exportQuality?: number;
    showCoords?: boolean;
    showCoordinateBorder?: boolean;
    showThinFrame?: boolean;
    isFlipped?: boolean;
    showCoordinates?: boolean;
    lightSquare?: string;
    darkSquare?: string;
    exportFormat?: 'png' | 'jpeg' | 'svg';
  };
}

/** Supported output file formats for the advanced FEN export. */
export type ExportFormat = 'png' | 'jpeg' | 'svg';
