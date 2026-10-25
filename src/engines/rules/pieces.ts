import { parseNamedCell } from '@/shared/utils/fairyCells';

export type Color = 'w' | 'b';

export interface Piece {
  color: Color | 'n';
  walk: string;
}

type Vector = readonly [number, number];

export interface Spec {
  leap: Vector[];
  ride: Vector[];
  hop: Vector[];
}

const symmetric = (a: number, b: number): Vector[] => {
  const seen = new Map<string, Vector>();
  for (const [x, y] of [
    [a, b],
    [b, a]
  ] as const)
    for (const sx of [-1, 1])
      for (const sy of [-1, 1])
        seen.set(`${sx * x},${sy * y}`, [sx * x, sy * y]);
  return [...seen.values()];
};

const leaper = (a: number, b: number): Spec => ({
  leap: symmetric(a, b),
  ride: [],
  hop: []
});
const rider = (a: number, b: number): Spec => ({
  leap: [],
  ride: symmetric(a, b),
  hop: []
});
const joined = (...parts: Spec[]): Spec => ({
  leap: parts.flatMap((part) => part.leap),
  ride: parts.flatMap((part) => part.ride),
  hop: parts.flatMap((part) => part.hop)
});

const ROOK = rider(1, 0);
const BISHOP = rider(1, 1);
const QUEEN = joined(ROOK, BISHOP);
const KNIGHT = leaper(1, 2);

export const SPECS: Record<string, Spec> = {
  K: joined(leaper(1, 0), leaper(1, 1)),
  Q: QUEEN,
  R: ROOK,
  B: BISHOP,
  S: KNIGHT,
  N: rider(1, 2),
  CR: rider(1, 3),
  ZR: rider(2, 3),
  GR: joined(rider(1, 2), rider(1, 3)),
  WR: ROOK,
  FR: BISHOP,
  AM: joined(QUEEN, KNIGHT),
  EM: joined(ROOK, KNIGHT),
  PR: joined(BISHOP, KNIGHT),
  GN: joined(KNIGHT, leaper(1, 3)),
  WE: leaper(1, 0),
  FE: leaper(1, 1),
  DA: leaper(2, 0),
  AL: leaper(2, 2),
  CA: leaper(1, 3),
  Z: leaper(2, 3),
  GI: leaper(1, 4),
  AN: leaper(3, 4),
  '15': leaper(1, 5),
  '16': leaper(1, 6),
  '24': leaper(2, 4),
  '25': leaper(2, 5),
  '35': leaper(3, 5),
  '36': leaper(3, 6),
  '37': leaper(3, 7),
  G: { leap: [], ride: [], hop: QUEEN.ride }
};

const pieces = new Map<string, Piece | null>();

export function pieceOf(cell: string): Piece | null {
  if (!cell) return null;
  const known = pieces.get(cell);
  if (known !== undefined) return known;
  const named = parseNamedCell(cell);
  const plain = /^(n?)([KQRBNPkqrbnp])$/.exec(cell);
  const letter = plain?.[2]?.toUpperCase();
  const piece: Piece | null = named
    ? { color: named.color, walk: named.walk }
    : plain && letter
      ? {
          color: plain[1] ? 'n' : plain[2] === letter ? 'w' : 'b',
          walk: letter === 'N' ? 'S' : letter
        }
      : null;
  pieces.set(cell, piece);
  return piece;
}

export const hasMoveRules = (cell: string) => {
  const piece = pieceOf(cell);
  return !!piece && (piece.walk === 'P' || piece.walk in SPECS);
};
