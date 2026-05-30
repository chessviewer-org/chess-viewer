import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { ChessBoard, isChessBoard, PieceSymbol } from '@app-types/chess';

import { logger, parseFEN, validateFEN } from '@utils';
import { boardToFEN, createEmptyBoard, isBoardEmpty } from '@utils/boardUtils';

function cloneBoard(board: ChessBoard): ChessBoard {
  return board.map((row) => [...row] as PieceSymbol[]) as ChessBoard;
}

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

  const [board, setBoard] = useState<ChessBoard>(() => {
    try {
      if (initialFen && validateFEN(initialFen)) {
        const parts = initialFen.trim().split(/\s+/);
        if (parts.length > 1) {
          metadataRef.current = parts.slice(1).join(' ');
        }
        const parsed = parseFEN(initialFen);
        if (isChessBoard(parsed)) return parsed;
      }
    } catch (err) {
      logger.error('Failed to parse initial FEN:', err);
    }
    return createEmptyBoard();
  });

  // Keep the latest onFenChange without making the post-commit effect re-fire
  // when the parent passes a fresh callback identity.
  const onFenChangeRef = useRef(onFenChange);
  useEffect(() => {
    onFenChangeRef.current = onFenChange;
  }, [onFenChange]);

  // True only for board changes that ORIGINATE here (user drag/clear/reset) and
  // must be pushed up to the parent. Programmatic syncFromFen() updates leave it
  // false so a parent-driven FEN is never echoed straight back (feedback loop).
  const pendingNotifyRef = useRef(false);
  // Skip the very first commit so the initial position is not re-emitted.
  const didMountRef = useRef(false);

  const syncFromFen = useCallback((fen: string) => {
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
        setBoard((prevBoard) => {
          if (isBoardEmpty(prevBoard)) return prevBoard;
          return createEmptyBoard();
        });
        return;
      }

      const parsedBoard = parseFEN(fen);
      if (isChessBoard(parsedBoard)) {
        setBoard((prevBoard) => {
          if (boardToFEN(prevBoard) === boardToFEN(parsedBoard)) {
            return prevBoard;
          }
          return parsedBoard;
        });
      }
    } catch (err) {
      logger.error('Failed to sync from FEN:', err);
    }
  }, []);

  const handlePieceDrop = useCallback(
    (
      piece: PieceSymbol,
      fromRow: number | undefined,
      fromCol: number | undefined,
      toRow: number,
      toCol: number,
      isFromPalette: boolean
    ) => {
      pendingNotifyRef.current = true;
      setBoard((prevBoard) => {
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
    []
  );

  const handlePieceRemove = useCallback((row: number, col: number) => {
    pendingNotifyRef.current = true;
    setBoard((prevBoard) => {
      const newBoard = cloneBoard(prevBoard);
      if (row !== undefined && col !== undefined) {
        const targetRow = newBoard[row];
        if (targetRow !== undefined) {
          targetRow[col] = '';
        }
      }
      return newBoard;
    });
  }, []);

  const clearBoard = useCallback(() => {
    setBoard((prevBoard) => {
      if (isBoardEmpty(prevBoard)) {
        return prevBoard;
      }
      // Only flag a notify when the board actually changed.
      pendingNotifyRef.current = true;
      return createEmptyBoard();
    });
  }, []);

  const resetBoard = useCallback(() => {
    const startingFen =
      'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    metadataRef.current = 'w KQkq - 0 1';
    const parsedStarting = parseFEN(startingFen);
    if (!isChessBoard(parsedStarting)) {
      logger.error(
        'useInteractiveBoard: resetBoard failed to parse starting FEN'
      );
      return;
    }
    const startingBoard = parsedStarting;

    setBoard((prevBoard) => {
      if (boardToFEN(prevBoard) === boardToFEN(startingBoard)) {
        return prevBoard;
      }
      pendingNotifyRef.current = true;
      return startingBoard;
    });
  }, []);

  const setPiece = useCallback(
    (row: number, col: number, piece: PieceSymbol) => {
      pendingNotifyRef.current = true;
      setBoard((prevBoard) => {
        const newBoard = cloneBoard(prevBoard);
        if (row !== undefined && col !== undefined) {
          const targetRow = newBoard[row];
          if (targetRow !== undefined) {
            targetRow[col] = piece;
          }
        }
        return newBoard;
      });
    },
    []
  );

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
      syncFromFen
    }),
    [
      board,
      currentFen,
      handlePieceDrop,
      handlePieceRemove,
      clearBoard,
      resetBoard,
      setPiece,
      syncFromFen
    ]
  );
}
