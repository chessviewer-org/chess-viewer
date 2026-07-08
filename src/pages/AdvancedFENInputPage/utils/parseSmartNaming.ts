const RANGE_TOKEN = /^([^[]+)\[(\d+)-(\d+)\]$/;

export function parseSmartNaming(input: string, totalCount: number): string[] {
  const names = Array<string>(totalCount).fill('');
  if (!input.trim()) return names;

  const tokens = input.split(',').map((token) => token.trim());

  let lastRangeBaseName = '';
  let hasRangeToken = false;

  for (const token of tokens) {
    const match = token.match(RANGE_TOKEN);
    if (!match) continue;

    hasRangeToken = true;
    const baseName = (match[1] ?? '').trim();
    if (baseName) lastRangeBaseName = baseName;

    const start = Math.min(Number(match[2]), Number(match[3]));
    const end = Math.max(Number(match[2]), Number(match[3]));

    let counter = 1;
    for (let i = start; i <= end && i <= totalCount; i++) {
      if (i < 1) continue;
      names[i - 1] = `${baseName}-${counter}`;
      counter++;
    }
  }

  if (!hasRangeToken) {
    const baseName = input.trim();
    return names.map((_, i) => `${baseName}-${i + 1}`);
  }

  const fallbackBaseName = lastRangeBaseName || 'Position';
  return names.map((name, i) => name || `${fallbackBaseName}-${i + 1}`);
}
