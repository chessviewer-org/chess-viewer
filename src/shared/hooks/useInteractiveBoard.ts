import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { ChessBoard, isChessBoard, PieceSymbol } from '@app-types';

import { logger, parseFEN, validateFEN } from '@utils';
import { boardToFEN, createEmptyBoard, isBoardEmpty } from '@utils';

function cloneBoard(board: ChessBoard): ChessBoard {
  return board.map((row) => [...row] as PieceSymbol[]) as ChessBoard;
}

/** Maximum number of board states retained for undo/redo. */
const MAX_HISTORY = 100;

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
  /** Step back to the previous board state. No-op when nothing to undo. */
  undo: () => void;
  /** Re-apply a previously undone board state. No-op when nothing to redo. */
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

/**
 * Manages an interactive chess board with drag-and-drop piece editing.
 *
 * @param initialFen - Starting FEN position
 * @param onFenChange - Optional callback fired with the updated FEN whenever the position changes
 * @returns Board state and action handlers
 */
export function useInteractiveBoard(
  initialFen: string,
  onFenChange?: (fen: string) => void
): UseInteractiveBoardResult {
  const metadataRef = useRef<string>('w - - 0 1');

  // Keep the latest onFenChange without making the post-commit effect re-fire
  // when the parent passes a fresh callback identity.
  const onFenChangeRef = useRef(onFenChange);
  useEffect(() => {
    onFenChangeRef.current = onFenChange;
  }, [onFenChange]);

  // True only for board changes that ORIGINATE here (user drag/clear/reset/
  // undo/redo) and must be pushed up to the parent. Programmatic syncFromFen()
  // updates leave it false so a parent FEN is never echoed straight back.
  const pendingNotifyRef = useRef(false);
  // Skip the very first commit so the initial position is not re-emitted.
  const didMountRef = useRef(false);

  const initialBoard = useMemo<ChessBoard>(() => {
    try {
      if (initialFen && validateFEN(initialFen)) {
        const parts = initialFen.trim().split(/\s+/);
        if (parts.length > 1) {
          metadataRef.current = parts.slice(1).join(' ');
        }
        const parsed = parseFEN(initialFen);
        if (isChessBoard(parsed)) return parsed;
      }
    } catch (err: unknown) {
      logger.error('Failed to parse initial FEN:', err);
    }
    return createEmptyBoard();
    // Only the first-render value is used (seeds the history stack); later FEN
    // changes flow through syncFromFen, so this intentionally ignores updates.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Undo/redo timeline. `past` holds prior boards (oldest→newest), `present` is
  // the live board, `future` holds undone boards available for redo (next-redo
  // at the end). Every originating edit pushes onto `past` and clears `future`.
  const [{ past, present: board, future }, setHistory] = useState<{
    past: ChessBoard[];
    present: ChessBoard;
    future: ChessBoard[];
  }>(() => ({ past: [], present: initialBoard, future: [] }));

  const canUndo = past.length > 0;
  const canRedo = future.length > 0;

  // Commit a new present board, pushing the prior one onto the undo stack and
  // discarding the redo branch. `next` may be a value or an updater. Returning
  // the SAME reference from the updater is a no-op (no history entry).
  const commitBoard = useCallback(
    (next: ChessBoard | ((prev: ChessBoard) => ChessBoard)) => {
      setHistory((state) => {
        const resolved =
          typeof next === 'function' ? next(state.present) : next;
        if (resolved === state.present) return state;
        pendingNotifyRef.current = true;
        const past = [...state.past, state.present];
        if (past.length > MAX_HISTORY) past.shift();
        return { past, present: resolved, future: [] };
      });
    },
    []
  );

  // Replace the timeline with a parent-driven board. This clears undo/redo
  // because the new position is authoritative and not a local edit step.
  // Returning the same reference from the updater is a no-op.
  const replaceBoard = useCallback((next: (prev: ChessBoard) => ChessBoard) => {
    setHistory((state) => {
      const resolved = next(state.present);
      if (resolved === state.present) return state;
      return { past: [], present: resolved, future: [] };
    });
  }, []);

  const syncFromFen = useCallback(
    (fen: string) => {
      try {
        if (!fen || !validateFEN(fen)) return;

        // A parent-driven sync is authoritative: drop any not-yet-emitted local
        // edit so the resulting commit is never echoed back up as a "change".
        pendingNotifyRef.current = false;

        const parts = fen.trim().split(/\s+/);
        if (parts.length > 1) {
          metadataRef.current = parts.slice(1).join(' ');
        }

        if (fen.startsWith('8/8/8/8/8/8/8/8')) {
          replaceBoard((prevBoard) =>
            isBoardEmpty(prevBoard) ? prevBoard : createEmptyBoard()
          );
          return;
        }

        const parsedBoard = parseFEN(fen);
        if (isChessBoard(parsedBoard)) {
          replaceBoard((prevBoard) =>
            boardToFEN(prevBoard) === boardToFEN(parsedBoard)
              ? prevBoard
              : parsedBoard
          );
        }
      } catch (err: unknown) {
        logger.error('Failed to sync from FEN:', err);
      }
    },
    [replaceBoard]
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
      commitBoard((prevBoard) => {
        const newBoard = cloneBoard(prevBoard);
        if (!isFromPalette && fromRow !== undefined && fromCol !== undefined) {
          const originRow = newBoard[fromRow];
          if (originRow !== undefined && fromCol !== undefined) {
            originRow[fromCol] = '';
          }
        }
        if (toRow !== undefined && toCol !== undefined) {
          const targetRow = newBoard[toRow];
          if (targetRow !== undefined) {
            targetRow[toCol] = piece;
          }
        }
        return newBoard;
      });
    },
    [commitBoard]
  );

  const handlePieceRemove = useCallback(
    (row: number, col: number) => {
      commitBoard((prevBoard) => {
        if (!prevBoard[row]?.[col]) return prevBoard;
        const newBoard = cloneBoard(prevBoard);
        const targetRow = newBoard[row];
        if (targetRow !== undefined) {
          targetRow[col] = '';
        }
        return newBoard;
      });
    },
    [commitBoard]
  );

  const clearBoard = useCallback(() => {
    commitBoard((prevBoard) =>
      isBoardEmpty(prevBoard) ? prevBoard : createEmptyBoard()
    );
  }, [commitBoard]);

  const resetBoard = useCallback(() => {
    const startingFen =
      'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    const parsedStarting = parseFEN(startingFen);
    if (!isChessBoard(parsedStarting)) {
      logger.error(
        'useInteractiveBoard: resetBoard failed to parse starting FEN'
      );
      return;
    }
    const startingBoard = parsedStarting;
    metadataRef.current = 'w KQkq - 0 1';

    commitBoard((prevBoard) =>
      boardToFEN(prevBoard) === boardToFEN(startingBoard)
        ? prevBoard
        : startingBoard
    );
  }, [commitBoard]);

  const setPiece = useCallback(
    (row: number, col: number, piece: PieceSymbol) => {
      commitBoard((prevBoard) => {
        const newBoard = cloneBoard(prevBoard);
        const targetRow = newBoard[row];
        if (targetRow !== undefined) {
          targetRow[col] = piece;
        }
        return newBoard;
      });
    },
    [commitBoard]
  );

  // Step the timeline back one entry: present→future, last past→present.
  const undo = useCallback(() => {
    setHistory((state) => {
      if (state.past.length === 0) return state;
      const previous = state.past[state.past.length - 1];
      if (previous === undefined) return state;
      pendingNotifyRef.current = true;
      return {
        past: state.past.slice(0, -1),
        present: previous,
        future: [state.present, ...state.future]
      };
    });
  }, []);

  // Step the timeline forward one entry: present→past, first future→present.
  const redo = useCallback(() => {
    setHistory((state) => {
      if (state.future.length === 0) return state;
      const [next, ...rest] = state.future;
      if (next === undefined) return state;
      pendingNotifyRef.current = true;
      return {
        past: [...state.past, state.present],
        present: next,
        future: rest
      };
    });
  }, []);

  const currentFen = useMemo(() => {
    const positionFen = boardToFEN(board);
    return `${positionFen} ${metadataRef.current}`;
  }, [board]);

  // Push the FEN up to the parent AFTER commit — never from inside a setBoard
  // updater, which runs during render and triggers React's "Cannot update a
  // component while rendering a different component" warning. Only user-driven
  // edits (which set pendingNotifyRef) emit; the mount commit and parent-driven
  // syncFromFen() updates are skipped so a parent FEN is never echoed back.
  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }
    if (!pendingNotifyRef.current) return;
    pendingNotifyRef.current = false;
    onFenChangeRef.current?.(currentFen);
  }, [currentFen]);

  return useMemo(
    () => ({
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
    }),
    [
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
    ]
  );
}
