import { useEffect, useRef, useCallback } from 'react';
import { useProjectStore } from '../store/projectStore';
import { strudelEngine } from '../engine/StrudelEngine';
import { Scheduler } from '../engine/Scheduler';

/**
 * Hook that bridges the Zustand store and the StrudelEngine.
 * Keeps the engine in sync with project state (tracks, clips, mute/solo/volume, BPM).
 * Handles play/stop commands and bar position tracking.
 * Supports loop region: when a loopRegion is set, plays only that range.
 */
export function useAudioEngine() {
  const project = useProjectStore((s) => s.project);
  const isPlaying = useProjectStore((s) => s.isPlaying);
  const metronomeEnabled = useProjectStore((s) => s.metronomeEnabled);
  const setPlaying = useProjectStore((s) => s.setPlaying);
  const setCurrentBar = useProjectStore((s) => s.setCurrentBar);
  const barIntervalRef = useRef<number | null>(null);
  const initializedRef = useRef(false);

  // Initialize engine on first user interaction
  const initEngine = useCallback(async () => {
    if (initializedRef.current) return;
    try {
      await strudelEngine.init();
      initializedRef.current = true;
    } catch (err) {
      console.error('Failed to initialize audio engine:', err);
    }
  }, []);

  // Sync BPM
  useEffect(() => {
    if (initializedRef.current) {
      strudelEngine.setBpm(project.bpm);
    }
  }, [project.bpm]);

  // Sync track states (patterns, volume, mute, solo) to engine
  useEffect(() => {
    if (!initializedRef.current) return;

    // Build the full arrangement pattern and feed it to the engine
    const arrangementPattern = Scheduler.buildArrangementPattern(project);

    // Update individual track states for the engine's mixer
    for (const track of project.tracks) {
      // Collect all patterns for this track's placed clips
      const trackClipPatterns: string[] = [];
      for (const clipId of Object.values(track.clips)) {
        const clip = project.clips[clipId];
        if (clip?.pattern) {
          trackClipPatterns.push(clip.pattern);
        }
      }

      if (trackClipPatterns.length > 0) {
        // Use first clip pattern as the track's live pattern for simple mode
        strudelEngine.updatePattern(track.id, trackClipPatterns[0]);
      }
      strudelEngine.setTrackVolume(track.id, track.volume);
      strudelEngine.setTrackMute(track.id, track.muted);
      strudelEngine.setTrackSolo(track.id, track.solo);
    }
  }, [project]);

  // Handle play/stop
  useEffect(() => {
    let cancelled = false;

    const handlePlay = async () => {
      // Ensure engine is initialized before playing
      if (!initializedRef.current) {
        await initEngine();
      }
      if (cancelled) return;

      // Check for loop region
      const loopRegion = useProjectStore.getState().loopRegion;

      // Build arrangement pattern: use range if loop region is set
      let arrangementPattern: string;
      if (loopRegion) {
        arrangementPattern = Scheduler.buildRangePattern(project, loopRegion.startBar, loopRegion.endBar);
        console.log('[useAudioEngine] loop region pattern:', arrangementPattern, `bars ${loopRegion.startBar}-${loopRegion.endBar}`);
      } else {
        arrangementPattern = Scheduler.buildArrangementPattern(project);
        console.log('[useAudioEngine] arrangement pattern:', arrangementPattern);
      }

      // Include metronome click track if enabled
      const metronomeOn = useProjectStore.getState().metronomeEnabled;
      let finalPattern = arrangementPattern;
      if (metronomeOn && arrangementPattern && arrangementPattern !== 'silence') {
        finalPattern = `stack(${arrangementPattern}, s("click:0 ~ ~ ~").gain(0.3))`;
      } else if (metronomeOn) {
        finalPattern = `s("click:0 ~ ~ ~").gain(0.3)`;
      }

      if (finalPattern && finalPattern !== 'silence') {
        await strudelEngine.playPatternString(finalPattern);
      } else {
        console.warn('[useAudioEngine] No audible pattern to play');
        setPlaying(false);
        return;
      }

      if (cancelled) return;

      // Track bar position
      const msPerBar = (60 / project.bpm) * 4 * 1000; // 4 beats per bar

      if (loopRegion) {
        // Loop within region bounds
        let currentBar = loopRegion.startBar;
        setCurrentBar(currentBar);
        const regionLength = loopRegion.endBar - loopRegion.startBar;

        barIntervalRef.current = window.setInterval(() => {
          currentBar++;
          if (currentBar >= loopRegion.endBar) {
            currentBar = loopRegion.startBar; // loop back to region start
          }
          setCurrentBar(currentBar);
        }, msPerBar);
      } else {
        // Normal full-arrangement playback
        let currentBar = 0;
        setCurrentBar(0);

        barIntervalRef.current = window.setInterval(() => {
          currentBar++;
          if (currentBar >= project.totalBars) {
            currentBar = 0; // loop
          }
          setCurrentBar(currentBar);
        }, msPerBar);
      }
    };

    if (isPlaying) {
      handlePlay();
    } else {
      strudelEngine.stop();
      if (barIntervalRef.current !== null) {
        clearInterval(barIntervalRef.current);
        barIntervalRef.current = null;
      }
    }

    return () => {
      cancelled = true;
      if (barIntervalRef.current !== null) {
        clearInterval(barIntervalRef.current);
        barIntervalRef.current = null;
      }
    };
  }, [isPlaying]);

  // Re-evaluate pattern when metronome is toggled during playback
  useEffect(() => {
    if (!isPlaying || !initializedRef.current) return;

    const loopRegion = useProjectStore.getState().loopRegion;
    const arrangementPattern = loopRegion
      ? Scheduler.buildRangePattern(project, loopRegion.startBar, loopRegion.endBar)
      : Scheduler.buildArrangementPattern(project);

    if (!arrangementPattern || arrangementPattern === 'silence') {
      if (metronomeEnabled) {
        strudelEngine.playPatternString(`s("click:0 ~ ~ ~").gain(0.3)`);
      }
      return;
    }

    const finalPattern = metronomeEnabled
      ? `stack(${arrangementPattern}, s("click:0 ~ ~ ~").gain(0.3))`
      : arrangementPattern;

    strudelEngine.playPatternString(finalPattern);
  }, [metronomeEnabled]);

  // Preview a single pattern
  const previewPattern = useCallback(async (pattern: string) => {
    if (!initializedRef.current) {
      await initEngine();
    }
    await strudelEngine.previewPattern(pattern);
  }, [initEngine]);

  // Stop preview (restore arrangement or silence)
  const stopPreview = useCallback(() => {
    strudelEngine.stop();
    if (isPlaying) {
      const loopRegion = useProjectStore.getState().loopRegion;
      const arrangementPattern = loopRegion
        ? Scheduler.buildRangePattern(project, loopRegion.startBar, loopRegion.endBar)
        : Scheduler.buildArrangementPattern(project);
      if (arrangementPattern && arrangementPattern !== 'silence') {
        strudelEngine.playPatternString(arrangementPattern);
      }
    }
  }, [isPlaying, project]);

  return { initEngine, previewPattern, stopPreview };
}
