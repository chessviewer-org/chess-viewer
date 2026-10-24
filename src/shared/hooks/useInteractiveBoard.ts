import { useCallback, useMemo, useState } from 'react';

import type { BoardCell, ChessBoard } from '@app-types';

import {
  serializePosition,
  positionContext,
  parseFEN,
  validateFEN
} from '@/shared/utils/fenParser';
import { createEmptyBoard, STARTING_FEN } from '@chessviewer-org/chess-viewer';
import { logger } from '@/shared/utils/logger';
import {
  boardsEqual,
  moveBoardCell,
  positionContextsEqual,
  setBoardCell
} from '@/components/interactions/Board/boardUpdates';

// Constants
const MAX_HISTORY = 100;
const DEFAULT_META = { fenMetadata: 'w - - 0 1' };
interface BoardSnapshot {
  board: ChessBoard;
  metadata: ReturnType<typeof positionContext>;
}

function metadataOf(fen: string) {
  return positionContext(fen);
}

function isValidFen(fen: string): boolean {
  return !!fen && validateFEN(fen);
}

function positionOf(fen: string): BoardSnapshot | null {
  try {
    if (isValidFen(fen)) {
      return { board: parseFEN(fen), metadata: metadataOf(fen) };
    }
  } catch (err) {
    logger.error('Invalid initial FEN:', err);
  }
  return null;
}

// Types
export interface UseInteractiveBoardResult {
  board: ChessBoard;
  currentFen: string;
  handlePieceDrop: (
    piece: BoardCell,
    fromRow: number | undefined,
    fromCol: number | undefined,
    toRow: number,
    toCol: number,
    isFromPalette: boolean
  ) => void;
  handlePieceRemove: (row: number, col: number) => void;
  clearBoard: () => void;
  resetBoard: () => void;
  setPiece: (row: number, col: number, piece: BoardCell) => void;
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
  const [{ board, metadata }, setPosition] = useState<BoardSnapshot>(
    () =>
      positionOf(initialFen) ?? {
        board: createEmptyBoard(),
        metadata: DEFAULT_META
      }
  );
  const [past, setPast] = useState<BoardSnapshot[]>([]);
  const [future, setFuture] = useState<BoardSnapshot[]>([]);
  const currentFen = useMemo(
    () => serializePosition(board, metadata),
    [board, metadata]
  );

  // Actions
  const commitMove = useCallback(
    (newBoard: ChessBoard, newMeta = metadata) => {
      if (
        boardsEqual(board, newBoard) &&
        positionContextsEqual(metadata, newMeta)
      )
        return;
      setPast((prevPast) => {
        const updatedPast = [...prevPast, { board, metadata }];
        return updatedPast.length > MAX_HISTORY
          ? updatedPast.slice(1)
          : updatedPast;
      });
      setFuture([]);
      setPosition({ board: newBoard, metadata: newMeta });
      onFenChange?.(serializePosition(newBoard, newMeta));
    },
    [board, metadata, onFenChange]
  );

  const handlePieceDrop = useCallback(
    (
      piece: BoardCell,
      fromRow: number | undefined,
      fromCol: number | undefined,
      toRow: number,
      toCol: number,
      isFromPalette: boolean
    ) => {
      if (
        isFromPalette
          ? board[toRow]?.[toCol] === piece
          : fromRow === toRow && fromCol === toCol
      )
        return;
      const next =
        !isFromPalette && fromRow !== undefined && fromCol !== undefined
          ? moveBoardCell(board, fromRow, fromCol, toRow, toCol)
          : setBoardCell(board, toRow, toCol, piece);
      commitMove(next);
    },
    [board, commitMove]
  );

  const handlePieceRemove = useCallback(
    (row: number, col: number) => {
      if (!board[row]?.[col]) return;
      commitMove(setBoardCell(board, row, col, ''));
    },
    [board, commitMove]
  );

  const setPiece = useCallback(
    (row: number, col: number, piece: BoardCell) => {
      if (board[row]?.[col] === piece) return;
      commitMove(setBoardCell(board, row, col, piece));
    },
    [board, commitMove]
  );

  const clearBoard = useCallback(() => {
    if (board.some((rank) => rank.some(Boolean)))
      commitMove(createEmptyBoard());
  }, [board, commitMove]);

  const resetBoard = useCallback(() => {
    commitMove(parseFEN(STARTING_FEN), metadataOf(STARTING_FEN));
  }, [commitMove]);

  const syncFromFen = useCallback(
    (fen: string) => {
      if (fen === currentFen) return;
      const next = positionOf(fen);
      if (next) commitMove(next.board, next.metadata);
    },
    [currentFen, commitMove]
  );

  const canUndo = past.length > 0;
  const canRedo = future.length > 0;

  const undo = useCallback(() => {
    const previousBoard = past[past.length - 1];
    if (!previousBoard) return;
    setPast(past.slice(0, -1));
    setFuture([{ board, metadata }, ...future]);
    setPosition(previousBoard);
    onFenChange?.(
      serializePosition(previousBoard.board, previousBoard.metadata)
    );
  }, [board, future, metadata, onFenChange, past]);

  const redo = useCallback(() => {
    const nextBoard = future[0];
    if (!nextBoard) return;
    setPast([...past, { board, metadata }]);
    setFuture(future.slice(1));
    setPosition(nextBoard);
    onFenChange?.(serializePosition(nextBoard.board, nextBoard.metadata));
  }, [board, future, metadata, onFenChange, past]);

  return {
    board,
    currentFen,
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
