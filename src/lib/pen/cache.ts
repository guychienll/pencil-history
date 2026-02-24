// Cache utilities using idb-keyval and in-memory LRU cache

import { get, set, clear } from "idb-keyval";
import { FileVersion } from "@/types/app";

// ===== IndexedDB Cache (Persistent) =====

const CACHE_PREFIX = "pencilhistory";

function getCacheKey(owner: string, repo: string, path: string, sha: string): string {
  return `${CACHE_PREFIX}:${owner}/${repo}/${path}@${sha}`;
}

export async function cacheFileVersion(
  owner: string,
  repo: string,
  path: string,
  sha: string,
  fileVersion: FileVersion
): Promise<void> {
  const key = getCacheKey(owner, repo, path, sha);
  await set(key, fileVersion);
}

export async function getCachedFileVersion(
  owner: string,
  repo: string,
  path: string,
  sha: string
): Promise<FileVersion | undefined> {
  const key = getCacheKey(owner, repo, path, sha);
  return await get<FileVersion>(key);
}

export async function clearFileVersionCache(): Promise<void> {
  await clear();
}

// ===== In-Memory LRU Cache =====

interface LRUNode<T> {
  key: string;
  value: T;
  prev: LRUNode<T> | null;
  next: LRUNode<T> | null;
}

export class LRUCache<T> {
  private capacity: number;
  private cache: Map<string, LRUNode<T>>;
  private head: LRUNode<T> | null;
  private tail: LRUNode<T> | null;

  constructor(capacity: number) {
    this.capacity = capacity;
    this.cache = new Map();
    this.head = null;
    this.tail = null;
  }

  get(key: string): T | undefined {
    const node = this.cache.get(key);
    if (!node) return undefined;

    // Move to front (most recently used)
    this.moveToFront(node);
    return node.value;
  }

  set(key: string, value: T): void {
    let node = this.cache.get(key);

    if (node) {
      // Update existing node
      node.value = value;
      this.moveToFront(node);
    } else {
      // Create new node
      node = { key, value, prev: null, next: null };
      this.cache.set(key, node);
      this.addToFront(node);

      // Evict LRU if over capacity
      if (this.cache.size > this.capacity) {
        this.evictLRU();
      }
    }
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  delete(key: string): boolean {
    const node = this.cache.get(key);
    if (!node) return false;

    this.removeNode(node);
    this.cache.delete(key);
    return true;
  }

  clear(): void {
    this.cache.clear();
    this.head = null;
    this.tail = null;
  }

  size(): number {
    return this.cache.size;
  }

  private moveToFront(node: LRUNode<T>): void {
    if (node === this.head) return;
    this.removeNode(node);
    this.addToFront(node);
  }

  private addToFront(node: LRUNode<T>): void {
    node.next = this.head;
    node.prev = null;

    if (this.head) {
      this.head.prev = node;
    }

    this.head = node;

    if (!this.tail) {
      this.tail = node;
    }
  }

  private removeNode(node: LRUNode<T>): void {
    if (node.prev) {
      node.prev.next = node.next;
    } else {
      this.head = node.next;
    }

    if (node.next) {
      node.next.prev = node.prev;
    } else {
      this.tail = node.prev;
    }
  }

  private evictLRU(): void {
    if (!this.tail) return;

    this.cache.delete(this.tail.key);
    const newTail = this.tail.prev;

    if (newTail) {
      newTail.next = null;
    } else {
      this.head = null;
    }

    this.tail = newTail;
  }
}

// Global in-memory cache instance (max 50 FileVersions)
export const fileVersionCache = new LRUCache<FileVersion>(50);

// Screenshot cache (max 100 screenshots)
export const screenshotCache = new LRUCache<string>(100);

// Helper function: Try memory cache first, then IndexedDB
export async function getFileVersionFromCache(
  owner: string,
  repo: string,
  path: string,
  sha: string
): Promise<FileVersion | undefined> {
  const cacheKey = getCacheKey(owner, repo, path, sha);

  // Try memory cache first (fast)
  let fileVersion = fileVersionCache.get(cacheKey);
  if (fileVersion) {
    return fileVersion;
  }

  // Try IndexedDB (slower but persistent)
  fileVersion = await getCachedFileVersion(owner, repo, path, sha);
  if (fileVersion) {
    // Promote to memory cache
    fileVersionCache.set(cacheKey, fileVersion);
    return fileVersion;
  }

  return undefined;
}

// Helper function: Save to both memory and IndexedDB
export async function saveFileVersionToCache(
  owner: string,
  repo: string,
  path: string,
  sha: string,
  fileVersion: FileVersion
): Promise<void> {
  const cacheKey = getCacheKey(owner, repo, path, sha);

  // Save to memory cache
  fileVersionCache.set(cacheKey, fileVersion);

  // Save to IndexedDB
  await cacheFileVersion(owner, repo, path, sha, fileVersion);
}
