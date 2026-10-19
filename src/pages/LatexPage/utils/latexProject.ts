import {
  LATEX_BOARD_SIZES,
  LATEX_COLUMN_RANGE,
  LATEX_DOCUMENT_CLASSES,
  LATEX_FONT_SIZES,
  LATEX_MARGIN_RANGE_MM,
  LATEX_MAX_POSITIONS,
  LATEX_PACKAGES,
  LATEX_PAPER_SIZES,
  type Arrow,
  type LatexBoardSize,
  type LatexDocumentClass,
  type LatexFontSize,
  type LatexOutputMode,
  type LatexPackage,
  type LatexPaperSize,
  type LatexPosition,
  type SquareHighlight,
  STARTING_FEN,
  generateDiagram,
  generateLatexDocument,
  isValidHexColor,
  normalizeFEN,
  safeJSONParse,
  squareToIndices,
  validateFENDetailed
} from '@chessviewer-org/chess-viewer';
import { consumeStagedPositions } from '@utils/latexHandoff';

export const LATEX_STORAGE_KEY = 'cv_latex_project';
export const LATEX_PROJECT_VERSION = 1;

const TEXT_LIMIT = 500;
const LONG_TEXT_LIMIT = 2000;
const TITLE_LIMIT = 200;

export interface StudioPosition {
  id: string;
  fen: string;
  flipped: boolean;
  caption: string;
  author: string;
  source: string;
  award: string;
  stipulation: string;
  remark: string;
  solution: string;
  squares: string;
  rings: string;
  arrows: string;
  squareColor: string;
  ringColor: string;
  arrowColor: string;
}

export interface StudioSettings {
  latexPackage: LatexPackage;
  mode: LatexOutputMode;
  boardSize: LatexBoardSize;
  showCoords: boolean;
  showMover: boolean;
  columns: number;
  documentClass: LatexDocumentClass;
  paper: LatexPaperSize;
  fontSize: LatexFontSize;
  marginMm: number;
  title: string;
  documentAuthor: string;
  numbering: boolean;
  pieceCount: boolean;
  solutions: boolean;
}

export interface LatexProject {
  version: typeof LATEX_PROJECT_VERSION;
  positions: StudioPosition[];
  selectedId: string;
  settings: StudioSettings;
}

export interface SkippedPosition {
  id: string;
  index: number;
  reason: string;
}

export interface PositionWarnings {
  squares: string[];
  rings: string[];
  arrows: string[];
}

export interface BuildResult {
  code: string;
  skipped: SkippedPosition[];
  error: string | null;
}

export const DEFAULT_SQUARE_COLOR = '#ffeb3b';
export const DEFAULT_RING_COLOR = '#e8412c';
export const DEFAULT_ARROW_COLOR = '#15781b';

export const DEFAULT_SETTINGS: StudioSettings = {
  latexPackage: 'diagram',
  mode: 'document',
  boardSize: 'normal',
  showCoords: true,
  showMover: true,
  columns: 2,
  documentClass: 'article',
  paper: 'a4',
  fontSize: 11,
  marginMm: 20,
  title: '',
  documentAuthor: '',
  numbering: true,
  pieceCount: true,
  solutions: true
};

const ARROW_TOKEN = /^([a-h][1-8])[-–>]?([a-h][1-8])$/;
const SQUARE_SEPARATOR = /[\s,;]+/;
const BULK_FIELD_SEPARATOR = '|';

let idCounter = 0;

export function newPositionId(): string {
  idCounter += 1;
  return `p${Date.now().toString(36)}${idCounter.toString(36)}`;
}

export function createPosition(
  fen: string,
  extras: Partial<Omit<StudioPosition, 'id' | 'fen'>> = {}
): StudioPosition {
  return {
    fen,
    flipped: false,
    caption: '',
    author: '',
    source: '',
    award: '',
    stipulation: '',
    remark: '',
    solution: '',
    squares: '',
    rings: '',
    arrows: '',
    squareColor: DEFAULT_SQUARE_COLOR,
    ringColor: DEFAULT_RING_COLOR,
    arrowColor: DEFAULT_ARROW_COLOR,
    ...extras,
    id: newPositionId()
  };
}

export function createDefaultProject(): LatexProject {
  const first = createPosition(STARTING_FEN);
  return {
    version: LATEX_PROJECT_VERSION,
    positions: [first],
    selectedId: first.id,
    settings: { ...DEFAULT_SETTINGS }
  };
}

function checkedFen(fen: string): { fen: string; problem: string | null } {
  const trimmed = fen.trim();
  if (!trimmed) return { fen: '', problem: 'FEN is empty' };
  try {
    const normalized = normalizeFEN(trimmed);
    const { isValid, errorMessage } = validateFENDetailed(normalized);
    return {
      fen: normalized,
      problem: isValid ? null : (errorMessage ?? 'Invalid FEN')
    };
  } catch (err: unknown) {
    return {
      fen: trimmed,
      problem: err instanceof Error ? err.message : 'Invalid FEN'
    };
  }
}

export function usableFen(fen: string): string | null {
  const { fen: normalized, problem } = checkedFen(fen);
  return problem === null ? normalized : null;
}

export function fenProblem(fen: string): string | null {
  return checkedFen(fen).problem;
}

export function parseSquareList(text: string): {
  squares: string[];
  invalid: string[];
} {
  const squares: string[] = [];
  const invalid: string[] = [];
  for (const token of text.toLowerCase().split(SQUARE_SEPARATOR)) {
    if (!token) continue;
    if (squareToIndices(token) === null) invalid.push(token);
    else if (!squares.includes(token)) squares.push(token);
  }
  return { squares, invalid };
}

export function parseArrowList(text: string): {
  arrows: Array<{ from: string; to: string }>;
  invalid: string[];
} {
  const arrows: Array<{ from: string; to: string }> = [];
  const invalid: string[] = [];
  for (const token of text.toLowerCase().split(SQUARE_SEPARATOR)) {
    if (!token) continue;
    const match = ARROW_TOKEN.exec(token);
    const from = match?.[1];
    const to = match?.[2];
    if (!from || !to || from === to) invalid.push(token);
    else arrows.push({ from, to });
  }
  return { arrows, invalid };
}

export function positionWarnings(position: StudioPosition): PositionWarnings {
  return {
    squares: parseSquareList(position.squares).invalid,
    rings: parseSquareList(position.rings).invalid,
    arrows: parseArrowList(position.arrows).invalid
  };
}

export function positionAnnotations(position: StudioPosition): {
  highlights: SquareHighlight[];
  arrows: Arrow[];
} {
  const fills = parseSquareList(position.squares).squares.map(
    (square): SquareHighlight => ({
      square,
      color: position.squareColor,
      style: 'fill'
    })
  );
  const rings = parseSquareList(position.rings).squares.map(
    (square): SquareHighlight => ({
      square,
      color: position.ringColor,
      style: 'ring'
    })
  );
  const arrows = parseArrowList(position.arrows).arrows.map(
    ({ from, to }): Arrow => ({ from, to, color: position.arrowColor })
  );
  return { highlights: [...fills, ...rings], arrows };
}

function textField<K extends string>(
  key: K,
  value: string
): Partial<Record<K, string>> {
  const trimmed = value.trim();
  return trimmed ? ({ [key]: trimmed } as Record<K, string>) : {};
}

export function toLatexPosition(
  position: StudioPosition,
  fen: string
): LatexPosition {
  const { highlights, arrows } = positionAnnotations(position);
  return {
    fen,
    flipped: position.flipped,
    ...textField('caption', position.caption),
    ...textField('author', position.author),
    ...textField('source', position.source),
    ...textField('award', position.award),
    ...textField('stipulation', position.stipulation),
    ...textField('remark', position.remark),
    ...textField('solution', position.solution),
    highlights,
    arrows
  };
}

export function buildLatex(project: LatexProject): BuildResult {
  const skipped: SkippedPosition[] = [];
  const positions: LatexPosition[] = [];

  project.positions.forEach((position, index) => {
    const fen = usableFen(position.fen);
    if (fen === null) {
      skipped.push({
        id: position.id,
        index,
        reason: fenProblem(position.fen) ?? 'Invalid FEN'
      });
      return;
    }
    positions.push(toLatexPosition(position, fen));
  });

  if (!positions.length) {
    return { code: '', skipped, error: 'Add at least one valid position.' };
  }

  const { settings } = project;
  try {
    const code = generateLatexDocument({
      positions,
      latexPackage: settings.latexPackage,
      mode: settings.mode,
      boardSize: settings.boardSize,
      showCoords: settings.showCoords,
      showMover: settings.showMover,
      columns: settings.columns,
      documentClass: settings.documentClass,
      paper: settings.paper,
      fontSize: settings.fontSize,
      marginMm: settings.marginMm,
      title: settings.title,
      documentAuthor: settings.documentAuthor,
      numbering: settings.numbering,
      pieceCount: settings.pieceCount,
      solutions: settings.solutions
    });
    return { code, skipped, error: null };
  } catch (err: unknown) {
    return {
      code: '',
      skipped,
      error: err instanceof Error ? err.message : 'Could not build LaTeX'
    };
  }
}

export function parseBulkInput(text: string): StudioPosition[] {
  const result: StudioPosition[] = [];
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;
    const [fen = '', author = '', source = '', stipulation = ''] = line
      .split(BULK_FIELD_SEPARATOR)
      .map((part) => part.trim());
    if (usableFen(fen) === null) continue;
    result.push(
      createPosition(fen.slice(0, TEXT_LIMIT), {
        author: author.slice(0, TEXT_LIMIT),
        source: source.slice(0, TEXT_LIMIT),
        stipulation: stipulation.slice(0, TEXT_LIMIT)
      })
    );
    if (result.length >= LATEX_MAX_POSITIONS) break;
  }
  return result;
}

function clampText(value: unknown, limit: number, fallback = ''): string {
  return typeof value === 'string' ? value.slice(0, limit) : fallback;
}

function oneOf<T extends string | number>(
  list: readonly T[],
  value: unknown,
  fallback: T
): T {
  return list.includes(value as T) ? (value as T) : fallback;
}

function clampInteger(
  value: unknown,
  range: { min: number; max: number },
  fallback: number
): number {
  return typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= range.min &&
    value <= range.max
    ? value
    : fallback;
}

function colorOr(value: unknown, fallback: string): string {
  return isValidHexColor(value) ? value : fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function sanitizePosition(raw: unknown): StudioPosition | null {
  if (!isRecord(raw) || typeof raw['fen'] !== 'string') return null;
  const flag = (key: string) => raw[key] === true;
  const text = (key: string, limit = TEXT_LIMIT) => clampText(raw[key], limit);
  return {
    id: clampText(raw['id'], 40) || newPositionId(),
    fen: text('fen'),
    flipped: flag('flipped'),
    caption: text('caption'),
    author: text('author'),
    source: text('source'),
    award: text('award'),
    stipulation: text('stipulation'),
    remark: text('remark'),
    solution: text('solution', LONG_TEXT_LIMIT),
    squares: text('squares'),
    rings: text('rings'),
    arrows: text('arrows'),
    squareColor: colorOr(raw['squareColor'], DEFAULT_SQUARE_COLOR),
    ringColor: colorOr(raw['ringColor'], DEFAULT_RING_COLOR),
    arrowColor: colorOr(raw['arrowColor'], DEFAULT_ARROW_COLOR)
  };
}

function sanitizeSettings(raw: unknown): StudioSettings {
  const source = isRecord(raw) ? raw : {};
  const flag = (key: string, fallback: boolean) =>
    typeof source[key] === 'boolean' ? (source[key] as boolean) : fallback;
  const defaults = DEFAULT_SETTINGS;
  return {
    latexPackage: oneOf(
      LATEX_PACKAGES,
      source['latexPackage'],
      defaults.latexPackage
    ),
    mode: oneOf(
      ['snippet', 'document', 'standalone'] as const,
      source['mode'],
      defaults.mode
    ),
    boardSize: oneOf(
      LATEX_BOARD_SIZES,
      source['boardSize'],
      defaults.boardSize
    ),
    showCoords: flag('showCoords', defaults.showCoords),
    showMover: flag('showMover', defaults.showMover),
    columns: clampInteger(
      source['columns'],
      LATEX_COLUMN_RANGE,
      defaults.columns
    ),
    documentClass: oneOf(
      LATEX_DOCUMENT_CLASSES,
      source['documentClass'],
      defaults.documentClass
    ),
    paper: oneOf(LATEX_PAPER_SIZES, source['paper'], defaults.paper),
    fontSize: oneOf(LATEX_FONT_SIZES, source['fontSize'], defaults.fontSize),
    marginMm: clampInteger(
      source['marginMm'],
      LATEX_MARGIN_RANGE_MM,
      defaults.marginMm
    ),
    title: clampText(source['title'], TITLE_LIMIT),
    documentAuthor: clampText(source['documentAuthor'], TITLE_LIMIT),
    numbering: flag('numbering', defaults.numbering),
    pieceCount: flag('pieceCount', defaults.pieceCount),
    solutions: flag('solutions', defaults.solutions)
  };
}

export function sanitizeProject(raw: unknown): LatexProject {
  if (!isRecord(raw) || !Array.isArray(raw['positions'])) {
    return createDefaultProject();
  }

  const seen = new Set<string>();
  const positions: StudioPosition[] = [];
  for (const entry of raw['positions'].slice(0, LATEX_MAX_POSITIONS)) {
    const position = sanitizePosition(entry);
    if (!position) continue;
    if (seen.has(position.id)) position.id = newPositionId();
    seen.add(position.id);
    positions.push(position);
  }

  if (!positions.length) return createDefaultProject();

  const selectedId = positions.some((p) => p.id === raw['selectedId'])
    ? (raw['selectedId'] as string)
    : positions[0]!.id;

  return {
    version: LATEX_PROJECT_VERSION,
    positions,
    selectedId,
    settings: sanitizeSettings(raw['settings'])
  };
}

export function loadProject(): LatexProject {
  try {
    const stored = window.localStorage.getItem(LATEX_STORAGE_KEY);
    if (stored === null) return createDefaultProject();
    return sanitizeProject(safeJSONParse<unknown>(stored, null));
  } catch {
    return createDefaultProject();
  }
}

export function saveProject(project: LatexProject): void {
  try {
    window.localStorage.setItem(LATEX_STORAGE_KEY, JSON.stringify(project));
  } catch {
    return;
  }
}

export function takeStagedPositions(): StudioPosition[] {
  return consumeStagedPositions()
    .filter((entry) => usableFen(entry.fen) !== null)
    .map((entry) =>
      createPosition(entry.fen, {
        flipped: entry.flipped,
        caption: entry.caption
      })
    );
}

export function addPositions(
  project: LatexProject,
  incoming: StudioPosition[]
): LatexProject {
  const room = LATEX_MAX_POSITIONS - project.positions.length;
  const additions = incoming.slice(0, Math.max(0, room));
  if (!additions.length) return project;
  return {
    ...project,
    positions: [...project.positions, ...additions],
    selectedId: additions[0]!.id
  };
}

function signature(position: StudioPosition): string {
  return `${usableFen(position.fen) ?? position.fen}|${position.flipped}`;
}

export function isPlaceholderProject(project: LatexProject): boolean {
  const [only] = project.positions;
  return (
    project.positions.length === 1 &&
    only !== undefined &&
    only.fen === STARTING_FEN &&
    !only.author &&
    !only.stipulation &&
    !only.source &&
    !only.solution
  );
}

export function appendPositions(
  project: LatexProject,
  incoming: StudioPosition[]
): LatexProject {
  if (!incoming.length) return project;
  if (isPlaceholderProject(project)) {
    return {
      ...project,
      positions: incoming.slice(0, LATEX_MAX_POSITIONS),
      selectedId: incoming[0]!.id
    };
  }
  return addPositions(project, incoming);
}

export function importIncoming(
  project: LatexProject,
  incoming: StudioPosition[]
): LatexProject {
  if (!incoming.length) return project;
  if (isPlaceholderProject(project)) return appendPositions(project, incoming);

  const known = new Set(project.positions.map(signature));
  const fresh = incoming.filter((p) => !known.has(signature(p)));
  if (fresh.length) return addPositions(project, fresh);

  const existing = project.positions.find(
    (p) => signature(p) === signature(incoming[0]!)
  );
  return existing ? { ...project, selectedId: existing.id } : project;
}

const PREVIEW_LIGHT = '#ffffff';
const PREVIEW_DARK = '#222222';

export function previewDataUri(
  position: StudioPosition,
  options: {
    size: number;
    showCoords: boolean;
    showAnnotations: boolean;
  }
): string | null {
  const fen = usableFen(position.fen);
  if (fen === null) return null;
  const annotations = options.showAnnotations
    ? positionAnnotations(position)
    : { highlights: [], arrows: [] };
  const svg = generateDiagram({
    fen,
    size: options.size,
    flipped: position.flipped,
    showCoords: options.showCoords,
    coordColor: 'black',
    lightSquare: PREVIEW_LIGHT,
    darkSquare: PREVIEW_DARK,
    squarePattern: 'hatched',
    annotations
  });
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
