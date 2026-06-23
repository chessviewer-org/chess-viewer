export function parseSmartNaming(input: string, totalCount: number): string[] {
  const names: string[] = Array(totalCount).fill('');
  if (!input.trim()) return names;

  const tokens = input.split(',').map((t) => t.trim());

  // Track the last base name seen in a range token so out-of-range slots can
  // fall back to that name instead of the generic "Position-N".
  let lastRangeBaseName = '';
  let hasCustomMappings = false;

  for (const token of tokens) {
    const match = token.match(/^([^[]+)\[(\d+)-(\d+)\]$/);
    if (match) {
      hasCustomMappings = true;
      const baseName = (match[1] ?? '').trim();
      if (baseName) lastRangeBaseName = baseName;
      const start = parseInt(match[2] ?? '0', 10);
      const end = parseInt(match[3] ?? '0', 10);

      const rangeStart = Math.min(start, end);
      const rangeEnd = Math.max(start, end);

      let counter = 1;
      for (let i = rangeStart; i <= rangeEnd; i++) {
        if (i >= 1 && i <= totalCount) {
          names[i - 1] = `${baseName}-${counter}`;
          counter++;
        }
      }
    }
  }

  if (!hasCustomMappings) {
    const baseName = input.trim();
    for (let i = 0; i < totalCount; i++) {
      names[i] = `${baseName}-${i + 1}`;
    }
  } else {
    // Fill unassigned slots: prefer the last seen base name over "Position".
    const fallbackBase = lastRangeBaseName || 'Position';
    for (let i = 0; i < totalCount; i++) {
      if (!names[i]) {
        names[i] = `${fallbackBase}-${i + 1}`;
      }
    }
  }

  return names;
}
