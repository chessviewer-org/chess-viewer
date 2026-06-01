import { useEffect, useCallback, useMemo, useRef, useState } from 'react';

import { logger, parseFEN, validateFEN } from '@/utils';
import { boardToFEN, createEmptyBoard, isBoardEmpty } from '@/utils/boardUtils';

/**
 * Manages an interactive chess board with drag-and-drop piece editing.
 *
 * @param {string} initialFen - Starting FEN position
 * @param {function(string): void} onFenChange - Called whenever the position changes
 * @returns {Object} Board state and action handlers
 */
export function useInteractiveBoard(initialFen, onFenChange) {
  const pendingBoardRef = useRef(null);
  const [board, setBoard] = useState(() => {
    try {
      if (initialFen && validateFEN(initialFen)) {
        return parseFEN(initialFen);
      }
    } catch (err) {
      logger.error('Failed to parse initial FEN:', err);
    }
    return createEmptyBoard();
  });
  const lastGeneratedFenRef = useRef('');
  const lastExternalFenRef = useRef(initialFen);

  /**
   * Syncs the board state from a given FEN string.
   *
   * @param {string} fen - The FEN string to sync from
   */
  const syncFromFen = useCallback((fen) => {
    if (fen === lastGeneratedFenRef.current) {
      return;
    }
    if (fen === lastExternalFenRef.current) {
      return;
    }
    lastExternalFenRef.current = fen;
    try {
      if (fen === '8/8/8/8/8/8/8/8 w - - 0 1') {
        setBoard(createEmptyBoard());
        return;
      }
      if (fen && validateFEN(fen)) {
        const newBoard = parseFEN(fen);
        if (newBoard && newBoard.length === 8) {
          setBoard(newBoard);
        }
      }
    } catch (err) {
      logger.error('Failed to sync from FEN:', err);
    }
  }, []);
  /**
   * Notifies the external listener when the FEN changes.
   *
   * @param {string[][]} newBoard - The new board matrix
   */
  const notifyFenChange = useCallback(
    (newBoard) => {
      const positionFen = boardToFEN(newBoard);
      const fullFen = `${positionFen} w - - 0 1`;
      lastGeneratedFenRef.current = fullFen;
      if (onFenChange) {
        onFenChange(fullFen);
      }
    },
    [onFenChange]
  );
  /**
   * Handles dropping a piece onto a square.
   *
   * @param {string} piece - The piece character
   * @param {number} fromRow - The origin row (if moving)
   * @param {number} fromCol - The origin column (if moving)
   * @param {number} toRow - The destination row
   * @param {number} toCol - The destination column
   * @param {boolean} isFromPalette - Whether the piece came from the palette
   */
  const handlePieceDrop = useCallback(
    (piece, fromRow, fromCol, toRow, toCol, isFromPalette) => {
      setBoard((prevBoard) => {
        const newBoard = prevBoard.map((row) => [...row]);
        if (!isFromPalette && fromRow !== undefined && fromCol !== undefined) {
          newBoard[fromRow][fromCol] = '';
        }
        newBoard[toRow][toCol] = piece;
        pendingBoardRef.current = newBoard;
        return newBoard;
      });
    },
    []
  );

  /**
   * Removes a piece from the board.
   *
   * @param {number} row - The row to remove from
   * @param {number} col - The column to remove from
   */
  const handlePieceRemove = useCallback((row, col) => {
    setBoard((prevBoard) => {
      const newBoard = prevBoard.map((r) => [...r]);
      newBoard[row][col] = '';
      pendingBoardRef.current = newBoard;
      return newBoard;
    });
  }, []);

  useEffect(() => {
    if (pendingBoardRef.current !== null) {
      const boardToNotify = pendingBoardRef.current;
      pendingBoardRef.current = null;
      notifyFenChange(boardToNotify);
    }
  }, [board, notifyFenChange]);

  /**
   * Clears all pieces from the board.
   */
  const clearBoard = useCallback(() => {
    setBoard((prevBoard) => {
      if (isBoardEmpty(prevBoard)) {
        return prevBoard;
      }
      const emptyBoard = createEmptyBoard();
      const emptyFen = '8/8/8/8/8/8/8/8 w - - 0 1';
      lastGeneratedFenRef.current = emptyFen;
      lastExternalFenRef.current = emptyFen;
      if (onFenChange) {
        onFenChange(emptyFen);
      }
      return emptyBoard;
    });
  }, [onFenChange]);

  /**
   * Resets the board to the standard starting position.
   */
  const resetBoard = useCallback(() => {
    const startingFen =
      'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    const startingBoard = parseFEN(startingFen);
    lastGeneratedFenRef.current = startingFen;
    lastExternalFenRef.current = startingFen;
    setBoard(startingBoard);
    if (onFenChange) {
      onFenChange(startingFen);
    }
  }, [onFenChange]);

  /**
   * Sets a specific piece at a given row and column.
   *
   * @param {number} row - The target row
   * @param {number} col - The target column
   * @param {string} piece - The piece character
   */
  const setPiece = useCallback(
    (row, col, piece) => {
      setBoard((prevBoard) => {
        const newBoard = prevBoard.map((r) => [...r]);
        newBoard[row][col] = piece;
        notifyFenChange(newBoard);
        return newBoard;
      });
    },
    [notifyFenChange]
  );
  const currentFen = useMemo(() => {
    const positionFen = boardToFEN(board);
    return `${positionFen} w - - 0 1`;
  }, [board]);
  return {
    board,
    currentFen,
    handlePieceDrop,
    handlePieceRemove,
    clearBoard,
    resetBoard,
    setPiece,
    syncFromFen
  };
}
