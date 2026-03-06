import { registerSound, getAudioContext } from '@strudel/webaudio';

/**
 * SampleManager handles loading, registering, and persisting custom audio
 * samples so they can be referenced by name in Strudel patterns.
 *
 * Custom samples are stored in IndexedDB for persistence across sessions.
 * On startup, previously-stored samples are reloaded and re-registered with
 * Strudel's sound map.
 */

// ─── IndexedDB constants ────────────────────────────────────

const DB_NAME = 'program-beats-samples';
const DB_VERSION = 1;
const STORE_NAME = 'samples';

// ─── Types ──────────────────────────────────────────────────

export interface CustomSample {
  /** Name used to reference this sample in Strudel patterns (e.g. "kick1") */
  name: string;
  /** Original filename (for display purposes) */
  filename: string;
  /** Raw audio data stored as ArrayBuffer for IndexedDB persistence */
  data: ArrayBuffer;
  /** MIME type of the original file */
  mimeType: string;
  /** Timestamp of when the sample was added */
  addedAt: number;
}

/** Lightweight metadata returned when listing samples (no heavy ArrayBuffer). */
export interface SampleInfo {
  name: string;
  filename: string;
  mimeType: string;
  addedAt: number;
}

// ─── Built-in samples reference ─────────────────────────────

/**
 * Common Strudel built-in / synthesized sounds that are always available
 * when using @strudel/webaudio with registerSynthSounds().
 */
export const BUILTIN_SYNTH_SOUNDS: readonly string[] = [
  'sine',
  'square',
  'triangle',
  'sawtooth',
  'supersaw',
  'supersquare',
  'supertriangle',
  'supersine',
] as const;

/**
 * A curated list of commonly-used sample names from the default Strudel
 * sample bank (dirt-samples / strudel-samples). These become available
 * when samples are loaded from the Strudel CDN via `samples(...)`.
 *
 * This list is non-exhaustive; use it for UI auto-complete / suggestions.
 */
export const COMMON_DIRT_SAMPLES: readonly string[] = [
  // Drums
  'bd', 'sd', 'hh', 'oh', 'cp', 'mt', 'ht', 'lt',
  'rim', 'cb', 'cr', 'ride', 'tom',
  // Misc
  'arpy', 'bass', 'bass3', 'casio', 'east',
  'feel', 'flick', 'future', 'gab', 'glitch',
  'hand', 'house', 'industrial', 'jazz',
  'jvbass', 'kurt', 'latibro', 'led',
  'metal', 'moan', 'mouth', 'numbers',
  'oc', 'peri', 'pluck', 'print',
  'procshort', 'psr', 'rave', 'rave2',
  'sax', 'sf', 'sheffield', 'sine',
  'space', 'speech', 'speechless', 'stab',
  'stomp', 'sundance', 'tabla', 'tabla2',
  'tech', 'techno', 'tink', 'tok',
  'ul', 'ulgab', 'voodoo',
] as const;

// ─── SampleManager class ────────────────────────────────────

export class SampleManager {
  private db: IDBDatabase | null = null;
  private loadedSamples: Map<string, CustomSample> = new Map();

  // ─── Initialization ───────────────────────────────────────

  /**
   * Open the IndexedDB database and reload any previously-stored samples.
   * Call this once at app startup (after StrudelEngine.init()).
   */
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
          db.createObjectStore(STORE_NAME, { keyPath: 'name' });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // ─── Loading from files ───────────────────────────────────

  /**
   * Load an audio file (from an <input type="file"> or drag-and-drop),
   * decode it, register it with Strudel, and persist it in IndexedDB.
   *
   * @param file - The File object from the browser file API
   * @param name - Optional custom name; defaults to the filename without extension
   * @returns The sample info after registration
   */
  async loadSampleFromFile(file: File, name?: string): Promise<SampleInfo> {
    const sampleName = name ?? this.sanitizeName(file.name);
    const arrayBuffer = await file.arrayBuffer();

    const sample: CustomSample = {
      name: sampleName,
      filename: file.name,
      data: arrayBuffer,
      mimeType: file.type || 'audio/wav',
      addedAt: Date.now(),
    };

    // Decode and register with Strudel
    await this.decodeAndRegister(sample);

    // Persist
    this.loadedSamples.set(sampleName, sample);
    await this.saveToDB(sample);

    return {
      name: sample.name,
      filename: sample.filename,
      mimeType: sample.mimeType,
      addedAt: sample.addedAt,
    };
  }

  /**
   * Load a sample from a raw ArrayBuffer (e.g. fetched from a URL).
   */
  async loadSampleFromBuffer(
    arrayBuffer: ArrayBuffer,
    name: string,
    filename: string = name,
    mimeType: string = 'audio/wav',
  ): Promise<SampleInfo> {
    const sampleName = this.sanitizeName(name);

    const sample: CustomSample = {
      name: sampleName,
      filename,
      data: arrayBuffer,
      mimeType,
      addedAt: Date.now(),
    };

    await this.decodeAndRegister(sample);
    this.loadedSamples.set(sampleName, sample);
    await this.saveToDB(sample);

    return {
      name: sample.name,
      filename: sample.filename,
      mimeType: sample.mimeType,
      addedAt: sample.addedAt,
    };
  }

  // ─── Registration with Strudel ────────────────────────────

  /**
   * Decode an ArrayBuffer into an AudioBuffer, then register it as a
   * Strudel sound so it can be used via `s("sampleName")` in patterns.
   */
  private async decodeAndRegister(sample: CustomSample): Promise<void> {
    const ctx = getAudioContext();
    // We need to clone the ArrayBuffer because decodeAudioData detaches it
    const bufferCopy = sample.data.slice(0);
    const audioBuffer = await ctx.decodeAudioData(bufferCopy);

    // registerSound makes the sample available to Strudel's webaudio output.
    // The callback returns an object with an `node` AudioBufferSourceNode.
    registerSound(sample.name, (time: number, hapValue: Record<string, unknown>, currentTime: number) => {
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;

      const gainNode = ctx.createGain();
      const gain = typeof hapValue.gain === 'number' ? hapValue.gain : 1;
      gainNode.gain.setValueAtTime(gain, time);

      source.connect(gainNode);
      gainNode.connect(ctx.destination);

      source.start(time);

      return { node: gainNode, stop: (releaseTime: number) => source.stop(releaseTime) };
    });
  }

  // ─── IndexedDB persistence ────────────────────────────────

  private saveToDB(sample: CustomSample): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('IndexedDB not initialized'));
        return;
      }
      const tx = this.db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.put(sample);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private async reloadAllFromDB(): Promise<void> {
    const allSamples = await this.getAllFromDB();
    for (const sample of allSamples) {
      try {
        await this.decodeAndRegister(sample);
        this.loadedSamples.set(sample.name, sample);
      } catch (err) {
        console.warn(`SampleManager: failed to reload sample "${sample.name}"`, err);
      }
    }
  }

  private getAllFromDB(): Promise<CustomSample[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        resolve([]);
        return;
      }
      const tx = this.db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result as CustomSample[]);
      request.onerror = () => reject(request.error);
    });
  }

  // ─── Deletion ─────────────────────────────────────────────

  async removeSample(name: string): Promise<void> {
    this.loadedSamples.delete(name);
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.delete(name);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clearAllSamples(): Promise<void> {
    this.loadedSamples.clear();
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // ─── Query methods ────────────────────────────────────────

  /** List all loaded custom samples (metadata only). */
  getLoadedSamples(): SampleInfo[] {
    return Array.from(this.loadedSamples.values()).map((s) => ({
      name: s.name,
      filename: s.filename,
      mimeType: s.mimeType,
      addedAt: s.addedAt,
    }));
  }

  /** Check whether a sample name is already registered. */
  hasSample(name: string): boolean {
    return this.loadedSamples.has(name);
  }

  /** Get the list of built-in synth sound names. */
  getBuiltinSynthSounds(): readonly string[] {
    return BUILTIN_SYNTH_SOUNDS;
  }

  /** Get the curated list of common dirt-sample names. */
  getCommonDirtSamples(): readonly string[] {
    return COMMON_DIRT_SAMPLES;
  }

  /** Combined list: built-in + dirt-samples + custom, for autocomplete. */
  getAllAvailableSampleNames(): string[] {
    return [
      ...BUILTIN_SYNTH_SOUNDS,
      ...COMMON_DIRT_SAMPLES,
      ...this.loadedSamples.keys(),
    ];
  }

  // ─── Utilities ────────────────────────────────────────────

  /**
   * Sanitize a filename into a valid Strudel sample name:
   * lowercase, no extension, replace non-alphanumeric with underscore.
   */
  private sanitizeName(filename: string): string {
    const base = filename.replace(/\.[^.]+$/, ''); // strip extension
    return base
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  }

  dispose(): void {
    this.loadedSamples.clear();
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

/** Singleton instance for the app */
export const sampleManager = new SampleManager();
