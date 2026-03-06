import { Cyclist } from '@strudel/core';
import { mini } from '@strudel/mini';
import { initAudioOnFirstClick, getAudioContext, webaudioOutput, registerSynthSounds } from '@strudel/webaudio';
import '@strudel/tonal';
import type { TrackEffects, MasterEffects } from './types';

/**
 * StrudelEngine wraps Strudel's WebAudio capabilities for multi-track playback.
 *
 * Approach:
 * - Uses @strudel/core Cyclist as the scheduler/clock.
 * - Evaluates Strudel mini-notation strings via the `mini()` function.
 * - Stacks per-track patterns with gain/mute applied, then feeds the
 *   combined pattern to the Cyclist for playback.
 * - Exposes transport controls (play/stop/pause) and per-track mixing.
 */

interface TrackState {
  pattern: string;
  volume: number;
  muted: boolean;
  solo: boolean;
  effects?: TrackEffects;
}

export class StrudelEngine {
  private cyclist: Cyclist | null = null;
  private audioContext: AudioContext | null = null;
  private tracks: Map<string, TrackState> = new Map();
  private bpm: number = 120;
  private isPlaying: boolean = false;
  private initialized: boolean = false;
  private masterEffects: MasterEffects = { reverb: 0.1, delay: 0, compression: 0.3 };

  // ─── Lifecycle ──────────────────────────────────────────────

  /**
   * Initialize the audio context and register default sounds.
   * Must be called in response to a user gesture (click/tap).
   */
  async init(): Promise<void> {
    if (this.initialized) return;

    // Strudel helper that defers AudioContext creation until first click
    initAudioOnFirstClick();

    // Obtain (or create) the shared AudioContext
    this.audioContext = getAudioContext();

    // Register built-in synth sounds so "sine", "sawtooth", etc. work
    await registerSynthSounds();

    // Create the Cyclist scheduler – it drives the pattern clock
    this.cyclist = new Cyclist({
      interval: 0.1,
      onTrigger: (hap, deadline, duration, cps) => {
        // Route each hap through Strudel's webaudio output
        if (this.audioContext) {
          webaudioOutput(hap, deadline, duration, cps);
        }
      },
      onSchedule: () => {},
      getTime: () => this.audioContext?.currentTime ?? 0,
    });

    this.initialized = true;
  }

  // ─── Transport ──────────────────────────────────────────────

  play(): void {
    if (!this.cyclist) {
      console.warn('StrudelEngine: call init() before play()');
      return;
    }

    this.rebuildAndSetPattern();

    const cps = this.bpm / 60 / 4; // cycles per second (1 cycle = 4 beats = 1 bar)
    this.cyclist.setStarted(true, cps);
    this.isPlaying = true;
  }

  stop(): void {
    if (!this.cyclist) return;
    this.cyclist.setStarted(false);
    this.isPlaying = false;
  }

  pause(): void {
    // Strudel's Cyclist doesn't have a native pause – we stop without
    // resetting position. A future enhancement could store/restore the
    // cycle position.
    this.stop();
  }

  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  // ─── BPM ────────────────────────────────────────────────────

  setBpm(bpm: number): void {
    this.bpm = bpm;
    if (this.isPlaying && this.cyclist) {
      const cps = this.bpm / 60 / 4;
      this.cyclist.setStarted(true, cps);
    }
  }

  getBpm(): number {
    return this.bpm;
  }

  // ─── Per-track pattern management ───────────────────────────

  /**
   * Set or update the Strudel mini-notation pattern for a track.
   * If the engine is currently playing the combined pattern is rebuilt live.
   */
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

  /**
   * Build a combined Strudel pattern string from all active (non-muted,
   * respecting solo) tracks, then feed it to the Cyclist.
   */
  private rebuildAndSetPattern(): void {
    const combined = this.buildCombinedPattern();
    if (!combined || !this.cyclist) return;

    try {
      const pattern = mini(combined);
      this.cyclist.setPattern(pattern, true);
    } catch (err) {
      console.error('StrudelEngine: pattern evaluation error', err);
    }
  }

  /**
   * Build a single Strudel mini-notation string that stacks all audible
   * tracks. Each track's pattern is wrapped with `.gain(volume)`.
   *
   * Solo logic: if *any* track is soloed, only soloed tracks are heard.
   */
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

      // Build per-track effect modifiers (only non-default values)
      let fxStr = '';
      if (t.effects) {
        if (t.effects.delay > 0) fxStr += `.delay(${t.effects.delay.toFixed(2)})`;
        if (t.effects.reverb > 0) fxStr += `.room(${t.effects.reverb.toFixed(2)})`;
        if (t.effects.lpf < 20000) fxStr += `.lpf(${t.effects.lpf})`;
        if (t.effects.hpf > 20) fxStr += `.hpf(${t.effects.hpf})`;
        if (t.effects.distortion > 0) fxStr += `.distortion(${t.effects.distortion.toFixed(2)})`;
      }

      // Wrap each track pattern in parentheses to keep operator precedence
      return `(${t.pattern})${gainStr}${fxStr}`;
    });

    let combined: string;
    if (parts.length === 1) {
      combined = parts[0];
    } else {
      combined = `stack(${parts.join(', ')})`;
    }

    // Apply master effects (only non-default values)
    const me = this.masterEffects;
    if (me.reverb > 0) combined += `.room(${me.reverb.toFixed(2)})`;
    if (me.delay > 0) combined += `.delay(${me.delay.toFixed(2)})`;
    if (me.compression > 0) combined += `.compress(${me.compression.toFixed(2)})`;

    return combined;
  }

  /**
   * Evaluate an arbitrary Strudel code string and play it immediately.
   * Useful for previewing a single pattern without touching tracks.
   */
  previewPattern(code: string): void {
    if (!this.cyclist) {
      console.warn('StrudelEngine: call init() before previewPattern()');
      return;
    }

    try {
      const pattern = mini(code);
      const cps = this.bpm / 60 / 4;
      this.cyclist.setPattern(pattern, true);
      this.cyclist.setStarted(true, cps);
      this.isPlaying = true;
    } catch (err) {
      console.error('StrudelEngine: preview pattern error', err);
    }
  }

  /**
   * Play a pre-built combined pattern string (e.g. from the Scheduler).
   */
  playPatternString(patternString: string): void {
    if (!this.cyclist) {
      console.warn('StrudelEngine: call init() before playPatternString()');
      return;
    }

    try {
      const pattern = mini(patternString);
      const cps = this.bpm / 60 / 4;
      this.cyclist.setPattern(pattern, true);
      this.cyclist.setStarted(true, cps);
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
    this.cyclist = null;
    this.audioContext = null;
    this.initialized = false;
  }
}

/** Singleton instance for the app */
export const strudelEngine = new StrudelEngine();
