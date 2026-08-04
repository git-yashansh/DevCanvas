import type { CacheAdapter, CacheSetOptions } from "./cache-adapter";

interface CacheEntry<T> {
  value: T;
  expiresAt: number | null;
  tags?: string[];
}

export class InMemoryCacheAdapter implements CacheAdapter {
  private cache = new Map<string, CacheEntry<any>>();
  private inFlight = new Map<string, Promise<any>>();
  private maxEntries: number;

  constructor(maxEntries = 500) {
    this.maxEntries = maxEntries;

    // Periodic cleanup of expired items every 60 seconds
    if (typeof window !== "undefined") {
      setInterval(() => this.cleanupExpired(), 60000);
    }
  }

  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    // Refresh LRU ordering
    this.cache.delete(key);
    this.cache.set(key, entry);

    return entry.value as T;
  }

  async set<T>(key: string, value: T, options?: CacheSetOptions): Promise<void> {
    const ttlMs = options?.ttlMs ?? 5 * 60 * 1000; // Default 5 mins TTL
    const expiresAt = ttlMs > 0 ? Date.now() + ttlMs : null;

    // Enforce LRU eviction if capacity exceeded
    if (this.cache.size >= this.maxEntries && !this.cache.has(key)) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      value,
      expiresAt,
      tags: options?.tags,
    });
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async clear(): Promise<void> {
    this.cache.clear();
    this.inFlight.clear();
  }

  async invalidatePattern(pattern: string): Promise<void> {
    const regex = new RegExp("^" + pattern.replace(/\*/g, ".*"));
    for (const [key, entry] of this.cache.entries()) {
      if (regex.test(key) || entry.tags?.some((t) => regex.test(t))) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Read-through cache fetcher with request coalescing to prevent cache stampedes.
   */
  async getOrSet<T>(key: string, fetcher: () => Promise<T>, options?: CacheSetOptions): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) return cached;

    // If an identical request is already in-flight, return the existing Promise
    if (this.inFlight.has(key)) {
      return this.inFlight.get(key) as Promise<T>;
    }

    const promise = (async () => {
      try {
        const result = await fetcher();
        await this.set(key, result, options);
        return result;
      } finally {
        this.inFlight.delete(key);
      }
    })();

    this.inFlight.set(key, promise);
    return promise;
  }

  private cleanupExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt && now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }
}
