import { Injectable } from '@angular/core';

/**
 * Cache entry with metadata
 */
interface CacheEntry<T> {
    data: T;
    timestamp: number;
}

/**
 * Cache service with in-memory and localStorage persistence
 */
@Injectable({
    providedIn: 'root',
})
export class CacheService {
    private cache = new Map<string, CacheEntry<any>>();
    private readonly CACHE_PREFIX = 'cache_';

    /**
     * Set cache entry
     * @param key Cache key
     * @param value Value to cache
     */
    set<T>(key: string, value: T): void {
        const entry: CacheEntry<T> = {
            data: value,
            timestamp: Date.now(),
        };

        // Store in memory
        this.cache.set(key, entry);

        // Persist to localStorage for offline support
        try {
            localStorage.setItem(
                this.CACHE_PREFIX + key,
                JSON.stringify(entry),
            );
        } catch (error) {
            console.warn('Failed to persist cache to localStorage:', error);
        }
    }

    /**
     * Get cache entry
     * @param key Cache key
     * @returns Cached value or null if not found
     */
    get<T>(key: string): T | null {
        // Check memory cache first
        if (this.cache.has(key)) {
            return this.cache.get(key)!.data as T;
        }

        // Fallback to localStorage
        try {
            const stored = localStorage.getItem(this.CACHE_PREFIX + key);
            if (stored) {
                const entry: CacheEntry<T> = JSON.parse(stored);
                // Restore to memory
                this.cache.set(key, entry);
                return entry.data;
            }
        } catch (error) {
            console.warn('Failed to read from localStorage:', error);
        }

        return null;
    }

    /**
     * Get cache entry with timestamp
     * @param key Cache key
     * @returns Cache entry with metadata or null if not found
     */
    getWithTimestamp<T>(key: string): CacheEntry<T> | null {
        // Check memory cache first
        if (this.cache.has(key)) {
            return this.cache.get(key)! as CacheEntry<T>;
        }

        // Fallback to localStorage
        try {
            const stored = localStorage.getItem(this.CACHE_PREFIX + key);
            if (stored) {
                const entry: CacheEntry<T> = JSON.parse(stored);
                // Restore to memory
                this.cache.set(key, entry);
                return entry;
            }
        } catch (error) {
            console.warn('Failed to read from localStorage:', error);
        }

        return null;
    }

    /**
     * Delete cache entry
     * @param key Cache key
     */
    delete(key: string): void {
        this.cache.delete(key);
        localStorage.removeItem(this.CACHE_PREFIX + key);
    }

    /**
     * Clear all cache
     */
    clear(): void {
        this.cache.clear();

        // Clear all cache entries from localStorage
        const keys = Object.keys(localStorage);
        keys.forEach((key) => {
            if (key.startsWith(this.CACHE_PREFIX)) {
                localStorage.removeItem(key);
            }
        });
    }

    /**
     * Get cache size (number of entries)
     * @returns Number of cached entries
     */
    size(): number {
        return this.cache.size;
    }

    /**
     * Check if key exists in cache
     * @param key Cache key
     * @returns True if key exists
     */
    has(key: string): boolean {
        return (
            this.cache.has(key) ||
            localStorage.getItem(this.CACHE_PREFIX + key) !== null
        );
    }
}
