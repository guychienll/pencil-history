/**
 * Diff Result Cache
 *
 * Feature: User Story 3 - Diff Comparison
 * Task: T088
 *
 * Implements memoization cache for diff results to avoid redundant computation.
 * Diff results are immutable (commit SHAs don't change), so they can be cached indefinitely.
 */

import type { DiffResult } from "./types";
import { createDiffCacheKey } from "./types";

/**
 * In-memory LRU cache for diff results
 */
class DiffCache {
  private cache: Map<string, DiffResult>;
  private maxSize: number;
  private accessOrder: string[]; // Track access order for LRU

  constructor(maxSize: number = 50) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.accessOrder = [];
  }

  /**
   * Get diff from cache
   */
  get(fromSha: string, toSha: string): DiffResult | null {
    const key = createDiffCacheKey(fromSha, toSha);
    const result = this.cache.get(key);

    if (result) {
      // Update access order (move to end)
      this.updateAccessOrder(key);
      return result;
    }

    return null;
  }

  /**
   * Store diff in cache
   */
  set(fromSha: string, toSha: string, diff: DiffResult): void {
    const key = createDiffCacheKey(fromSha, toSha);

    // If cache is full, evict least recently used
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictLRU();
    }

    this.cache.set(key, diff);
    this.updateAccessOrder(key);
  }

  /**
   * Check if diff is cached
   */
  has(fromSha: string, toSha: string): boolean {
    const key = createDiffCacheKey(fromSha, toSha);
    return this.cache.has(key);
  }

  /**
   * Clear entire cache
   */
  clear(): void {
    this.cache.clear();
    this.accessOrder = [];
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; maxSize: number; hitRate: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: 0, // TODO: Track hits/misses for actual hit rate
    };
  }

  /**
   * Update access order for LRU
   */
  private updateAccessOrder(key: string): void {
    // Remove key from current position
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }

    // Add to end (most recently used)
    this.accessOrder.push(key);
  }

  /**
   * Evict least recently used item
   */
  private evictLRU(): void {
    if (this.accessOrder.length === 0) return;

    const lruKey = this.accessOrder.shift()!;
    this.cache.delete(lruKey);
  }
}

// Singleton instance
let diffCacheInstance: DiffCache | null = null;

/**
 * Get the singleton diff cache instance
 */
export function getDiffCache(): DiffCache {
  if (!diffCacheInstance) {
    diffCacheInstance = new DiffCache(50); // Cache up to 50 diff results
  }
  return diffCacheInstance;
}

/**
 * Memoized diff computation wrapper
 *
 * Usage:
 * ```ts
 * const diff = await memoizedDiff(
 *   fromSha,
 *   toSha,
 *   async () => {
 *     const oldFile = await fetchFileVersion(fromSha);
 *     const newFile = await fetchFileVersion(toSha);
 *     return compareNodes(oldFile.content.root, newFile.content.root, fromSha, toSha);
 *   }
 * );
 * ```
 */
export async function memoizedDiff(
  fromSha: string,
  toSha: string,
  computeFn: () => Promise<DiffResult>
): Promise<DiffResult> {
  const cache = getDiffCache();

  // Check cache first
  const cached = cache.get(fromSha, toSha);
  if (cached) {
    return cached;
  }

  // Compute diff
  const result = await computeFn();

  // Store in cache
  cache.set(fromSha, toSha, result);

  return result;
}

/**
 * Synchronous version of memoizedDiff
 */
export function memoizedDiffSync(
  fromSha: string,
  toSha: string,
  computeFn: () => DiffResult
): DiffResult {
  const cache = getDiffCache();

  // Check cache first
  const cached = cache.get(fromSha, toSha);
  if (cached) {
    return cached;
  }

  // Compute diff
  const result = computeFn();

  // Store in cache
  cache.set(fromSha, toSha, result);

  return result;
}

/**
 * Clear diff cache (useful for testing or memory management)
 */
export function clearDiffCache(): void {
  const cache = getDiffCache();
  cache.clear();
}

/**
 * Get diff cache statistics
 */
export function getDiffCacheStats(): { size: number; maxSize: number; hitRate: number } {
  const cache = getDiffCache();
  return cache.getStats();
}

/**
 * Prefetch and cache a diff (useful for preloading adjacent commits)
 */
export async function prefetchDiff(
  fromSha: string,
  toSha: string,
  computeFn: () => Promise<DiffResult>
): Promise<void> {
  const cache = getDiffCache();

  // Only compute if not already cached
  if (!cache.has(fromSha, toSha)) {
    const result = await computeFn();
    cache.set(fromSha, toSha, result);
  }
}
