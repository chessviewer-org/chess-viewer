import { useMemo } from 'react';

import { ChessBoard, isChessBoard } from '@app-types/chess';

import { logger, parseFEN } from '@utils';
import { createEmptyBoard } from '@utils/boardUtils';
import { FENParseError } from '@utils/fenParser';

export interface UseChessBoardResult {
  board: ChessBoard;
  error: string | null;
}

/**
 * Parses a FEN string into a 2D board array for display.
 * Utilizes memoization to prevent unnecessary re-parses.
 *
 * @param fen - The FEN string to parse
 * @returns Object containing the 8x8 board matrix and an error string if parsing failed
 */
export function useChessBoard(fen: string): UseChessBoardResult {
  return useMemo(() => {
    if (!fen || typeof fen !== 'string' || fen.trim() === '') {
      return { board: createEmptyBoard(), error: 'FEN string is empty' };
    }
    try {
      const parsed = parseFEN(fen);
      if (!isChessBoard(parsed)) {
        return { board: createEmptyBoard(), error: 'Parsed board has unexpected structure' };
      }
      return { board: parsed, error: null };
    } catch (error) {
      if (error instanceof FENParseError) {
        return { board: createEmptyBoard(), error: error.message };
      }
      logger.error('Failed to parse FEN in useChessBoard:', error);
      return { board: createEmptyBoard(), error: 'An unexpected error occurred while parsing FEN' };
    }
  }, [fen]);
}
