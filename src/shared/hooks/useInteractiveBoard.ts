import { useCallback, useEffect, useState } from 'react';

import { ChessBoard, isChessBoard, PieceSymbol } from '@app-types';

import {
  boardToFEN,
  createEmptyBoard,
  isBoardEmpty,
  logger,
  parseFEN,
  validateFEN
} from '@/shared/utils';

const MAX_HISTORY = 100;
const STARTING_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

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
  const [board, setBoard] = useState<ChessBoard>(() => createEmptyBoard());
  const [past, setPast] = useState<ChessBoard[]>([]);
  const [future, setFuture] = useState<ChessBoard[]>([]);
  const [metadata, setMetadata] = useState('w - - 0 1');

  useEffect(() => {
    try {
      if (initialFen && validateFEN(initialFen)) {
        const parts = initialFen.trim().split(/\s+/);
        if (parts.length > 1) {
          setMetadata(parts.slice(1).join(' '));
        }

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

      if (onFenChange) {
        onFenChange(`${boardToFEN(newBoard)} ${newMeta}`);
      }
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
      const newBoard = board.map((row) => [...row]) as ChessBoard;

      if (!isFromPalette && fromRow !== undefined && fromCol !== undefined) {
        const fromRowArr = newBoard[fromRow];
        if (fromRowArr) fromRowArr[fromCol] = '';
      }

      const toRowArr = newBoard[toRow];
      if (toRowArr) toRowArr[toCol] = piece;

      commitMove(newBoard);
    },
    [board, commitMove]
  );

  const handlePieceRemove = useCallback(
    (row: number, col: number) => {
      if (!board[row]?.[col]) return;

      const newBoard = board.map((r) => [...r]) as ChessBoard;
      const rowArr = newBoard[row];
      if (rowArr) rowArr[col] = '';
      commitMove(newBoard);
    },
    [board, commitMove]
  );

  const setPiece = useCallback(
    (row: number, col: number, piece: PieceSymbol) => {
      const newBoard = board.map((r) => [...r]) as ChessBoard;
      const rowArr = newBoard[row];
      if (rowArr) rowArr[col] = piece;
      commitMove(newBoard);
    },
    [board, commitMove]
  );

  const clearBoard = useCallback(() => {
    if (!isBoardEmpty(board)) {
      commitMove(createEmptyBoard());
    }
  }, [board, commitMove]);

  const resetBoard = useCallback(() => {
    const parsed = parseFEN(STARTING_FEN);
    if (isChessBoard(parsed) && boardToFEN(board) !== boardToFEN(parsed)) {
      setMetadata('w KQkq - 0 1');
      commitMove(parsed, 'w KQkq - 0 1');
    }
  }, [board, commitMove]);

  const syncFromFen = useCallback(
    (fen: string) => {
      if (!fen || !validateFEN(fen)) return;

      const parts = fen.trim().split(/\s+/);
      const newMeta = parts.length > 1 ? parts.slice(1).join(' ') : metadata;
      setMetadata(newMeta);

      if (fen.startsWith('8/8/8/8/8/8/8/8')) {
        if (!isBoardEmpty(board)) {
          setBoard(createEmptyBoard());
          setPast([]);
          setFuture([]);
        }
        return;
      }

      const parsedBoard = parseFEN(fen);
      if (
        isChessBoard(parsedBoard) &&
        boardToFEN(board) !== boardToFEN(parsedBoard)
      ) {
        setBoard(parsedBoard);
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

    if (onFenChange) {
      onFenChange(`${boardToFEN(previousBoard)} ${metadata}`);
    }
  }, [board, future, metadata, onFenChange, past]);

  const redo = useCallback(() => {
    const nextBoard = future[0];
    if (!nextBoard) return;

    setPast([...past, board]);
    setFuture(future.slice(1));
    setBoard(nextBoard);

    if (onFenChange) {
      onFenChange(`${boardToFEN(nextBoard)} ${metadata}`);
    }
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
