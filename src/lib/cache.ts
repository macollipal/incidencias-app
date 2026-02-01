type CacheEntry<T> = {
  data: T;
  timestamp: number;
};

const cache = new Map<string, CacheEntry<unknown>>();

/**
 * Get a cached value if it exists and hasn't expired
 * @param key Cache key
 * @param ttlMs Time-to-live in milliseconds
 * @returns Cached data or null if expired/not found
 */
export function getCache<T>(key: string, ttlMs: number): T | null {
  const entry = cache.get(key) as CacheEntry<T> | undefined;
  if (!entry) return null;

  if (Date.now() - entry.timestamp > ttlMs) {
    cache.delete(key);
    return null;
  }

  return entry.data;
}

/**
 * Set a value in the cache
 * @param key Cache key
 * @param data Data to cache
 */
export function setCache<T>(key: string, data: T): void {
  cache.set(key, { data, timestamp: Date.now() });
}

/**
 * Invalidate cache entries matching a prefix
 * @param pattern Prefix pattern to match
 */
export function invalidateCache(pattern: string): void {
  for (const key of cache.keys()) {
    if (key.startsWith(pattern)) {
      cache.delete(key);
    }
  }
}

/**
 * Clear all cache entries
 */
export function clearCache(): void {
  cache.clear();
}
