import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface CacheEntry {
  timestamp: number;
  data: unknown;
}

interface CardCacheDB extends DBSchema {
  cards: {
    key: string;
    value: CacheEntry;
    indexes: { 'by-timestamp': number };
  };
}

const DB_NAME = 'mtg-card-cache';
const DB_VERSION = 1;
const STORE_NAME = 'cards';
const CACHE_EXPIRATION_HOURS = 96;

class CardCache {
  private dbPromise: Promise<IDBPDatabase<CardCacheDB>>;

  constructor() {
    this.dbPromise = this.initDB();
  }

  private async initDB(): Promise<IDBPDatabase<CardCacheDB>> {
    return openDB<CardCacheDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const store = db.createObjectStore(STORE_NAME);
        store.createIndex('by-timestamp', 'timestamp');
      },
    });
  }

  async setItem(key: string, data: unknown): Promise<boolean> {
    try {
      const db = await this.dbPromise;
      const entry: CacheEntry = {
        timestamp: Date.now(),
        data,
      };

      await db.put(STORE_NAME, entry, key);
      return true;
    } catch (error) {
      console.error('Error storing item in IndexedDB:', error);
      return false;
    }
  }

  async getItem(key: string): Promise<unknown | null> {
    try {
      const db = await this.dbPromise;
      const entry = await db.get(STORE_NAME, key);

      if (!entry) {
        return null;
      }

      // Check if cache entry is still fresh
      const now = Date.now();
      const isFresh = now - entry.timestamp < CACHE_EXPIRATION_HOURS * 60 * 60 * 1000;

      if (!isFresh) {
        // Remove expired entry
        await this.removeItem(key);
        return null;
      }

      return entry.data;
    } catch (error) {
      console.error('Error retrieving item from IndexedDB:', error);
      return null;
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      const db = await this.dbPromise;
      await db.delete(STORE_NAME, key);
    } catch (error) {
      console.error('Error removing item from IndexedDB:', error);
    }
  }

  async clear(): Promise<void> {
    try {
      const db = await this.dbPromise;
      await db.clear(STORE_NAME);
    } catch (error) {
      console.error('Error clearing IndexedDB:', error);
    }
  }

  async getStorageSize(): Promise<number> {
    try {
      const db = await this.dbPromise;
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);

      let totalSize = 0;
      let cursor = await store.openCursor();

      while (cursor) {
        const key = cursor.key as string;
        const value = cursor.value;
        totalSize += key.length + JSON.stringify(value).length;
        cursor = await cursor.continue();
      }

      return totalSize;
    } catch (error) {
      console.error('Error calculating storage size:', error);
      return 0;
    }
  }

  async clearOldestEntries(keepCount: number = 50): Promise<void> {
    try {
      const db = await this.dbPromise;
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const index = store.index('by-timestamp');

      // Get all entries sorted by timestamp (oldest first)
      const entries: { key: string; timestamp: number }[] = [];
      let cursor = await index.openCursor();

      while (cursor) {
        entries.push({
          key: cursor.primaryKey as string,
          timestamp: cursor.value.timestamp,
        });
        cursor = await cursor.continue();
      }

      // Remove oldest entries if we exceed keepCount
      if (entries.length > keepCount) {
        const toRemove = entries.slice(0, entries.length - keepCount);

        for (const entry of toRemove) {
          await store.delete(entry.key);
        }

        console.log(`Cleared ${toRemove.length} old cache entries to free up space`);
      }

      await tx.done;
    } catch (error) {
      console.error('Error clearing oldest entries:', error);
    }
  }

  async getAllKeys(): Promise<string[]> {
    try {
      const db = await this.dbPromise;
      return await db.getAllKeys(STORE_NAME) as string[];
    } catch (error) {
      console.error('Error getting all keys:', error);
      return [];
    }
  }

  async getStats(): Promise<{ count: number; size: number; oldestEntry: number | null }> {
    try {
      const db = await this.dbPromise;
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);

      let count = 0;
      let totalSize = 0;
      let oldestTimestamp: number | null = null;

      let cursor = await store.openCursor();

      while (cursor) {
        count++;
        const key = cursor.key as string;
        const value = cursor.value;
        totalSize += key.length + JSON.stringify(value).length;

        if (oldestTimestamp === null || value.timestamp < oldestTimestamp) {
          oldestTimestamp = value.timestamp;
        }

        cursor = await cursor.continue();
      }

      return {
        count,
        size: totalSize,
        oldestEntry: oldestTimestamp,
      };
    } catch (error) {
      console.error('Error getting cache stats:', error);
      return { count: 0, size: 0, oldestEntry: null };
    }
  }
}

// Export singleton instance
export const cardCache = new CardCache();