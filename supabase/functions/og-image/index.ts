// @ts-ignore - ESM module lacks types in Deno
import { initWasm, Resvg } from 'https://esm.sh/@resvg/resvg-wasm@3.1.1';

const resvgWasm = await fetch(
  'https://esm.sh/@resvg/resvg-wasm@3.1.1/index_bg.wasm'
).then((res: Response) => res.arrayBuffer());
await initWasm(resvgWasm);

// Constants
const DEFAULT_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR';
const PIECE_NAMES = [
  'wK',
  'wQ',
  'wR',
  'wB',
  'wN',
  'wP',
  'bK',
  'bQ',
  'bR',
  'bB',
  'bN',
  'bP'
];
const PIECE_CACHE: Record<string, string> = {};

await Promise.all(
  PIECE_NAMES.map(async (name) => {
    try {
      const res = await fetch(
        `https://lichess1.org/assets/piece/cburnett/${name}.svg`
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      PIECE_CACHE[name] = `data:image/svg+xml;base64,${btoa(await res.text())}`;
    } catch (e) {
      console.warn(`Failed to preload piece ${name}:`, e);
    }
  })
);

// Handler
Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const rawFen = url.searchParams.get('fen') || DEFAULT_FEN;
    const fen = rawFen.split(' ')[0];
    const isFlipped = url.searchParams.get('flipped') === 'true';

    const rows = fen.split('/');
    if (rows.length !== 8) return new Response('Invalid FEN', { status: 400 });

    const boardSize = 560;
    const squareSize = boardSize / 8;
    const offsetX = (1200 - boardSize) / 2;
    const offsetY = (630 - boardSize) / 2;

    let svgBoard = '';

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const color = (r + c) % 2 === 0 ? '#f0d9b5' : '#b58863';
        const x = offsetX + c * squareSize;
        const y = offsetY + r * squareSize;
        svgBoard += `<rect x="${x}" y="${y}" width="${squareSize}" height="${squareSize}" fill="${color}" />`;
      }
    }

    for (let r = 0; r < 8; r++) {
      let c = 0;
      for (const char of rows[r]) {
        if (/[1-8]/.test(char)) {
          c += parseInt(char, 10);
        } else if (c < 8) {
          const visRow = isFlipped ? 7 - r : r;
          const visCol = isFlipped ? 7 - c : c;
          const x = offsetX + visCol * squareSize;
          const y = offsetY + visRow * squareSize;

          const piece = char.toUpperCase();
          const color = char === piece ? 'w' : 'b';
          const dataUri = PIECE_CACHE[`${color}${piece}`];

          if (dataUri) {
            svgBoard += `<image href="${dataUri}" x="${x}" y="${y}" width="${squareSize}" height="${squareSize}" />`;
          }
          c++;
        }
      }
    }

    const logoSvg = `<g transform="translate(30, 20) scale(0.7)">
        <path d="M22 10c10.5 1 16.5 8 16 29H15c0-9 10-6.5 8-21" stroke="#3b82f6" stroke-width="2.5" fill="none" stroke-linecap="round" />
        <path d="M24 18c.38 2.91-5.55 7.37-8 9-3 2-2.82 4.34-5 4-1.042-.94 1.41-3.04 0-3-1 0 .19 1.23-1 2-1 0-4.003 1-4-4 0-2 6-12 6-12s1.89-1.9 2-3.5c-.73-.994-.5-2-.5-3 1-1 3 2.5 3 2.5h2s.78-1.992 2.5-3c1 0 1 3 1 3" stroke="#3b82f6" stroke-width="2.5" fill="none" stroke-linecap="round" />
        <text x="45" y="32" font-family="sans-serif" font-size="28" font-weight="bold" fill="#ffffff">ChessViewer</text>
    </g>`;

    const svgString = `
    <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#121218" />
          <stop offset="100%" stop-color="#0c0c10" />
        </linearGradient>
      </defs>
      <rect width="1200" height="630" fill="url(#bg)" />
      <rect x="${offsetX - 4}" y="${offsetY - 4}" width="${boardSize + 8}" height="${boardSize + 8}" fill="none" stroke="#25252d" stroke-width="8" rx="4" />
      <rect x="${offsetX}" y="${offsetY}" width="${boardSize}" height="${boardSize}" fill="none" stroke="#000000" stroke-width="1" />
      ${svgBoard}
      ${logoSvg}
    </svg>`;

    const pngData = new Resvg(svgString, {
      fitTo: { mode: 'width', value: 1200 },
      font: { loadSystemFonts: false }
    })
      .render()
      .asPng();

    return new Response(pngData, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    console.error('OG Image Generation Error:', error);
    return new Response('Error generating image', { status: 500 });
  }
});
