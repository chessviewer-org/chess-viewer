import { validateFEN } from './fenParser';
import { logger } from './logger';
import { isRecord, MAX_FEN_LENGTH, safeJSONParse } from './validation';

/**
 * In-browser chess-board image recognition via the Google Gemini Vision API.
 *
 * PRIVACY INVARIANT: the request goes directly browser → Google. The image is
 * never uploaded to ChessVision's own backend, and nothing is logged or stored
 * here beyond local error diagnostics. The API key is the user's own personal
 * key (see {@link ./geminiKeyStorage}). We send the minimum payload and request
 * only the piece-placement field — turn/castling/en-passant are not visible in
 * a photo, so we synthesise neutral defaults rather than let the model guess.
 */

/**
 * Models tried in order. `gemini-2.5-pro` is the most accurate at reading board
 * geometry but has a very low free-tier request-per-minute limit, so when it
 * returns 429 we fall back to `gemini-2.5-flash` (far higher RPM). The
 * structured-grid approach keeps Flash accurate enough to be a good fallback.
 */
const MODEL_CHAIN = ['gemini-2.5-pro', 'gemini-2.5-flash'] as const;
const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

/** Retry budget for a single model when it returns a transient 429. */
const MAX_RETRIES_PER_MODEL = 2;
/** Base back-off (ms) before retrying a rate-limited request. */
const RETRY_BASE_DELAY_MS = 1500;

/** Reject oversized uploads before base64-encoding (memory + cost guard). */
const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8 MB

/** Neutral metadata appended to the placement field to form a complete FEN. */
const NEUTRAL_FEN_SUFFIX = ' w - - 0 1';

/** Empty-square marker the model returns; converted to digit runs locally. */
const EMPTY = '.';

/**
 * Accuracy strategy: instead of asking for a FEN string (where the model
 * miscounts empty-square runs and flips rank order), we ask it to read the
 * board as 8 explicit rows of 8 characters each, top row first (rank 8) and
 * left-to-right (file a→h). Empty squares are a literal '.'. We then build the
 * FEN ourselves from that grid, so the only thing the model must get right is
 * "what piece is on each square" — never the run-length encoding or ordering.
 */
const SCAN_PROMPT =
  'You are an expert chess position scanner. Carefully analyse the chess board ' +
  'in this image, square by square.\n\n' +
  "Read the board from White's standard orientation:\n" +
  '- The TOP row of the array is rank 8, the BOTTOM row is rank 1.\n' +
  '- Within each row, read squares LEFT to RIGHT as files a, b, c, d, e, f, g, h.\n' +
  "- If the board in the image is rotated or shown from Black's side, mentally " +
  "rotate it so the result is always in White's orientation (rank 8 on top).\n\n" +
  'For EACH of the 64 squares output exactly one character:\n' +
  '- White pieces: P N B R Q K (uppercase).\n' +
  '- Black pieces: p n b r q k (lowercase).\n' +
  '- Empty square: a single dot "." (never a number).\n\n' +
  'Return JSON with a single field "rows": an array of exactly 8 strings, each ' +
  'exactly 8 characters long, ordered from rank 8 (index 0) down to rank 1 ' +
  '(index 7). Example empty board row: "........". Do not guess — if a square is ' +
  'empty use ".". Double-check the colour (white vs black) of every piece.';

/** JSON schema constraining the model to the 8×8 grid we expect. */
const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    rows: {
      type: 'array',
      items: { type: 'string' }
    }
  },
  required: ['rows']
} as const;

interface GeminiInlinePart {
  inline_data: { mime_type: string; data: string };
}
interface GeminiTextPart {
  text: string;
}
interface GeminiResponse {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
  }>;
  error?: { message?: string };
}

/** Shape the model returns under the response schema. */
interface BoardGrid {
  rows: string[];
}

/** Resolves after `ms` milliseconds (used for rate-limit back-off). */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Reads a File into a bare base64 string (no data-URL prefix). */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read the image file.'));
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== 'string') {
        reject(new Error('Could not read the image file.'));
        return;
      }
      const comma = result.indexOf(',');
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.readAsDataURL(file);
  });
}

/** Maps an HTTP failure to a concise, user-facing message. */
function describeHttpError(status: number, apiMessage?: string): string {
  if (status === 400) return 'Invalid request or unsupported image.';
  if (status === 401 || status === 403)
    return 'API key is invalid or lacks access. Check it in Developer Options.';
  if (status === 429)
    return 'Gemini rate limit reached. Wait a minute and try again (Pro has a low free-tier limit).';
  if (status >= 500) return 'Gemini service error. Try again later.';
  return apiMessage || `Request failed (HTTP ${status}).`;
}

const VALID_SQUARE = new Set([
  'P',
  'N',
  'B',
  'R',
  'Q',
  'K',
  'p',
  'n',
  'b',
  'r',
  'q',
  'k'
]);

/**
 * Converts the model's 8×8 character grid into a FEN piece-placement field.
 * Empty-square runs are collapsed to digits here (not by the model), removing
 * the most common source of FEN miscounts. Throws when the grid is malformed.
 *
 * @param grid - Model output: 8 rows of 8 chars, rank 8 first, file a→h
 * @returns The FEN placement field (e.g. `rnbqkbnr/pppppppp/8/...`)
 */
function gridToPlacement(grid: BoardGrid): string {
  const rows = grid.rows;
  if (!Array.isArray(rows) || rows.length !== 8) {
    throw new Error('Could not read all 8 ranks from the image.');
  }

  const fenRows = rows.map((row) => {
    if (typeof row !== 'string') {
      throw new Error('Could not read a rank from the image.');
    }
    // Normalise common stand-ins for "empty" before validating width.
    const cells = [...row.replace(/[\s_-]/g, EMPTY)];
    if (cells.length !== 8) {
      throw new Error('A rank did not contain 8 squares.');
    }

    let fenRow = '';
    let empties = 0;
    for (const cell of cells) {
      if (cell === EMPTY) {
        empties += 1;
        continue;
      }
      if (!VALID_SQUARE.has(cell)) {
        throw new Error(`Unrecognised square value: ${cell}`);
      }
      if (empties > 0) {
        fenRow += String(empties);
        empties = 0;
      }
      fenRow += cell;
    }
    if (empties > 0) fenRow += String(empties);
    return fenRow;
  });

  return fenRows.join('/');
}

/**
 * Scans a chess-board image and returns a complete, validated FEN.
 *
 * @param imageFile - An image file selected by the user (must be `image/*`)
 * @param apiKey - The user's personal Gemini API key
 * @returns A validated 6-field FEN string ready to load onto the board
 * @throws With a user-facing message on validation, network, or auth failure
 */
export async function scanBoardImage(
  imageFile: File,
  apiKey: string
): Promise<string> {
  if (!apiKey) throw new Error('Missing Gemini API key.');
  if (!imageFile.type.startsWith('image/'))
    throw new Error('Please choose an image file.');
  if (imageFile.size > MAX_IMAGE_BYTES)
    throw new Error('Image is too large (max 8 MB).');

  const base64 = await fileToBase64(imageFile);
  const mimeType = imageFile.type;

  // Walk the model chain: try each model (with a couple of retries on 429)
  // before falling back to the next, cheaper-but-higher-RPM model.
  let lastError: Error | null = null;
  for (const model of MODEL_CHAIN) {
    const result = await requestPlacement(model, base64, mimeType, apiKey);
    if (result.ok) return result.fen;
    lastError = result.error;
    // Only fall through to the next model when this one was rate-limited or
    // had a server error; auth/validation failures won't improve on retry.
    if (!result.retryable) break;
  }

  throw lastError ?? new Error('Could not scan the image. Try again later.');
}

/** Outcome of a single model attempt. */
type PlacementResult =
  | { ok: true; fen: string }
  | { ok: false; retryable: boolean; error: Error };

/**
 * Requests the board grid from one model, retrying briefly on 429, and returns
 * the validated FEN. On failure it reports whether trying another model could
 * help (rate-limit / server error) versus a terminal error (bad key, bad image).
 */
async function requestPlacement(
  model: string,
  base64: string,
  mimeType: string,
  apiKey: string
): Promise<PlacementResult> {
  const parts: Array<GeminiTextPart | GeminiInlinePart> = [
    { text: SCAN_PROMPT },
    { inline_data: { mime_type: mimeType, data: base64 } }
  ];
  const body = JSON.stringify({
    contents: [{ parts }],
    generationConfig: {
      temperature: 0,
      // Force a parseable 8×8 grid instead of free-text FEN.
      responseMimeType: 'application/json',
      responseSchema: RESPONSE_SCHEMA
    }
  });

  for (let attempt = 0; attempt <= MAX_RETRIES_PER_MODEL; attempt++) {
    let response: Response;
    try {
      response = await fetch(
        `${API_BASE}/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body
        }
      );
    } catch (error) {
      logger.error('Gemini request failed:', error);
      return {
        ok: false,
        retryable: true,
        error: new Error(
          'Network error reaching Gemini. Check your connection.'
        )
      };
    }

    const data = (await response.json().catch(() => ({}))) as GeminiResponse;

    if (response.status === 429 && attempt < MAX_RETRIES_PER_MODEL) {
      // Honour Retry-After when present; otherwise exponential back-off.
      const headerWait = Number(response.headers.get('retry-after')) * 1000;
      const wait =
        Number.isFinite(headerWait) && headerWait > 0
          ? headerWait
          : RETRY_BASE_DELAY_MS * (attempt + 1);
      await sleep(wait);
      continue;
    }

    if (!response.ok) {
      const retryable = response.status === 429 || response.status >= 500;
      return {
        ok: false,
        retryable,
        error: new Error(
          describeHttpError(response.status, data.error?.message)
        )
      };
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (typeof text !== 'string' || !text.trim()) {
      return {
        ok: false,
        retryable: false,
        error: new Error('Gemini returned no position. Try a clearer image.')
      };
    }

    const parsed = safeJSONParse<unknown>(text, null);
    if (!isRecord(parsed) || !Array.isArray(parsed['rows'])) {
      return {
        ok: false,
        retryable: false,
        error: new Error('Could not read the position from the image.')
      };
    }

    try {
      const placement = gridToPlacement({ rows: parsed['rows'] as string[] });
      const fen = `${placement}${NEUTRAL_FEN_SUFFIX}`;
      if (fen.length > MAX_FEN_LENGTH || !validateFEN(fen)) {
        throw new Error('Could not read a valid position from the image.');
      }
      return { ok: true, fen };
    } catch (error) {
      return {
        ok: false,
        retryable: false,
        error:
          error instanceof Error
            ? error
            : new Error('Could not read a valid position from the image.')
      };
    }
  }

  // Exhausted retries on 429.
  return {
    ok: false,
    retryable: true,
    error: new Error(
      'Gemini rate limit reached. Trying a lighter model or wait a moment.'
    )
  };
}

/**
 * Lightweight key verification: lists models with the supplied key. A 200
 * confirms the key is usable without consuming a generation quota unit.
 *
 * @param apiKey - The candidate Gemini API key
 * @returns `true` when the key authenticates successfully
 * @throws With a user-facing message when the key is rejected or unreachable
 */
export async function verifyGeminiKey(apiKey: string): Promise<boolean> {
  if (!apiKey.trim()) throw new Error('Enter a key first.');
  let response: Response;
  try {
    response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(
        apiKey.trim()
      )}`
    );
  } catch (error) {
    logger.error('Gemini key verification failed:', error);
    throw new Error('Network error reaching Gemini. Check your connection.');
  }
  if (response.ok) return true;
  const data = (await response.json().catch(() => ({}))) as GeminiResponse;
  throw new Error(describeHttpError(response.status, data.error?.message));
}
