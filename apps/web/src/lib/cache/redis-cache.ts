import type { CacheAdapter, CacheSetOptions } from "./cache-adapter";

/**
 * Blueprint for Redis Cache Adapter (e.g. Upstash Redis / Redis REST Gateway).
 * Automatically plugs in when VITE_REDIS_URL and VITE_REDIS_TOKEN environment variables are available.
 */
export class RedisCacheAdapter implements CacheAdapter {
  private redisUrl: string;
  private redisToken: string;
  private inFlight = new Map<string, Promise<any>>();

  constructor(url: string, token: string) {
    this.redisUrl = url.endsWith("/") ? url.slice(0, -1) : url;
    this.redisToken = token;
  }

  private async fetchRedis(command: string, ...args: (string | number)[]): Promise<any> {
    try {
      const response = await fetch(`${this.redisUrl}/${command}/${args.map(encodeURIComponent).join("/")}`, {
        headers: {
          Authorization: `Bearer ${this.redisToken}`,
        },
      });
      if (!response.ok) return null;
      const data = await response.json();
      return data.result;
    } catch (err) {
      console.warn("[Redis Cache Warning] Redis REST request failed:", err);
      return null;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    const raw = await this.fetchRedis("get", key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return raw as T;
    }
  }

  async set<T>(key: string, value: T, options?: CacheSetOptions): Promise<void> {
    const serialized = typeof value === "string" ? value : JSON.stringify(value);
    const ttlSeconds = Math.ceil((options?.ttlMs ?? 5 * 60 * 1000) / 1000);

    if (ttlSeconds > 0) {
      await this.fetchRedis("setex", key, ttlSeconds, serialized);
    } else {
      await this.fetchRedis("set", key, serialized);
    }
  }

  async delete(key: string): Promise<void> {
    await this.fetchRedis("del", key);
  }

  async clear(): Promise<void> {
    await this.fetchRedis("flushdb");
    this.inFlight.clear();
  }

  async invalidatePattern(pattern: string): Promise<void> {
    const keys = await this.fetchRedis("keys", pattern);
    if (Array.isArray(keys) && keys.length > 0) {
      for (const k of keys) {
        await this.delete(k);
      }
    }
  }

  async getOrSet<T>(key: string, fetcher: () => Promise<T>, options?: CacheSetOptions): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) return cached;

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
}
