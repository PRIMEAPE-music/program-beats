import type { TrackType } from './types';

// ─── Types ──────────────────────────────────────────────────

export interface SavedPattern {
  id: string;
  name: string;
  pattern: string;
  trackType: TrackType;
  tags: string[];
  savedAt: number;
}

// ─── IndexedDB constants ────────────────────────────────────

const DB_NAME = 'program-beats-patterns';
const DB_VERSION = 1;
const STORE_NAME = 'patterns';

// ─── PatternLibrary class ───────────────────────────────────

export class PatternLibrary {
  private db: IDBDatabase | null = null;
  private patterns: Map<string, SavedPattern> = new Map();

  // ─── Initialization ───────────────────────────────────────

  async init(): Promise<void> {
    this.db = await this.openDB();
    await this.reloadAllFromDB();
  }

  private openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('trackType', 'trackType', { unique: false });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // ─── CRUD Operations ──────────────────────────────────────

  async savePattern(
    name: string,
    pattern: string,
    trackType: TrackType,
    tags: string[] = [],
  ): Promise<SavedPattern> {
    const saved: SavedPattern = {
      id: crypto.randomUUID(),
      name,
      pattern,
      trackType,
      tags,
      savedAt: Date.now(),
    };

    this.patterns.set(saved.id, saved);
    await this.saveToDB(saved);
    return saved;
  }

  async deletePattern(id: string): Promise<void> {
    this.patterns.delete(id);
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  getAllPatterns(): SavedPattern[] {
    return Array.from(this.patterns.values()).sort(
      (a, b) => b.savedAt - a.savedAt,
    );
  }

  getPatternsByType(type: TrackType): SavedPattern[] {
    return this.getAllPatterns().filter((p) => p.trackType === type);
  }

  // ─── IndexedDB persistence ────────────────────────────────

  private saveToDB(pattern: SavedPattern): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('IndexedDB not initialized'));
        return;
      }
      const tx = this.db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.put(pattern);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private async reloadAllFromDB(): Promise<void> {
    const all = await this.getAllFromDB();
    for (const p of all) {
      this.patterns.set(p.id, p);
    }
  }

  private getAllFromDB(): Promise<SavedPattern[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        resolve([]);
        return;
      }
      const tx = this.db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result as SavedPattern[]);
      request.onerror = () => reject(request.error);
    });
  }

  // ─── Cleanup ──────────────────────────────────────────────

  dispose(): void {
    this.patterns.clear();
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

/** Singleton instance for the app */
export const patternLibrary = new PatternLibrary();
