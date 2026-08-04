import type { CacheAdapter } from "./cache-adapter";
import { InMemoryCacheAdapter } from "./in-memory-cache";
import { RedisCacheAdapter } from "./redis-cache";

// Read environment variables for optional Redis server connection
const redisUrl = (import.meta as any).env?.VITE_REDIS_URL;
const redisToken = (import.meta as any).env?.VITE_REDIS_TOKEN;

// Initialize CacheAdapter singleton
export const cacheManager: CacheAdapter =
  redisUrl && redisToken
    ? new RedisCacheAdapter(redisUrl, redisToken)
    : new InMemoryCacheAdapter();

/** Cache Invalidation Helpers for DevCanvas Domains */
export const CacheDomains = {
  invalidateDashboard: () => cacheManager.invalidatePattern("admin:dashboard:*"),
  invalidateUsers: () => cacheManager.invalidatePattern("admin:users:*"),
  invalidateProjects: () => cacheManager.invalidatePattern("projects:*"),
  invalidateTickets: () => cacheManager.invalidatePattern("tickets:*"),
  invalidateFeatureFlags: () => cacheManager.invalidatePattern("feature_flags:*"),
  invalidateAnalytics: () => cacheManager.invalidatePattern("analytics:*"),
  invalidateAll: () => cacheManager.clear(),
};

export type { CacheAdapter, CacheSetOptions } from "./cache-adapter";
