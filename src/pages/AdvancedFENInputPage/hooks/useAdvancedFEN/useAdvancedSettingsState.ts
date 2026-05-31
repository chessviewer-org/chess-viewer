import { useRef, useState } from 'react';

import type {
  AdvancedFENInitialProps,
  ExportFormat
} from './useAdvancedFEN.types';

/** Initialises all visual and export settings state from props, with stable initial-value ref for position sync resets. */
export function useAdvancedSettingsState(props: AdvancedFENInitialProps) {
  const {
    pieceStyle: initialPieceStyle = 'cburnett',
    boardSize: initialBoardSize = 480,
    fileName: initialFileName = 'chess-board',
    exportQuality: initialExportQuality = 2,
    showCoords: initialShowCoords = true,
    showCoordinateBorder: initialShowCoordinateBorder = true,
    showThinFrame: initialShowThinFrame = false,
    lightSquare: initialLightSquare = '#f0d9b5',
    darkSquare: initialDarkSquare = '#b58863'
  } = props;

  const initialSettingsRef = useRef({
    pieceStyle: initialPieceStyle,
    boardSize: initialBoardSize,
    fileName: initialFileName,
    exportQuality: initialExportQuality,
    showCoords: initialShowCoords,
    showCoordinateBorder: initialShowCoordinateBorder,
    showThinFrame: initialShowThinFrame,
    lightSquare: initialLightSquare,
    darkSquare: initialDarkSquare
  });

  const [isFlipped, setIsFlipped] = useState(false);
  const [showCoordinates, setShowCoordinates] = useState(true);
  const [pieceStyle, setPieceStyle] = useState(initialPieceStyle);
  const [boardSize, setBoardSize] = useState(initialBoardSize);
  const [fileName, setFileName] = useState(initialFileName);
  const [exportQuality, setExportQuality] = useState(initialExportQuality);
  const [showCoordsLocal, setShowCoordsLocal] = useState(initialShowCoords);
  const [showCoordinateBorder, setShowCoordinateBorder] = useState(
    initialShowCoordinateBorder
  );
  const [showThinFrame, setShowThinFrame] = useState(initialShowThinFrame);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const [exportFormat, setExportFormat] = useState<ExportFormat>('png');

  return {
    initialLightSquare,
    initialDarkSquare,
    initialSettingsRef,
    isFlipped,
    setIsFlipped,
    showCoordinates,
    setShowCoordinates,
    pieceStyle,
    setPieceStyle,
    boardSize,
    setBoardSize,
    fileName,
    setFileName,
    exportQuality,
    setExportQuality,
    showCoordsLocal,
    setShowCoordsLocal,
    showCoordinateBorder,
    setShowCoordinateBorder,
    showThinFrame,
    setShowThinFrame,
    isExportModalOpen,
    setIsExportModalOpen,
    exportFormat,
    setExportFormat
  };
}
