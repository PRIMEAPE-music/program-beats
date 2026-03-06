import { evalScope } from '@strudel/core';
import * as core from '@strudel/core';
import * as mini from '@strudel/mini';
import * as webaudio from '@strudel/webaudio';
import { webaudioRepl, initAudio, getAudioContext, registerSynthSounds, samples } from '@strudel/webaudio';
import * as tonal from '@strudel/tonal';
import type { TrackEffects, MasterEffects } from './types';

/**
 * StrudelEngine wraps Strudel's WebAudio capabilities for multi-track playback.
 *
 * Uses webaudioRepl() which properly sets up the Cyclist scheduler with
 * webaudioOutput as the default output, and provides evaluate/start/stop/setCps.
 */

interface TrackState {
  pattern: string;
  volume: number;
  muted: boolean;
  solo: boolean;
  effects?: TrackEffects;
}

interface StrudelRepl {
  scheduler: any;
  evaluate: (code: string, autostart?: boolean) => Promise<any>;
  start: () => void;
  stop: () => void;
  pause: () => void;
  setCps: (cps: number) => void;
  setPattern: (pattern: any, autostart?: boolean) => Promise<any>;
  toggle: () => void;
  state: any;
}

export class StrudelEngine {
  private repl: StrudelRepl | null = null;
  private audioContext: AudioContext | null = null;
  private tracks: Map<string, TrackState> = new Map();
  private bpm: number = 120;
  private isPlaying: boolean = false;
  private initialized: boolean = false;
  private masterEffects: MasterEffects = { reverb: 0.1, delay: 0, compression: 0.3 };

  // ─── Lifecycle ──────────────────────────────────────────────

  async init(): Promise<void> {
    if (this.initialized) return;

    console.log('[StrudelEngine] Initializing...');

    // Register all Strudel functions on globalThis so evaluate() can find them
    await evalScope(
      core,
      mini,
      webaudio,
      tonal,
    );
    console.log('[StrudelEngine] evalScope done, globalThis.s:', typeof (globalThis as any).s);

    // Enable mini-notation parsing for double-quoted strings in evaluate()
    if (typeof mini.miniAllStrings === 'function') {
      mini.miniAllStrings();
      console.log('[StrudelEngine] miniAllStrings registered');
    }

    // Initialize audio (must be called during a user gesture)
    await initAudio();
    console.log('[StrudelEngine] initAudio done');

    // Register built-in synth oscillator sounds (sine, sawtooth, triangle, square, etc.)
    registerSynthSounds();
    console.log('[StrudelEngine] registerSynthSounds done');

    // Load drum/instrument samples from Strudel's default sample bank
    await samples('github:tidalcycles/dirt-samples');
    console.log('[StrudelEngine] dirt-samples loaded');

    this.audioContext = getAudioContext();
    console.log('[StrudelEngine] audioContext state:', this.audioContext?.state);

    // Create the repl — this sets up Cyclist + webaudioOutput properly
    this.repl = webaudioRepl() as StrudelRepl;
    console.log('[StrudelEngine] repl created');

    // Set initial CPS (cycles per second: bpm / 60 / 4 for 4-beat cycles)
    this.repl.setCps(this.bpm / 60 / 4);

    this.initialized = true;
    console.log('[StrudelEngine] Initialized successfully');
  }

  // ─── Transport ──────────────────────────────────────────────

  async play(): Promise<void> {
    if (!this.repl) {
      console.warn('StrudelEngine: call init() before play()');
      return;
    }

    await this.rebuildAndSetPattern();
    this.isPlaying = true;
  }

  stop(): void {
    if (!this.repl) return;
    this.repl.stop();
    this.isPlaying = false;
  }

  pause(): void {
    this.stop();
  }

  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  // ─── BPM ────────────────────────────────────────────────────

  setBpm(bpm: number): void {
    this.bpm = bpm;
    if (this.repl) {
      this.repl.setCps(this.bpm / 60 / 4);
    }
  }

  getBpm(): number {
    return this.bpm;
  }

  // ─── Per-track pattern management ───────────────────────────

  updatePattern(trackId: string, pattern: string): void {
    const existing = this.tracks.get(trackId);
    if (existing) {
      existing.pattern = pattern;
    } else {
      this.tracks.set(trackId, {
        pattern,
        volume: 1,
        muted: false,
        solo: false,
      });
    }
    if (this.isPlaying) {
      this.rebuildAndSetPattern();
    }
  }

  removeTrack(trackId: string): void {
    this.tracks.delete(trackId);
    if (this.isPlaying) {
      this.rebuildAndSetPattern();
    }
  }

  // ─── Mixing ─────────────────────────────────────────────────

  setTrackVolume(trackId: string, volume: number): void {
    const t = this.tracks.get(trackId);
    if (t) {
      t.volume = Math.max(0, Math.min(1, volume));
      if (this.isPlaying) this.rebuildAndSetPattern();
    }
  }

  setTrackMute(trackId: string, muted: boolean): void {
    const t = this.tracks.get(trackId);
    if (t) {
      t.muted = muted;
      if (this.isPlaying) this.rebuildAndSetPattern();
    }
  }

  setTrackSolo(trackId: string, solo: boolean): void {
    const t = this.tracks.get(trackId);
    if (t) {
      t.solo = solo;
      if (this.isPlaying) this.rebuildAndSetPattern();
    }
  }

  // ─── Effects ───────────────────────────────────────────────

  updateTrackEffects(trackId: string, effects: TrackEffects): void {
    const t = this.tracks.get(trackId);
    if (t) {
      t.effects = effects;
      if (this.isPlaying) this.rebuildAndSetPattern();
    }
  }

  setMasterEffects(effects: MasterEffects): void {
    this.masterEffects = effects;
    if (this.isPlaying) this.rebuildAndSetPattern();
  }

  // ─── Pattern building ───────────────────────────────────────

  private async rebuildAndSetPattern(): Promise<void> {
    const combined = this.buildCombinedPattern();
    if (!combined || !this.repl) return;

    try {
      await this.repl.evaluate(combined, true);
    } catch (err) {
      console.error('StrudelEngine: pattern evaluation error', err);
    }
  }

  buildCombinedPattern(): string | null {
    const entries = Array.from(this.tracks.entries());
    if (entries.length === 0) return null;

    const anySoloed = entries.some(([, t]) => t.solo);

    const audible = entries.filter(([, t]) => {
      if (anySoloed) return t.solo && !t.muted;
      return !t.muted;
    });

    if (audible.length === 0) return 'silence';

    const parts = audible.map(([, t]) => {
      const gainStr = t.volume < 1 ? `.gain(${t.volume.toFixed(2)})` : '';

      let fxStr = '';
      if (t.effects) {
        if (t.effects.delay > 0) fxStr += `.delay(${t.effects.delay.toFixed(2)})`;
        if (t.effects.reverb > 0) fxStr += `.room(${t.effects.reverb.toFixed(2)})`;
        if (t.effects.lpf < 20000) fxStr += `.lpf(${t.effects.lpf})`;
        if (t.effects.hpf > 20) fxStr += `.hpf(${t.effects.hpf})`;
        if (t.effects.distortion > 0) fxStr += `.distortion(${t.effects.distortion.toFixed(2)})`;
      }

      return `(${t.pattern})${gainStr}${fxStr}`;
    });

    let combined: string;
    if (parts.length === 1) {
      combined = parts[0];
    } else {
      combined = `stack(${parts.join(', ')})`;
    }

    const me = this.masterEffects;
    if (me.reverb > 0) combined += `.room(${me.reverb.toFixed(2)})`;
    if (me.delay > 0) combined += `.delay(${me.delay.toFixed(2)})`;
    if (me.compression > 0) combined += `.compress(${me.compression.toFixed(2)})`;

    return combined;
  }

  async previewPattern(code: string): Promise<void> {
    if (!this.repl) {
      console.warn('StrudelEngine: call init() before previewPattern()');
      return;
    }

    try {
      this.repl.setCps(this.bpm / 60 / 4);
      await this.repl.evaluate(code, true);
      this.isPlaying = true;
    } catch (err) {
      console.error('StrudelEngine: preview pattern error', err);
    }
  }

  async playPatternString(patternString: string): Promise<void> {
    if (!this.repl) {
      console.warn('StrudelEngine: call init() before playPatternString()');
      return;
    }

    try {
      const cps = this.bpm / 60 / 4;
      console.log('[StrudelEngine] playPatternString, cps:', cps, 'pattern:', patternString.slice(0, 200));
      this.repl.setCps(cps);
      const result = await this.repl.evaluate(patternString, true);
      console.log('[StrudelEngine] evaluate result:', result);
      this.isPlaying = true;
    } catch (err) {
      console.error('StrudelEngine: playPatternString error', err);
    }
  }

  // ─── Utilities ──────────────────────────────────────────────

  getAudioContext(): AudioContext | null {
    return this.audioContext;
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  dispose(): void {
    this.stop();
    this.tracks.clear();
    this.repl = null;
    this.audioContext = null;
    this.initialized = false;
  }
}

/** Singleton instance for the app */
export const strudelEngine = new StrudelEngine();
