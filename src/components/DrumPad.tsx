import React, { useEffect, useCallback, useRef, useState } from 'react';
import { useProjectStore } from '../store/projectStore';
import { strudelEngine } from '../engine/StrudelEngine';

const PAD_MAP: { key: string; sound: string; label: string }[] = [
  { key: 'a', sound: 'bd', label: 'Kick' },
  { key: 's', sound: 'sd', label: 'Snare' },
  { key: 'd', sound: 'hh', label: 'Hi-Hat' },
  { key: 'f', sound: 'oh', label: 'Open HH' },
  { key: 'g', sound: 'cp', label: 'Clap' },
  { key: 'h', sound: 'rim', label: 'Rim' },
  { key: 'j', sound: 'cr', label: 'Crash' },
  { key: 'k', sound: 'rd', label: 'Ride' },
];

export const DrumPad: React.FC = () => {
  const showDrumPad = useProjectStore((s) => s.showDrumPad);
  const isPlaying = useProjectStore((s) => s.isPlaying);
  const selectedClipId = useProjectStore((s) => s.selectedClipId);
  const updateClip = useProjectStore((s) => s.updateClip);
  const project = useProjectStore((s) => s.project);

  const [activePads, setActivePads] = useState<Set<string>>(new Set());
  const [recordMode, setRecordMode] = useState(false);
  const recordedHitsRef = useRef<{ sound: string; time: number }[]>([]);
  const recordStartRef = useRef<number>(0);

  const triggerSound = useCallback(
    (sound: string) => {
      if (!strudelEngine.isInitialized()) return;
      strudelEngine.previewPattern(`s("${sound}")`);

      // Visual feedback
      setActivePads((prev) => {
        const next = new Set(prev);
        next.add(sound);
        return next;
      });
      setTimeout(() => {
        setActivePads((prev) => {
          const next = new Set(prev);
          next.delete(sound);
          return next;
        });
      }, 120);

      // Record mode
      if (recordMode && isPlaying) {
        const now = performance.now();
        if (recordedHitsRef.current.length === 0) {
          recordStartRef.current = now;
        }
        recordedHitsRef.current.push({ sound, time: now - recordStartRef.current });
      }
    },
    [recordMode, isPlaying]
  );

  // Keyboard listener
  useEffect(() => {
    if (!showDrumPad) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const tag = target.tagName.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || target.isContentEditable) return;

      const pad = PAD_MAP.find((p) => p.key === e.key.toLowerCase());
      if (pad) {
        e.preventDefault();
        triggerSound(pad.sound);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showDrumPad, triggerSound]);

  const handleCommitRecording = useCallback(() => {
    const hits = recordedHitsRef.current;
    if (hits.length === 0 || !selectedClipId) return;

    const bpm = project.bpm;
    const msPerStep = (60000 / bpm) / 4; // 16th note duration
    const totalSteps = 16;

    // Quantize hits to nearest 16th note step
    const stepHits: Map<number, Set<string>> = new Map();
    for (const hit of hits) {
      const step = Math.round(hit.time / msPerStep) % totalSteps;
      if (!stepHits.has(step)) stepHits.set(step, new Set());
      stepHits.get(step)!.add(hit.sound);
    }

    // Build mini-notation
    const steps: string[] = [];
    for (let s = 0; s < totalSteps; s++) {
      const sounds = stepHits.get(s);
      if (!sounds || sounds.size === 0) {
        steps.push('~');
      } else if (sounds.size === 1) {
        steps.push([...sounds][0]);
      } else {
        steps.push(`[${[...sounds].join(' ')}]`);
      }
    }

    const pattern = `sound("${steps.join(' ')}")`;
    updateClip(selectedClipId, { pattern });
    recordedHitsRef.current = [];
  }, [selectedClipId, project.bpm, updateClip]);

  const handleToggleRecord = useCallback(() => {
    if (recordMode) {
      // Stop recording and commit
      handleCommitRecording();
    } else {
      recordedHitsRef.current = [];
    }
    setRecordMode((prev) => !prev);
  }, [recordMode, handleCommitRecording]);

  if (!showDrumPad) return null;

  return (
    <div className="drum-pad-container">
      <div className="drum-pad-header">
        <span className="drum-pad-title">Drum Pads</span>
        <div className="drum-pad-controls">
          {selectedClipId && (
            <button
              className={`btn btn-sm drum-pad-rec-btn${recordMode ? ' active' : ''}`}
              onClick={handleToggleRecord}
              title={recordMode ? 'Stop recording and apply to clip' : 'Record hits into selected clip'}
            >
              {recordMode ? 'Stop Rec' : 'Rec'}
            </button>
          )}
        </div>
      </div>
      <div className="drum-pad-grid">
        {PAD_MAP.map((pad) => (
          <button
            key={pad.sound}
            className={`drum-pad-btn${activePads.has(pad.sound) ? ' active' : ''}`}
            onMouseDown={() => triggerSound(pad.sound)}
          >
            <span className="drum-pad-label">{pad.label}</span>
            <span className="drum-pad-key">{pad.key.toUpperCase()}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
