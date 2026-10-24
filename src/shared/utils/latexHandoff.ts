import { MAX_POSITION_LENGTH } from './fenParser';
import {
  LATEX_MAX_POSITIONS,
  safeJSONParse
} from '@chessviewer-org/chess-viewer';

export const LATEX_HANDOFF_KEY = 'cv_latex_incoming';

const FIELD_LIMIT = 500;

export interface StagedPosition {
  fen: string;
  flipped: boolean;
  caption: string;
}

export function stageLatexPositions(
  positions: ReadonlyArray<Partial<StagedPosition> & { fen: string }>
): void {
  try {
    window.sessionStorage.setItem(
      LATEX_HANDOFF_KEY,
      JSON.stringify(positions.slice(0, LATEX_MAX_POSITIONS))
    );
  } catch {
    return;
  }
}

export function consumeStagedPositions(): StagedPosition[] {
  try {
    const stored = window.sessionStorage.getItem(LATEX_HANDOFF_KEY);
    window.sessionStorage.removeItem(LATEX_HANDOFF_KEY);
    const parsed = safeJSONParse<unknown>(stored, null);
    if (!Array.isArray(parsed)) return [];

    const result: StagedPosition[] = [];
    for (const entry of parsed.slice(0, LATEX_MAX_POSITIONS)) {
      if (typeof entry !== 'object' || entry === null) continue;
      const { fen, flipped, caption } = entry as Record<string, unknown>;
      if (typeof fen !== 'string') continue;
      result.push({
        fen: fen.slice(0, MAX_POSITION_LENGTH),
        flipped: flipped === true,
        caption:
          typeof caption === 'string' ? caption.slice(0, FIELD_LIMIT) : ''
      });
    }
    return result;
  } catch {
    return [];
  }
}
