import { useCallback, useMemo, useRef, useState } from 'react';

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

  const notifyFenChange = useCallback(
    (newBoard: ChessBoard) => {
      if (onFenChange) {
        const positionFen = boardToFEN(newBoard);
        const fullFen = `${positionFen} ${metadataRef.current}`;
        onFenChange(fullFen);
      }
    },
    [onFenChange]
  );

  const syncFromFen = useCallback((fen: string) => {
    try {
      if (!fen || !validateFEN(fen)) return;

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
        notifyFenChange(newBoard);
        return newBoard;
      });
    },
    [notifyFenChange]
  );

  const handlePieceRemove = useCallback((row: number, col: number) => {
    setBoard((prevBoard) => {
      const newBoard = cloneBoard(prevBoard);
      if (row !== undefined && col !== undefined) {
        const targetRow = newBoard[row];
        if (targetRow !== undefined) {
          targetRow[col] = '';
        }
      }
      notifyFenChange(newBoard);
      return newBoard;
    });
  }, [notifyFenChange]);

  const clearBoard = useCallback(() => {
    setBoard((prevBoard) => {
      if (isBoardEmpty(prevBoard)) {
        return prevBoard;
      }
      const emptyBoard = createEmptyBoard();
      notifyFenChange(emptyBoard);
      return emptyBoard;
    });
  }, [notifyFenChange]);

  const resetBoard = useCallback(() => {
    const startingFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    metadataRef.current = 'w KQkq - 0 1';
    const parsedStarting = parseFEN(startingFen);
    if (!isChessBoard(parsedStarting)) {
      logger.error('useInteractiveBoard: resetBoard failed to parse starting FEN');
      return;
    }
    const startingBoard = parsedStarting;
    
    setBoard((prevBoard) => {
      if (boardToFEN(prevBoard) === boardToFEN(startingBoard)) {
        return prevBoard;
      }
      notifyFenChange(startingBoard);
      return startingBoard;
    });
  }, [notifyFenChange]);

  const setPiece = useCallback(
    (row: number, col: number, piece: PieceSymbol) => {
      setBoard((prevBoard) => {
        const newBoard = cloneBoard(prevBoard);
        if (row !== undefined && col !== undefined) {
          const targetRow = newBoard[row];
          if (targetRow !== undefined) {
            targetRow[col] = piece;
          }
        }
        notifyFenChange(newBoard);
        return newBoard;
      });
    },
    [notifyFenChange]
  );

  const currentFen = useMemo(() => {
    const positionFen = boardToFEN(board);
    return `${positionFen} ${metadataRef.current}`;
  }, [board]);

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
