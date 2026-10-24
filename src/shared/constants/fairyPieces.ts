export const FAIRY_DIR = 'fairypiece';

export type FairyColor = 'w' | 'b' | 'n';
export type CompositionSymbolType = 'C' | 'X' | 'S' | 'T';
export type FairyPieceType =
  'K' | 'Q' | 'R' | 'B' | 'N' | 'P' | CompositionSymbolType;
export type FairyRotation = 0 | 90 | 180 | 270;

export const FAIRY_ROTATIONS: readonly FairyRotation[] = [0, 90, 180, 270];
export const FAIRY_COLORS: readonly FairyColor[] = ['w', 'b', 'n'];
export const FAIRY_PIECE_TYPES: readonly FairyPieceType[] = [
  'K',
  'Q',
  'R',
  'B',
  'N',
  'P',
  'C',
  'X',
  'S',
  'T'
];

export function fairyCode(
  color: FairyColor,
  type: FairyPieceType,
  rotation: FairyRotation
): string {
  return `${color}${type}${rotation === 0 ? '' : rotation}`;
}
