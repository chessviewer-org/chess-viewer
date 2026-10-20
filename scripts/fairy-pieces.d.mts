export type FairyRotation = 90 | 180 | 270;
export type PieceType = 'K' | 'Q' | 'R' | 'B' | 'N' | 'P';
export type BaseColor = 'w' | 'b';
export type FairyColor = BaseColor | 'n';

export const FAIRY_ROTATIONS: readonly FairyRotation[];
export const PIECE_TYPES: readonly PieceType[];
export const BASE_COLORS: readonly BaseColor[];
export const NEUTRAL_COLOR: 'n';

export function rotatedPiece(svg: string, rotation: FairyRotation): string;
export function neutralPiece(
  whiteSvg: string,
  blackSvg: string,
  rotation?: 0 | FairyRotation
): string;
export function fairyFileName(
  color: FairyColor,
  type: PieceType,
  rotation?: 0 | FairyRotation
): string;
export function fairyPiecesForSet(
  readBase: (name: string) => string
): Map<string, string>;
