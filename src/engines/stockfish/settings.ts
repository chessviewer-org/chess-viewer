import { readDevice, recommendedHash } from '../core/device';
import { SEARCH_TIMES } from '../core/limits';

export const MAX_LINES = 5;
export const HASH_SIZES = [16, 32, 64, 128, 256] as const;
const MAX_THREADS = 8;

export const threadedEngine = () =>
  globalThis.crossOriginIsolated === true &&
  typeof SharedArrayBuffer !== 'undefined';
export const maxThreads = () =>
  threadedEngine() ? Math.min(readDevice().cores, MAX_THREADS) : 1;
export const recommendedThreads = () =>
  Math.max(1, Math.min(maxThreads(), readDevice().cores - 1));
export const recommendedMemory = () => {
  const { cores, memoryGb } = readDevice();
  return recommendedHash(HASH_SIZES, cores, memoryGb);
};

export const MODELS = [
  {
    id: '19',
    label: 'Stockfish 19 Lite',
    detail: '1.7 MB',
    file: 'stockfish-19-lite-single.js',
    threadedFile: 'stockfish-19-lite.js'
  },
  {
    id: '18',
    label: 'Stockfish 18 Lite',
    detail: '7.3 MB',
    file: 'stockfish-18-lite-single.js',
    threadedFile: 'stockfish-18-lite.js'
  }
] as const;

export type ModelId = (typeof MODELS)[number]['id'];

export interface AnalysisSettings {
  model: ModelId;
  seconds: number;
  memoryMb: number;
  threads: number;
  lines: number;
  rules: boolean;
}

export const DEFAULT_ANALYSIS_SETTINGS: AnalysisSettings = {
  model: '18',
  seconds: 10,
  memoryMb: recommendedMemory(),
  threads: recommendedThreads(),
  lines: 3,
  rules: false
};

export const modelById = (id: ModelId) =>
  MODELS.find((model) => model.id === id) ?? MODELS[0];

export function analysisSettings(value: unknown): AnalysisSettings {
  const saved: Partial<Record<keyof AnalysisSettings, unknown>> =
    value && typeof value === 'object' ? value : {};
  const { model, seconds, memoryMb, threads, lines, rules } = saved;
  return {
    model:
      MODELS.find((entry) => entry.id === model)?.id ??
      DEFAULT_ANALYSIS_SETTINGS.model,
    seconds: SEARCH_TIMES.some((n) => n === seconds)
      ? Number(seconds)
      : DEFAULT_ANALYSIS_SETTINGS.seconds,
    memoryMb: HASH_SIZES.some((n) => n === memoryMb)
      ? Number(memoryMb)
      : DEFAULT_ANALYSIS_SETTINGS.memoryMb,
    threads:
      typeof threads === 'number' &&
      Number.isInteger(threads) &&
      threads >= 1 &&
      threads <= maxThreads()
        ? threads
        : recommendedThreads(),
    lines:
      typeof lines === 'number' &&
      Number.isInteger(lines) &&
      lines >= 1 &&
      lines <= MAX_LINES
        ? lines
        : DEFAULT_ANALYSIS_SETTINGS.lines,
    rules: typeof rules === 'boolean' ? rules : DEFAULT_ANALYSIS_SETTINGS.rules
  };
}
