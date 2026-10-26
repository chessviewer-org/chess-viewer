export type Rgb = readonly [number, number, number];
export type Lab = readonly [number, number, number];

const CVD_MATRICES: Record<'protan' | 'deutan' | 'tritan', readonly number[]> =
  {
    protan: [
      0.152286, 1.052583, -0.204868, 0.114503, 0.786281, 0.099216, -0.003882,
      -0.048116, 1.051998
    ],
    deutan: [
      0.367322, 0.860646, -0.227968, 0.280085, 0.672501, 0.047413, -0.01182,
      0.04294, 0.968881
    ],
    tritan: [
      1.255528, -0.076749, -0.178779, -0.078411, 0.930809, 0.147602, 0.004733,
      0.691367, 0.3039
    ]
  };

export const CVD_KINDS = ['protan', 'deutan', 'tritan'] as const;

const decode = (v: number) => {
  const c = v / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};
const encode = (v: number) => {
  const c = Math.min(1, Math.max(0, v));
  return 255 * (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);
};

export function parseColor(value: string): Rgb | null {
  const text = value.trim();
  const hex = /^#([\da-f]{3}|[\da-f]{6})(?:[\da-f]{2})?$/i.exec(text);
  if (hex) {
    const digits = hex[1]!;
    const full =
      digits.length === 3 ? [...digits].map((d) => d + d).join('') : digits;
    return [0, 2, 4].map((i) =>
      parseInt(full.slice(i, i + 2), 16)
    ) as unknown as Rgb;
  }
  const rgb = /^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)/i.exec(text);
  return rgb ? [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])] : null;
}

export const toHex = ([r, g, b]: Rgb) =>
  `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`;

export function luminance([r, g, b]: Rgb): number {
  return 0.2126 * decode(r) + 0.7152 * decode(g) + 0.0722 * decode(b);
}

export function contrastRatio(a: Rgb, b: Rgb): number {
  const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (high! + 0.05) / (low! + 0.05);
}

export function toLab([r, g, b]: Rgb): Lab {
  const [lr, lg, lb] = [decode(r), decode(g), decode(b)];
  const l = Math.cbrt(
    0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb
  );
  const m = Math.cbrt(
    0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb
  );
  const s = Math.cbrt(
    0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb
  );
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s
  ];
}

export function fromOklch(L: number, C: number, hue: number): Rgb | null {
  const a = C * Math.cos((hue * Math.PI) / 180);
  const b = C * Math.sin((hue * Math.PI) / 180);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const linear = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s
  ];
  return linear.some((v) => v < -0.002 || v > 1.002)
    ? null
    : (linear.map(encode) as unknown as Rgb);
}

export function hueChroma([, a, b]: Lab) {
  return {
    chroma: Math.hypot(a, b),
    hue: ((Math.atan2(b, a) * 180) / Math.PI + 360) % 360
  };
}

export const distance = (x: Lab, y: Lab) =>
  Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]);

export function simulate(rgb: Rgb, kind: (typeof CVD_KINDS)[number]): Rgb {
  const m = CVD_MATRICES[kind];
  const [r, g, b] = [decode(rgb[0]), decode(rgb[1]), decode(rgb[2])];
  return [
    encode(m[0]! * r + m[1]! * g + m[2]! * b),
    encode(m[3]! * r + m[4]! * g + m[5]! * b),
    encode(m[6]! * r + m[7]! * g + m[8]! * b)
  ];
}
