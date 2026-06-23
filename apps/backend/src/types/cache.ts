export interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

export interface CacheStore {
  get<T>(key: string): T | null;
  set<T>(key: string, data: T, ttlMs: number): void;
  delete(key: string): void;
  clear(): void;
}
