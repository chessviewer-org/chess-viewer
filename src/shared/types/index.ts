export * from '@chessviewer-org/chess-viewer';
import type { BoardMatrix } from '@chessviewer-org/chess-viewer';

// Types
interface AdvancedFenIntervalOption {
  value: number;
  label: string;
}

export interface AdvancedFenConfig {
  MAX_FENS: number;
  DEFAULT_FENS: string[];
  DEFAULT_INTERVAL: number;
  INTERVAL_OPTIONS: AdvancedFenIntervalOption[];
  TABS: {
    POSITIONS: string;
    PREVIEW: string;
    EXPORT: string;
  };
  STORAGE_KEYS: {
    HISTORY: string;
    FAVORITES: string;
  };
}

export type ChessBoard = BoardMatrix;
export function isChessBoard(b: unknown): b is ChessBoard {
  return (
    Array.isArray(b) &&
    b.length === 8 &&
    b.every((row) => Array.isArray(row) && row.length === 8)
  );
}
