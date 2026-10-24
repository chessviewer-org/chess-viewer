import {
  boardToFEN as standardPlacement,
  generateLatexDocument,
  indicesToSquare,
  escapeLatex,
  type LatexDocumentConfig
} from '@chessviewer-org/chess-viewer';

import { baseCells, parseCellCode } from './boardCells';
import type { CellCode } from './boardCells';
import type { CompositionSymbolType } from '@constants/fairyPieces';
import { isCompositionSymbol } from './compositionSymbols';
import { parseNamedCell } from './fairyCells';
import { compositionCaption } from './compositionCaption';
import { isFairyFEN, parseFEN, positionContext } from './fenParser';
import { standInBoard } from './standInGlyphs';

const DIAGRAM_TYPES = {
  K: 'K',
  Q: 'D',
  R: 'T',
  B: 'L',
  N: 'S',
  P: 'B'
} as const;
const DIAGRAM_TURNS = { 0: '', 90: 'R', 180: 'U', 270: 'L' } as const;

const MARKER_POINTS: Record<Exclude<CompositionSymbolType, 'C'>, string> = {
  X: '(12,8)(22.5,18.5)(33,8)(37,12)(26.5,22.5)(37,33)(33,37)(22.5,26.5)(12,37)(8,33)(18.5,22.5)(8,12)',
  S: '(11,11)(34,11)(34,34)(11,34)',
  T: '(22.5,37)(36.5,11)(8.5,11)'
};
const MARKER_HALVES: Record<CompositionSymbolType, string> = {
  C: '\\moveto(22.5,11)\\circlearc{22.5}{22.5}{11.5}{-90}{90}\\closepath\\fillpath',
  X: '\\polygon*(22.5,18.5)(33,8)(37,12)(26.5,22.5)(37,33)(33,37)(22.5,26.5)',
  S: '\\polygon*(22.5,11)(34,11)(34,34)(22.5,34)',
  T: '\\polygon*(22.5,37)(36.5,11)(22.5,11)'
};

/** Use drawn geometry: diagram.sty's X and S denote different fairy walks. */
function diagramMarker(
  code: CellCode & { type: CompositionSymbolType }
): string {
  const fill =
    code.type === 'C'
      ? '\\put(22.5,22.5){\\circle*{23}}'
      : `\\polygon*${MARKER_POINTS[code.type]}`;
  const outline =
    code.type === 'C'
      ? '\\put(22.5,22.5){\\circle{23}}'
      : `\\polygon${MARKER_POINTS[code.type]}`;
  const picture = `\\begingroup\\setlength{\\unitlength}{.04em}\\begin{picture}(45,45)\\color{${code.color === 'b' ? 'black' : 'white'}}${fill}${code.color === 'n' ? `\\color{black}${MARKER_HALVES[code.type]}` : ''}\\color{black}\\linethickness{.06em}${outline}\\end{picture}\\endgroup`;
  return code.rotation
    ? `\\rotatebox[origin=c]{-${code.rotation}}{${picture}}`
    : picture;
}

/** diagram.sty's documented \pieces syntax supports neutral and rotated glyphs.
 * https://ctan.org/pkg/chess-problem-diagrams
 */
export function fairyDiagramPieces(fen: string): string {
  const entries: string[] = [];
  const fields: string[] = [];
  const counts = { w: 0, b: 0, n: 0 };
  standInBoard(parseFEN(fen)).forEach((rank, row) =>
    rank.forEach((cell, col) => {
      if (!cell) return;
      const code = parseCellCode(cell) ?? {
        color: cell === cell.toUpperCase() ? 'w' : 'b',
        type: cell.toUpperCase() as keyof typeof DIAGRAM_TYPES,
        rotation: 0
      };
      const named = parseNamedCell(cell);
      if (!isCompositionSymbol(code.type) || named) counts[code.color]++;
      if (isCompositionSymbol(code.type)) {
        fields.push(
          `{${diagramMarker({ ...code, type: code.type })}}${indicesToSquare(row, col)}`
        );
        return;
      }
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
  let template = generateLatexDocument({ ...config, positions });
  const hasMarkers = config.positions.some((position) =>
    parseFEN(position.fen).some((rank) =>
      rank.some((cell) => {
        const code = parseCellCode(cell);
        return code && isCompositionSymbol(code.type);
      })
    )
  );
  if (hasMarkers) {
    const setup = ['pict2e', 'color', 'graphicx']
      .filter((name) => !template.includes(`\\usepackage{${name}}`))
      .map((name) => `\\usepackage{${name}}`)
      .join('\n');
    template = template.replace(
      /(\\usepackage(?:\[[^\]]*\])?\{diagram\})/,
      `$1\n${setup}`
    );
  }
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
