import { logger } from "../utils/logger";

class CacheService {
  private store = new Map<string, { expiresAt: number; value: unknown }>();

  get<T>(key: string): T | null {
    try {
      const item = this.store.get(key);
      if (!item) return null;
      if (Date.now() > item.expiresAt) {
        this.store.delete(key);
        return null;
      }
      return item.value as T;
    } catch (error) {
      logger.warn("cache.get.failed", { key, error: String(error) });
      return null;
    }
  }

  set<T>(key: string, value: T, ttlMs = 30000) {
    try {
      this.store.set(key, { value, expiresAt: Date.now() + ttlMs });
    } catch (error) {
      logger.warn("cache.set.failed", { key, error: String(error) });
    }
  }

  del(key: string) {
    try {
      this.store.delete(key);
    } catch (error) {
      logger.warn("cache.del.failed", { key, error: String(error) });
    }
  }

  invalidateRestaurant(restaurantId: string) {
    this.del("restaurants:list");
    this.del(menuKey(restaurantId));
  }

  ping() {
    try {
      this.set("__ping__", true, 1000);
      return this.get<boolean>("__ping__") === true;
    } catch {
      return false;
    }
  }
}

export function menuKey(restaurantId: string) {
  return `menu:${restaurantId}`;
}

export const cacheService = new CacheService();
