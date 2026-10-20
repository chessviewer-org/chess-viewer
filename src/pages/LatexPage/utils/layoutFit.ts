import type {
  LatexBoardSize,
  LatexPackage
} from '@chessviewer-org/chess-viewer';
import { LATEX_COLUMN_RANGE } from '@chessviewer-org/chess-viewer';
import type { StudioSettings } from './latexProject';

const PT_TO_MM = 25.4 / 72;
const COLUMN_GAP_RATIO = 0.02;
const STANDALONE_WIDTH_MM = 170;
const ARTICLE_TEXT_WIDTH_PT = 345;
const MOVER_MARKER_SQUARES = 1.2;

const PAPER_WIDTH_MM = { a4: 210, a5: 148, letter: 216 } as const;

const BOARD_WIDTH_PT: Record<LatexPackage, Record<LatexBoardSize, number>> = {
  skak: { tiny: 81.6, small: 121.5, normal: 161.4, large: 241.1 },
  chessboard: { tiny: 99.6, small: 149.4, normal: 199.2, large: 298.8 },
  diagram: { tiny: 103.2, small: 103.2, normal: 119.1, large: 135 }
};

const CHESSBOARD_SQUARE_PT: Record<LatexBoardSize, number> = {
  tiny: 10,
  small: 15,
  normal: 20,
  large: 30
};

export interface FitReport {
  boardMm: number;
  cellMm: number;
  fits: boolean;
  maxColumns: number;
}

function textWidthMm(settings: StudioSettings): number {
  if (settings.mode === 'standalone') return STANDALONE_WIDTH_MM;
  if (settings.mode === 'snippet') return ARTICLE_TEXT_WIDTH_PT * PT_TO_MM;
  return PAPER_WIDTH_MM[settings.paper] - settings.marginMm * 2;
}

function cellWidthMm(textMm: number, columns: number): number {
  return (textMm * (1 - COLUMN_GAP_RATIO * (columns - 1))) / columns;
}

export function boardWidthMm(settings: StudioSettings): number {
  const base = BOARD_WIDTH_PT[settings.latexPackage][settings.boardSize];
  const mover =
    settings.latexPackage === 'chessboard' && settings.showMover
      ? CHESSBOARD_SQUARE_PT[settings.boardSize] * MOVER_MARKER_SQUARES
      : 0;
  return (base + mover) * PT_TO_MM;
}

export function estimateFit(settings: StudioSettings): FitReport {
  const textMm = textWidthMm(settings);
  const boardMm = boardWidthMm(settings);
  let maxColumns = 0;
  for (
    let columns = LATEX_COLUMN_RANGE.min;
    columns <= LATEX_COLUMN_RANGE.max;
    columns++
  ) {
    if (boardMm <= cellWidthMm(textMm, columns)) maxColumns = columns;
  }

  const cellMm = cellWidthMm(textMm, settings.columns);
  return { boardMm, cellMm, fits: boardMm <= cellMm, maxColumns };
}
