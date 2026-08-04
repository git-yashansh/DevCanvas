export interface CacheSetOptions {
  /** Time-To-Live in milliseconds */
  ttlMs?: number;
  /** Namespace or domain tags for selective invalidation */
  tags?: string[];
}

export interface CacheAdapter {
  /** Get cached value or null if expired/missing */
  get<T>(key: string): Promise<T | null>;

  /** Set cache key with optional TTL and tags */
  set<T>(key: string, value: T, options?: CacheSetOptions): Promise<void>;

  /** Delete specific cache key */
  delete(key: string): Promise<void>;

  /** Clear all cache entries */
  clear(): Promise<void>;

  /** Invalidate all entries matching prefix or tag pattern */
  invalidatePattern(pattern: string): Promise<void>;

  /**
   * Read-through cache fetcher with request coalescing (stampede protection).
   * Concurrent requests for the same key while fetching will share the same promise.
   */
  getOrSet<T>(key: string, fetcher: () => Promise<T>, options?: CacheSetOptions): Promise<T>;
}
