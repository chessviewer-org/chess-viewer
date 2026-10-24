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

const SVG_OPEN =
  '<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180" viewBox="0 0 45 45">';
const LETTER_INKS = {
  w: { fill: 'white', edge: 'black', body: 1.2, outline: 3 },
  b: { fill: 'black', edge: 'white', body: 1.6, outline: 2.8 },
  n: {
    fill: 'url(#neutral-letter-fill)',
    edge: 'url(#neutral-letter-edge)',
    body: 1.4,
    outline: 2.9
  }
} as const;

function letterSize(text: string): number {
  if (!/^[A-Z0-9]{1,2}$/.test(text)) throw new Error('Invalid fairy symbol.');
  return text.length === 1 ? 20 : 17;
}

function halves(id: string, left: string, right: string): string {
  return `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x2="45" y2="0"><stop offset="50%" stop-color="${left}"/><stop offset="50%" stop-color="${right}"/></linearGradient>`;
}

export function fairyLetterSVG(color: 'w' | 'b' | 'n', text: string): string {
  const size = letterSize(text);
  const { fill, edge, body, outline } = LETTER_INKS[color];
  const defs =
    color === 'n'
      ? `<defs>${halves('neutral-letter-fill', 'white', 'black')}${halves('neutral-letter-edge', 'black', 'white')}</defs>`
      : '';
  const glyph = (paint: string) =>
    `<text x="23" y="${22.5 + size * 0.36}" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="${size}" font-weight="700" letter-spacing="1" stroke-linejoin="round" ${paint}>${text}</text>`;
  return `${SVG_OPEN}${defs}${glyph(`fill="none" stroke="${edge}" stroke-width="${outline}"`)}${glyph(`fill="${fill}" stroke="${fill}" stroke-width="${body}"`)}</svg>`;
}

export function fairyDiscSVG(color: 'w' | 'b' | 'n', text: string): string {
  const size = letterSize(text) - 2;
  const disc =
    color === 'w' ? 'white' : color === 'b' ? 'black' : 'url(#neutral-disc)';
  const defs =
    color === 'n'
      ? `<defs>${halves('neutral-disc', 'white', 'black')}</defs>`
      : '';
  const halo =
    color === 'n'
      ? ' stroke="white" stroke-width="2" paint-order="stroke"'
      : '';
  return `${SVG_OPEN}${defs}<circle cx="22.5" cy="22.5" r="18" fill="${disc}" stroke="black" stroke-width="1.5"/><text x="22.5" y="${22.5 + size * 0.36}" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="${size}" font-weight="700" fill="${color === 'b' ? 'white' : 'black'}"${halo}>${text}</text></svg>`;
}
