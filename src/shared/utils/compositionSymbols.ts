import type {
  CompositionSymbolType,
  FairyColor,
  FairyRotation
} from '@constants/fairyPieces';

/** Geometric diagram symbols in Joost de Heer's FFEN, without implied walks.
 * https://www.janko.at/Retros/d.htm#Fairy_FEN
 */
export function isCompositionSymbol(
  type: string
): type is CompositionSymbolType {
  return type === 'C' || type === 'X' || type === 'S' || type === 'T';
}

/** Circles, crosses and squares look the same after any quarter turn. */
export function isTurnSymmetric(type: string): boolean {
  return type === 'C' || type === 'X' || type === 'S';
}

const SHAPES: Record<CompositionSymbolType, string> = {
  C: '<circle cx="22.5" cy="22.5" r="11.5"/>',
  X: '<path d="m12 8 10.5 10.5L33 8l4 4-10.5 10.5L37 33l-4 4-10.5-10.5L12 37l-4-4 10.5-10.5L8 12z"/>',
  S: '<rect x="11" y="11" width="23" height="23"/>',
  T: '<path d="m22.5 8 14 26h-28z"/>'
};

export function compositionSymbolSVG(
  type: CompositionSymbolType,
  color: FairyColor,
  rotation: FairyRotation = 0
): string {
  const fill =
    color === 'n' ? 'url(#symbol-fill)' : color === 'w' ? 'white' : 'black';
  const defs =
    color === 'n'
      ? '<defs><linearGradient id="symbol-fill"><stop offset="50%" stop-color="white"/><stop offset="50%" stop-color="black"/></linearGradient></defs>'
      : '';
  // The white halo and black edge stay legible on either board colour.
  const shape = `<g fill="${fill}" stroke-linejoin="round"><g stroke="white" stroke-width="3.5">${SHAPES[type]}</g><g stroke="black" stroke-width="1.5">${SHAPES[type]}</g></g>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180" viewBox="0 0 45 45">${defs}${rotation ? `<g transform="rotate(${rotation} 22.5 22.5)">${shape}</g>` : shape}</svg>`;
}
