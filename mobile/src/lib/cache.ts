type Entry<T> = { value: T; at: number };

const store = new Map<string, Entry<unknown>>();

export async function withCache<T>(
  key: string,
  ttlMs: number,
  loader: () => Promise<T>,
): Promise<T> {
  const entry = store.get(key);
  if (entry && Date.now() - entry.at < ttlMs) return entry.value as T;
  const value = await loader();
  store.set(key, { value, at: Date.now() });
  return value;
}

export function clearCache(keyPrefix: string): void {
  for (const key of [...store.keys()]) {
    if (key.startsWith(keyPrefix)) store.delete(key);
  }
}
