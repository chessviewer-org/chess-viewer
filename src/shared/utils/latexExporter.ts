import {
  MAX_FEN_LENGTH,
  normalizeFEN,
  validateFENDetailed
} from '@chessviewer-org/chess-viewer';

// Constants
export const LATEX_PACKAGES = ['skak', 'chessboard'] as const;

const SAFE_FEN_PATTERN = /^[A-Za-z0-9/ -]+$/;
const DOCUMENT_CLASS = '\\documentclass{article}';

// Types
export type LatexPackage = (typeof LATEX_PACKAGES)[number];
export type LatexOutputMode = 'snippet' | 'document';

export interface LatexPackageMeta {
  label: string;
  usePackage: string;
  description: string;
}

export interface LatexExportConfig {
  fen: string;
  latexPackage?: LatexPackage;
  flipped?: boolean;
  showCoords?: boolean;
  mode?: LatexOutputMode;
}

export const LATEX_PACKAGE_META: Record<LatexPackage, LatexPackageMeta> = {
  skak: {
    label: 'skak',
    usePackage: '\\usepackage{skak}',
    description: 'Diagrams from \\fenboard and \\showboard.'
  },
  chessboard: {
    label: 'chessboard',
    usePackage: '\\usepackage{chessboard}',
    description: 'Key-value diagrams from \\chessboard[setfen=…].'
  }
};

// Helpers
export function isLatexPackage(value: unknown): value is LatexPackage {
  return (
    typeof value === 'string' &&
    (LATEX_PACKAGES as readonly string[]).includes(value)
  );
}

function fail(reason: string): never {
  throw new Error(`LaTeX export failed: ${reason}`);
}

function resolveFen(fen: unknown): string {
  if (typeof fen !== 'string' || !fen.trim()) fail('FEN is missing');

  let normalized: string;
  try {
    normalized = normalizeFEN(fen.trim());
  } catch (err: unknown) {
    fail(err instanceof Error ? err.message : 'invalid FEN');
  }

  if (normalized.length > MAX_FEN_LENGTH) {
    fail(`FEN exceeds maximum length of ${MAX_FEN_LENGTH} characters`);
  }

  const { isValid, errorMessage } = validateFENDetailed(normalized);
  if (!isValid) fail(errorMessage ?? 'invalid FEN');

  if (!SAFE_FEN_PATTERN.test(normalized)) {
    fail('FEN contains characters that are unsafe in LaTeX markup');
  }
  return normalized;
}

function buildSkakBody(fen: string, config: LatexExportConfig): string[] {
  const lines = [`\\fenboard{${fen}}`];
  if (config.showCoords === false) lines.push('\\notationoff');
  lines.push(config.flipped ? '\\showinverseboard' : '\\showboard');
  return lines;
}

function buildChessboardBody(fen: string, config: LatexExportConfig): string[] {
  const keys = [`setfen=${fen}`];
  if (config.flipped) keys.push('inverse=true');
  if (config.showCoords === false) keys.push('label=false');

  const [single] = keys;
  if (keys.length === 1 && single) return [`\\chessboard[${single}]`];

  const last = keys.length - 1;
  return [
    '\\chessboard[',
    ...keys.map((key, index) => `  ${key}${index === last ? '' : ','}`),
    ']'
  ];
}

export function generateBoardLatex(config: LatexExportConfig): string {
  if (!config) fail('config is null or undefined');

  const latexPackage = config.latexPackage ?? 'skak';
  if (!isLatexPackage(latexPackage)) {
    fail(`unsupported package "${String(latexPackage)}"`);
  }

  const fen = resolveFen(config.fen);
  const body =
    latexPackage === 'skak'
      ? buildSkakBody(fen, config)
      : buildChessboardBody(fen, config);

  const { usePackage } = LATEX_PACKAGE_META[latexPackage];

  if (config.mode === 'document') {
    return [
      DOCUMENT_CLASS,
      usePackage,
      '\\begin{document}',
      ...body,
      '\\end{document}'
    ].join('\n');
  }

  return [usePackage, ...body].join('\n');
}
