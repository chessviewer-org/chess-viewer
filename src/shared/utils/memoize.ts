export function memoizeString<T>(
  compute: (key: string) => T,
  { limit = 256, maxKeyLength = 4096 } = {}
): (key: string) => T {
  const cache = new Map<string, T>();
  return (key) => {
    if (typeof key !== 'string' || key.length > maxKeyLength)
      return compute(key);
    if (cache.has(key)) {
      const hit = cache.get(key)!;
      cache.delete(key);
      cache.set(key, hit);
      return hit;
    }
    const value = compute(key);
    cache.set(key, value);
    if (cache.size > limit) cache.delete(cache.keys().next().value!);
    return value;
  };
}
