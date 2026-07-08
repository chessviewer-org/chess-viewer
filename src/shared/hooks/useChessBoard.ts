import { useMemo } from 'react';
import type { ChessBoard } from '@app-types';
import { createEmptyBoard, logger, parseFEN } from '@/shared/utils';

export interface UseChessBoardResult {
  board: ChessBoard;
  error: string | null;
}

export function useChessBoard(fen: string): UseChessBoardResult {
  return useMemo(() => {
    if (!fen?.trim()) {
      return { board: createEmptyBoard(), error: 'FEN string is empty' };
    }

    try {
      return { board: parseFEN(fen), error: null };
    } catch (error: unknown) {
      logger.error('Failed to parse FEN:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Invalid FEN';
      return { board: createEmptyBoard(), error: errorMessage };
    }
  }, [fen]);
}
