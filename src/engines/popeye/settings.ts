import { MEMORY_SIZES, SEARCH_TIMES } from '../core/limits';

export const POPEYE_VERSION = '4.103';

export interface AnalysisSettings {
  seconds: number;
  memoryMb: number;
  solutions: number;
  variations: boolean;
  threats: boolean;
  rules: boolean;
}

export const DEFAULT_ANALYSIS_SETTINGS: AnalysisSettings = {
  seconds: 30,
  memoryMb: 32,
  solutions: 3,
  variations: true,
  threats: true,
  rules: false
};

export function analysisSettings(value: unknown): AnalysisSettings {
  const saved = value && typeof value === 'object' ? value : {};
  const pick = (key: keyof AnalysisSettings) =>
    key in saved ? saved[key as keyof typeof saved] : undefined;
  const seconds = pick('seconds');
  const memoryMb = pick('memoryMb');
  const solutions = pick('solutions');
  return {
    seconds: SEARCH_TIMES.some((n) => n === seconds)
      ? Number(seconds)
      : DEFAULT_ANALYSIS_SETTINGS.seconds,
    memoryMb: MEMORY_SIZES.some((n) => n === memoryMb)
      ? Number(memoryMb)
      : DEFAULT_ANALYSIS_SETTINGS.memoryMb,
    solutions:
      typeof solutions === 'number' &&
      Number.isInteger(solutions) &&
      solutions >= 1 &&
      solutions <= 10
        ? solutions
        : DEFAULT_ANALYSIS_SETTINGS.solutions,
    variations:
      typeof pick('variations') === 'boolean'
        ? Boolean(pick('variations'))
        : DEFAULT_ANALYSIS_SETTINGS.variations,
    threats:
      typeof pick('threats') === 'boolean'
        ? Boolean(pick('threats'))
        : DEFAULT_ANALYSIS_SETTINGS.threats,
    rules:
      typeof pick('rules') === 'boolean'
        ? Boolean(pick('rules'))
        : DEFAULT_ANALYSIS_SETTINGS.rules
  };
}
