import {
  CVD_KINDS,
  contrastRatio,
  distance,
  fromOklch,
  hueChroma,
  parseColor,
  simulate,
  toHex,
  toLab,
  type Rgb
} from './space';

interface Palette {
  fallback: string;
  mood: ReadonlyArray<readonly [hue: number, weight: number]>;
}

const HINT: Palette = {
  fallback: '#f5c400',
  mood: [
    [95, 1],
    [145, 1],
    [190, 0.9],
    [250, 0.85],
    [55, 0.55],
    [340, 0.3],
    [305, 0.2],
    [25, 0.15]
  ]
};
const THREAT: Palette = {
  fallback: '#e53935',
  mood: [
    [25, 1],
    [50, 0.7],
    [355, 0.55],
    [95, 0.25]
  ]
};

const HARMONY: ReadonlyArray<readonly [offset: number, weight: number]> = [
  [180, 1],
  [150, 0.9],
  [120, 0.85],
  [30, 0.8],
  [0, 0.5]
];
const MIN_CONTRAST = 1.5;
const DEFAULT_CONTRAST = 2;
const MIN_DISTINCT = 0.15;
const LIGHTNESS = [0.3, 0.38, 0.46, 0.54, 0.62, 0.7, 0.8, 0.9];
const CHROMA = [0.1, 0.14, 0.18];
const HUE_STEP = 10;

const angle = (a: number, b: number) => {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
};

function mood(palette: Palette, hue: number) {
  return Math.max(
    ...palette.mood.map(
      ([peak, weight]) => weight * Math.max(0, 1 - angle(hue, peak) / 45)
    )
  );
}

interface Backdrop {
  rgb: Rgb;
  lab: ReturnType<typeof toLab>;
  seen: Rgb[];
}

function measure(color: Rgb, backdrops: readonly Backdrop[]) {
  const labs = toLab(color);
  const contrast = Math.min(
    ...backdrops.map((b) => contrastRatio(color, b.rgb))
  );
  const apart = Math.min(...backdrops.map((b) => distance(labs, b.lab)));
  const colourBlind = Math.min(
    ...CVD_KINDS.flatMap((kind, i) => {
      const seen = toLab(simulate(color, kind));
      return backdrops.map((b) => distance(seen, toLab(b.seen[i]!)));
    })
  );
  return { labs, contrast, apart, colourBlind };
}

function choose(palette: Palette, squares: readonly string[]): string {
  const backdrops = squares
    .map(parseColor)
    .filter((rgb): rgb is Rgb => !!rgb)
    .map((rgb) => ({
      rgb,
      lab: toLab(rgb),
      seen: CVD_KINDS.map((kind) => simulate(rgb, kind))
    }));
  if (!backdrops.length) return palette.fallback;

  const preferred = parseColor(palette.fallback)!;
  const known = measure(preferred, backdrops);
  if (
    known.contrast >= DEFAULT_CONTRAST &&
    known.apart >= MIN_DISTINCT &&
    known.colourBlind >= MIN_DISTINCT / 2
  )
    return palette.fallback;

  const boardTone = backdrops
    .map((b) => hueChroma(b.lab))
    .reduce(
      (sum, tone) => ({
        x: sum.x + tone.chroma * Math.cos((tone.hue * Math.PI) / 180),
        y: sum.y + tone.chroma * Math.sin((tone.hue * Math.PI) / 180),
        chroma: sum.chroma + tone.chroma / backdrops.length
      }),
      { x: 0, y: 0, chroma: 0 }
    );
  const boardHue =
    ((Math.atan2(boardTone.y, boardTone.x) * 180) / Math.PI + 360) % 360;
  const harmonyShare = Math.min(1, boardTone.chroma / 0.08);

  let best = { score: -Infinity, rgb: preferred, strict: false };
  for (let hue = 0; hue < 360; hue += HUE_STEP)
    for (const L of LIGHTNESS)
      for (const C of CHROMA) {
        const rgb = fromOklch(L, C, hue);
        if (!rgb) continue;
        const { contrast, apart, colourBlind } = measure(rgb, backdrops);
        const strict = contrast >= MIN_CONTRAST && apart >= MIN_DISTINCT;
        const harmony = Math.max(
          ...HARMONY.map(
            ([offset, weight]) =>
              weight *
              Math.max(0, 1 - Math.abs(angle(hue, boardHue) - offset) / 25)
          )
        );
        const score =
          0.15 * Math.min(1, (contrast - 1) / 4) +
          0.15 * Math.min(1, apart / 0.35) +
          0.05 * Math.min(1, colourBlind / 0.2) +
          0.3 * mood(palette, hue) +
          0.1 * (harmonyShare * harmony + (1 - harmonyShare) * 0.5) +
          0.1 * Math.max(0, 1 - Math.abs(C - 0.16) / 0.1) +
          0.15 * Math.max(0, 1 - Math.max(0, 0.55 - L, L - 0.78) / 0.15);
        if (
          (strict && !best.strict) ||
          (strict === best.strict && score > best.score)
        )
          best = { score, rgb, strict };
      }
  return toHex(best.rgb);
}

const cache = new Map<string, string>();

function pick(palette: Palette, squares: readonly string[]) {
  const key = `${palette.fallback}|${squares.join('|')}`;
  const known = cache.get(key);
  if (known) return known;
  const colour = choose(palette, squares);
  cache.set(key, colour);
  return colour;
}

export const hintColor = (...squares: string[]) => pick(HINT, squares);
export const threatColor = (...squares: string[]) => pick(THREAT, squares);
