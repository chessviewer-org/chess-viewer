export function parseSmartNaming(input: string, totalCount: number): string[] {
  const names = Array(totalCount).fill('');
  if (!input.trim()) return names;

  const tokens = input.split(',').map((t) => t.trim());
  let hasCustomMappings = false;

  for (const token of tokens) {
    const match = token.match(/^([^[]+)\[(\d+)-(\d+)\]$/);
    if (match) {
      hasCustomMappings = true;
      const baseName = (match[1] || '').trim();
      const start = parseInt(match[2] || '0', 10);
      const end = parseInt(match[3] || '0', 10);

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
    for (let i = 0; i < totalCount; i++) {
      if (!names[i]) {
        names[i] = `Position-${i + 1}`;
      }
    }
  }

  return names;
}
