export const FAIRY_DIR = 'fairypiece';

export type FairyColor = 'w' | 'b' | 'n';
export type FairyPieceType = 'K' | 'Q' | 'R' | 'B' | 'N' | 'P';
export type FairyRotation = 0 | 90 | 180 | 270;

export const FAIRY_ROTATIONS: readonly FairyRotation[] = [0, 90, 180, 270];
export const FAIRY_COLORS: readonly FairyColor[] = ['w', 'b', 'n'];
export const FAIRY_PIECE_TYPES: readonly FairyPieceType[] = [
  'K',
  'Q',
  'R',
  'B',
  'N',
  'P'
];

const COLOR_WORDS: Record<FairyColor, string> = {
  w: 'White',
  b: 'Black',
  n: 'Neutral'
};

const TYPE_WORDS: Record<FairyPieceType, string> = {
  K: 'King',
  Q: 'Queen',
  R: 'Rook',
  B: 'Bishop',
  N: 'Knight',
  P: 'Pawn'
};

export function fairyCode(
  color: FairyColor,
  type: FairyPieceType,
  rotation: FairyRotation
): string {
  return `${color}${type}${rotation === 0 ? '' : rotation}`;
}

export interface FairyBox {
  key: string;
  color: FairyColor;
  type: FairyPieceType;
  name: string;
  variants: string[];
}

export const FAIRY_BOXES: FairyBox[] = FAIRY_COLORS.flatMap((color) =>
  FAIRY_PIECE_TYPES.map((type) => ({
    key: fairyCode(color, type, 0),
    color,
    type,
    name: `${COLOR_WORDS[color]} ${TYPE_WORDS[type]}`,
    variants: FAIRY_ROTATIONS.map((rotation) =>
      fairyCode(color, type, rotation)
    )
  }))
);

export const FAIRY_PIECE_KEYS: string[] = FAIRY_BOXES.flatMap(
  (box) => box.variants
).filter((key) => !/^[wb][KQRBNP]$/.test(key));

export const FAIRY_PIECE_MAP: Record<string, string> = Object.fromEntries(
  FAIRY_PIECE_KEYS.map((key) => [key, `${key}.svg`])
);
