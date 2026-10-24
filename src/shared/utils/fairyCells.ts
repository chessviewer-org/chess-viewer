import {
  FAIRY_ATTRIBUTES,
  FAIRY_WALKS,
  type FairyWalk
} from '@constants/fairyCatalogue';
import type { BoardCell } from '@app-types';

const walks = new Map(FAIRY_WALKS.map((walk) => [walk.code, walk]));
const attributes = new Map(
  FAIRY_ATTRIBUTES.map((attribute) => [attribute.toLowerCase(), attribute])
);
const ORTHODOX: Record<string, string> = {
  K: 'K',
  Q: 'Q',
  R: 'R',
  B: 'B',
  S: 'N',
  P: 'P'
};

export interface NamedCell {
  color: 'w' | 'b' | 'n';
  walk: string;
  attributes: string[];
  definition: FairyWalk;
}

export function fairyWalk(code: string): FairyWalk | null {
  return walks.get(code.toUpperCase()) ?? null;
}

export function fairyAttribute(value: string): string | null {
  return attributes.get(value.toLowerCase()) ?? null;
}

export function namedCell(
  color: NamedCell['color'],
  walk: string,
  attrs: readonly string[] = []
): BoardCell {
  const code = walk.toUpperCase();
  if (!fairyWalk(code)) throw new Error(`Unknown Popeye piece code: ${walk}.`);
  const normalized = [
    ...new Set(
      attrs.map((attribute) => {
        const value = fairyAttribute(attribute);
        if (!value) throw new Error(`Unknown piece attribute: ${attribute}.`);
        return value;
      })
    )
  ].sort();
  const orthodox = ORTHODOX[code];
  if (orthodox && normalized.length === 0)
    return color === 'n'
      ? `n${orthodox}`
      : color === 'w'
        ? orthodox
        : orthodox.toLowerCase();
  return `${color}@${code}${normalized.length ? `~${normalized.join(',')}` : ''}`;
}

export function parseNamedCell(cell: BoardCell): NamedCell | null {
  if (cell[1] !== '@') return null;
  const match = /^([wbn])@([A-Z0-9]{1,2})(?:~([A-Za-z,]+))?$/.exec(cell);
  if (!match) return null;
  const definition = fairyWalk(match[2]!);
  if (!definition) return null;
  const attrs = match[3]?.split(',') ?? [];
  if (attrs.some((value) => !fairyAttribute(value))) return null;
  return {
    color: match[1] as NamedCell['color'],
    walk: definition.code,
    attributes: attrs,
    definition
  };
}

/** Only pieces without a conventional Popeye diagram glyph need letter artwork. */
export const FAIRY_LETTER_PIECE_MAP: Record<string, string> =
  Object.fromEntries(
    FAIRY_WALKS.filter((walk) => !walk.glyph).flatMap((walk) =>
      ['w', 'b', 'n'].map((color) => [`${color}@${walk.code}`, ''])
    )
  );

export function fairyLetterSVG(color: 'w' | 'b' | 'n', text: string): string {
  if (!/^[A-Z0-9]{1,2}$/.test(text)) throw new Error('Invalid fairy symbol.');
  const [fill, outline] =
    color === 'w'
      ? ['white', 'black']
      : color === 'b'
        ? ['black', 'white']
        : ['url(#neutral-letter)', 'gray'];
  const size = text.length === 1 ? 20 : 18;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180" viewBox="0 0 45 45"><defs><linearGradient id="neutral-letter" gradientUnits="userSpaceOnUse" x2="0" y2="45"><stop offset="50%" stop-color="white"/><stop offset="50%" stop-color="black"/></linearGradient></defs><text x="22.5" y="${22.5 + size * 0.36}" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="${size}" font-weight="700" letter-spacing="-0.5" fill="${fill}" stroke="${outline}" stroke-width="2" stroke-linejoin="round" paint-order="stroke">${text}</text></svg>`;
}
