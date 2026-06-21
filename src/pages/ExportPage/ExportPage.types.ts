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
