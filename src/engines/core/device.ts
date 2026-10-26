export interface Device {
  cores: number;
  memoryGb: number;
}

const FALLBACK: Device = { cores: 2, memoryGb: 4 };
const RAM_SHARE = 16;
const HASH_PER_CORE_MB = 16;

export function readDevice(): Device {
  const nav = globalThis.navigator as
    (Navigator & { deviceMemory?: number }) | undefined;
  return {
    cores: Math.max(1, nav?.hardwareConcurrency ?? FALLBACK.cores),
    memoryGb: nav?.deviceMemory ?? FALLBACK.memoryGb
  };
}

export function recommendedHash(
  sizes: readonly number[],
  cores: number,
  memoryGb: number
): number {
  const wanted = Math.min(
    HASH_PER_CORE_MB * cores,
    (memoryGb * 1024) / RAM_SHARE
  );
  return sizes.filter((size) => size <= wanted).at(-1) ?? sizes[0]!;
}
