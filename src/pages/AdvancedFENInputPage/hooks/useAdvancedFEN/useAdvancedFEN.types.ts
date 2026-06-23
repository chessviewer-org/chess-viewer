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
    /** Output formats selected for this position (multi-select, mirrors ExportPage). */
    selectedFormats?: ExportFormat[];
  };
}

/** Supported output file formats for the advanced FEN export. */
export type ExportFormat = 'png' | 'jpeg' | 'svg';

/** Board render configuration passed to the export pipeline (downloadPNG/JPEG/SVG). */
export interface ExportConfigLike {
  fen: string;
  pieceStyle: string;
  boardSize: number;
  showCoords: boolean;
  showCoordinateBorder: boolean;
  showThinFrame: boolean;
  lightSquare: string;
  darkSquare: string;
  flipped: boolean;
  pieceImages: Record<string, HTMLImageElement>;
  exportQuality: number;
}

/** Print quality tiers — 1×–4× mapping to baseDPI × multiplier at physical size. */
export type ExportResolution = 1 | 2 | 3 | 4;

/** Preset physical board size options in centimetres, or free-form custom input. */
export type BoardSizePreset = 4 | 6 | 8 | 'custom';
