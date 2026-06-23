import { useRef, useState } from 'react';

import type {
  AdvancedFENInitialProps,
  BoardSizePreset,
  ExportFormat
} from './useAdvancedFEN.types';

/** Default physical board size in centimetres (matches ExportPage). */
const DEFAULT_BOARD_SIZE_CM = 8;

/** Initialises all visual and export settings state from props, with stable initial-value ref for position sync resets. */
export function useAdvancedSettingsState(props: AdvancedFENInitialProps) {
  const {
    pieceStyle: initialPieceStyle = 'cburnett',
    boardSize: initialBoardSize = DEFAULT_BOARD_SIZE_CM,
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
    fileNamesInput: initialFileName,
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
  const [exportQuality, setExportQuality] = useState(initialExportQuality);
  const [showCoordsLocal, setShowCoordsLocal] = useState(initialShowCoords);
  const [showCoordinateBorder, setShowCoordinateBorder] = useState(
    initialShowCoordinateBorder
  );
  const [showThinFrame, setShowThinFrame] = useState(initialShowThinFrame);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Multi-select output formats (mirrors ExportPage). At least one is always kept.
  const [selectedFormats, setSelectedFormats] = useState<ExportFormat[]>([
    'jpeg',
    'png'
  ]);

  // Board-size preset selector + free-form centimetre input (mirrors ExportPage).
  const [boardSizePreset, setBoardSizePreset] = useState<BoardSizePreset>(
    DEFAULT_BOARD_SIZE_CM
  );
  const [customBoardSizeInput, setCustomBoardSizeInput] = useState(
    String(DEFAULT_BOARD_SIZE_CM)
  );

  // Comma-separated per-format file names (mirrors ExportPage File Name field).
  const [fileNamesInput, setFileNamesInput] = useState(
    initialFileName === 'chess-board' ? '' : initialFileName
  );

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
    selectedFormats,
    setSelectedFormats,
    boardSizePreset,
    setBoardSizePreset,
    customBoardSizeInput,
    setCustomBoardSizeInput,
    fileNamesInput,
    setFileNamesInput
  };
}
