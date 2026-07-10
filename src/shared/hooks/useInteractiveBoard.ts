import { useCallback, useEffect, useState } from 'react';

import { ChessBoard, isChessBoard, PieceSymbol } from '@app-types';

import {
  boardToFEN,
  createEmptyBoard,
  isBoardEmpty,
  logger,
  movePiece,
  parseFEN,
  removePieceAt,
  setPieceAt,
  STARTING_FEN,
  validateFEN
} from '@utils';

// Constants
const MAX_HISTORY = 100;
const DEFAULT_META = 'w - - 0 1';
const EMPTY_PLACEMENT = boardToFEN(createEmptyBoard());

function metadataOf(fen: string, fallback = DEFAULT_META): string {
  const parts = fen.trim().split(/\s+/);
  return parts.length > 1 ? parts.slice(1).join(' ') : fallback;
}

// Types
export interface UseInteractiveBoardResult {
  board: ChessBoard;
  currentFen: string;
  handlePieceDrop: (
    piece: PieceSymbol,
    fromRow: number | undefined,
    fromCol: number | undefined,
    toRow: number,
    toCol: number,
    isFromPalette: boolean
  ) => void;
  handlePieceRemove: (row: number, col: number) => void;
  clearBoard: () => void;
  resetBoard: () => void;
  setPiece: (row: number, col: number, piece: PieceSymbol) => void;
  syncFromFen: (fen: string) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export function useInteractiveBoard(
  initialFen: string,
  onFenChange?: (fen: string) => void
): UseInteractiveBoardResult {
  // State
  const [board, setBoard] = useState<ChessBoard>(() => createEmptyBoard());
  const [past, setPast] = useState<ChessBoard[]>([]);
  const [future, setFuture] = useState<ChessBoard[]>([]);
  const [metadata, setMetadata] = useState(DEFAULT_META);

  useEffect(() => {
    try {
      if (initialFen && validateFEN(initialFen)) {
        setMetadata(metadataOf(initialFen));
        const parsed = parseFEN(initialFen);
        if (isChessBoard(parsed)) {
          setBoard(parsed);
          setPast([]);
          setFuture([]);
        }
      }
    } catch (err) {
      logger.error('Invalid initial FEN:', err);
    }
  }, [initialFen]);

  // Actions
  const commitMove = useCallback(
    (newBoard: ChessBoard, newMeta = metadata) => {
      setPast((prevPast) => {
        const updatedPast = [...prevPast, board];
        return updatedPast.length > MAX_HISTORY
          ? updatedPast.slice(1)
          : updatedPast;
      });
      setFuture([]);
      setBoard(newBoard);
      onFenChange?.(`${boardToFEN(newBoard)} ${newMeta}`);
    },
    [board, metadata, onFenChange]
  );

  const handlePieceDrop = useCallback(
    (
      piece: PieceSymbol,
      fromRow: number | undefined,
      fromCol: number | undefined,
      toRow: number,
      toCol: number,
      isFromPalette: boolean
    ) => {
      const next =
        !isFromPalette && fromRow !== undefined && fromCol !== undefined
          ? movePiece(board, [fromRow, fromCol], [toRow, toCol])
          : setPieceAt(board, [toRow, toCol], piece);
      commitMove(next as ChessBoard);
    },
    [board, commitMove]
  );

  const handlePieceRemove = useCallback(
    (row: number, col: number) => {
      if (!board[row]?.[col]) return;
      commitMove(removePieceAt(board, [row, col]) as ChessBoard);
    },
    [board, commitMove]
  );

  const setPiece = useCallback(
    (row: number, col: number, piece: PieceSymbol) => {
      commitMove(setPieceAt(board, [row, col], piece) as ChessBoard);
    },
    [board, commitMove]
  );

  const clearBoard = useCallback(() => {
    if (!isBoardEmpty(board)) commitMove(createEmptyBoard());
  }, [board, commitMove]);

  const resetBoard = useCallback(() => {
    const parsed = parseFEN(STARTING_FEN);
    if (isChessBoard(parsed) && boardToFEN(board) !== boardToFEN(parsed)) {
      const meta = metadataOf(STARTING_FEN);
      setMetadata(meta);
      commitMove(parsed, meta);
    }
  }, [board, commitMove]);

  const syncFromFen = useCallback(
    (fen: string) => {
      if (!fen || !validateFEN(fen)) return;
      setMetadata(metadataOf(fen, metadata));

      if (fen.startsWith(EMPTY_PLACEMENT)) {
        if (!isBoardEmpty(board)) {
          setBoard(createEmptyBoard());
          setPast([]);
          setFuture([]);
        }
        return;
      }

      const parsed = parseFEN(fen);
      if (isChessBoard(parsed) && boardToFEN(board) !== boardToFEN(parsed)) {
        setBoard(parsed);
        setPast([]);
        setFuture([]);
      }
    },
    [board, metadata]
  );

  const canUndo = past.length > 0;
  const canRedo = future.length > 0;

  const undo = useCallback(() => {
    const previousBoard = past[past.length - 1];
    if (!previousBoard) return;
    setPast(past.slice(0, -1));
    setFuture([board, ...future]);
    setBoard(previousBoard);
    onFenChange?.(`${boardToFEN(previousBoard)} ${metadata}`);
  }, [board, future, metadata, onFenChange, past]);

  const redo = useCallback(() => {
    const nextBoard = future[0];
    if (!nextBoard) return;
    setPast([...past, board]);
    setFuture(future.slice(1));
    setBoard(nextBoard);
    onFenChange?.(`${boardToFEN(nextBoard)} ${metadata}`);
  }, [board, future, metadata, onFenChange, past]);

  return {
    board,
    currentFen: `${boardToFEN(board)} ${metadata}`,
    handlePieceDrop,
    handlePieceRemove,
    clearBoard,
    resetBoard,
    setPiece,
    syncFromFen,
    undo,
    redo,
    canUndo,
    canRedo
  };
}
