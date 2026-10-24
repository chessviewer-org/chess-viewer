import {
  EMPTY_FEN,
  boardOutlineWidth,
  generateDiagram,
  getPieceSVG,
  type DiagramOptions
} from '@chessviewer-org/chess-viewer';

import { parseNamedCell, fairyLetterSVG } from '@utils/fairyCells';
import { cellToFenPiece, parseCellCode } from '@utils/boardCells';
import { isFairyFEN, parseFEN } from '@utils/fenParser';
import {
  compositionSymbolSVG,
  isCompositionSymbol
} from '@utils/compositionSymbols';

/** The studio uses fixed problem-font artwork rather than the editor's selected set. */
export function generatePositionPreview(options: DiagramOptions): string {
  if (!isFairyFEN(options.fen)) return generateDiagram(options);
  const board = parseFEN(options.fen);
  const size = options.size ?? 400;
  const square = size / 8;
  const inset = boardOutlineWidth(size);
  const background = generateDiagram({
    ...options,
    fen: EMPTY_FEN,
    showCoords: false,
    showFrame: false
  });
  const glyph = (piece: string) =>
    getPieceSVG(piece)
      ?.replace(/^<svg[^>]*>/, '')
      .replace(/<\/svg>$/, '') ?? '';
  const pieces: string[] = [];
  board.forEach((rank, row) =>
    rank.forEach((cell, col) => {
      if (!cell) return;
      const code = parseCellCode(cell);
      const id = `cv-neutral-${row}-${col}`;
      const named = parseNamedCell(cell);
      const content =
        code && isCompositionSymbol(code.type)
          ? compositionSymbolSVG(code.type, code.color)
              .replace(/^<svg[^>]*>/, '')
              .replace(/<\/svg>$/, '')
              .replaceAll('symbol-fill', `symbol-fill-${row}-${col}`)
          : named && !named.definition.glyph
            ? fairyLetterSVG(named.color, named.walk)
                .replace(/^<svg[^>]*>/, '')
                .replace(/<\/svg>$/, '')
                .replaceAll('neutral-letter', `neutral-letter-${row}-${col}`)
            : code?.color === 'n'
              ? `<defs><clipPath id="${id}-w"><rect width="22.5" height="45"/></clipPath><clipPath id="${id}-b"><rect x="22.5" width="22.5" height="45"/></clipPath></defs><g clip-path="url(#${id}-w)">${glyph(code.type)}</g><g clip-path="url(#${id}-b)">${glyph(code.type.toLowerCase())}</g>`
              : glyph(cellToFenPiece(cell));
      const displayRow = options.flipped ? 7 - row : row;
      const displayCol = options.flipped ? 7 - col : col;
      const rotated = code?.rotation
        ? `<g transform="rotate(${code.rotation} 22.5 22.5)">${content}</g>`
        : content;
      const hatched =
        options.squarePattern === 'hatched' && (row + col) % 2 === 1;
      pieces.push(
        `<svg x="${inset + displayCol * square}" y="${inset + displayRow * square}" width="${square}" height="${square}" viewBox="0 0 45 45">${hatched ? `<g filter="url(#cv-halo)">${rotated}</g>` : rotated}</svg>`
      );
    })
  );
  return background.replace(/<\/svg>$/, `${pieces.join('')}</svg>`);
}
