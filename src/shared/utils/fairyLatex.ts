import {
  boardToFEN as standardPlacement,
  generateLatexDocument,
  indicesToSquare,
  escapeLatex,
  type LatexDocumentConfig
} from '@chessviewer-org/chess-viewer';

import { baseCells, parseCellCode } from './boardCells';
import { parseNamedCell } from './fairyCells';
import { compositionCaption } from './compositionCaption';
import { isFairyFEN, parseFEN, positionContext } from './fenParser';

const DIAGRAM_TYPES = {
  K: 'K',
  Q: 'D',
  R: 'T',
  B: 'L',
  N: 'S',
  P: 'B'
} as const;
const DIAGRAM_TURNS = { 0: '', 90: 'R', 180: 'U', 270: 'L' } as const;

/** diagram.sty's documented \pieces syntax supports neutral and rotated glyphs.
 * https://ctan.org/pkg/chess-problem-diagrams
 */
export function fairyDiagramPieces(fen: string): string {
  const entries: string[] = [];
  const fields: string[] = [];
  const counts = { w: 0, b: 0, n: 0 };
  parseFEN(fen).forEach((rank, row) =>
    rank.forEach((cell, col) => {
      if (!cell) return;
      const code = parseCellCode(cell) ?? {
        color: cell === cell.toUpperCase() ? 'w' : 'b',
        type: cell.toUpperCase() as keyof typeof DIAGRAM_TYPES,
        rotation: 0
      };
      counts[code.color]++;
      const named = parseNamedCell(cell);
      if (named && !named.definition.glyph) {
        fields.push(
          `{${named.color}${named.walk}}${indicesToSquare(row, col)}`
        );
        return;
      }
      const color = code.color === 'b' ? 's' : code.color;
      entries.push(
        `${color}${DIAGRAM_TYPES[code.type]}${DIAGRAM_TURNS[code.rotation]}${indicesToSquare(row, col)}`
      );
    })
  );
  return `\\pieces[${counts.w}+${counts.b}+${counts.n}]{${entries.join(', ')}}${fields.length ? `\n\\fieldtext{${fields.join(', ')}}` : ''}`;
}

export function generatePositionLatex(config: LatexDocumentConfig): string {
  if (!config.positions.some((position) => isFairyFEN(position.fen)))
    return generateLatexDocument(config);
  if (config.latexPackage !== 'diagram')
    throw new Error('Fairy positions require the diagram LaTeX package.');
  const positions = config.positions.map((position) => ({
    ...position,
    fen: [
      standardPlacement(baseCells(parseFEN(position.fen))),
      positionContext(position.fen).fenMetadata
    ].join(' ')
  }));
  const template = generateLatexDocument({ ...config, positions });
  let index = 0;
  return template.replace(/\\fen\[[^\]]*\]\{[^}]*\}/g, (command) => {
    const original = config.positions[index++];
    return original && isFairyFEN(original.fen)
      ? [
          fairyDiagramPieces(original.fen),
          ...(compositionCaption(original.fen).length
            ? [
                `\\remark{${escapeLatex([original.remark ?? '', ...compositionCaption(original.fen)].filter(Boolean).join('; '))}}`
              ]
            : [])
        ].join('\n')
      : command;
  });
}
