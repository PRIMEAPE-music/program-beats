import React, { useCallback, useRef, useState } from 'react';
import { useProjectStore } from '../store/projectStore';

export const TapTempo: React.FC = () => {
  const setBpm = useProjectStore((s) => s.setBpm);
  const [detectedBpm, setDetectedBpm] = useState<number | null>(null);
  const tapsRef = useRef<number[]>([]);
  const resetTimerRef = useRef<number | null>(null);
  const feedbackTimerRef = useRef<number | null>(null);

  const handleTap = useCallback(() => {
    const now = performance.now();

    // Clear reset timer
    if (resetTimerRef.current !== null) {
      clearTimeout(resetTimerRef.current);
    }

    // Reset if last tap was more than 2 seconds ago
    if (tapsRef.current.length > 0) {
      const lastTap = tapsRef.current[tapsRef.current.length - 1];
      if (now - lastTap > 2000) {
        tapsRef.current = [];
      }
    }

    tapsRef.current.push(now);

    // Calculate BPM after 3+ taps
    if (tapsRef.current.length >= 3) {
      const taps = tapsRef.current;
      const intervals: number[] = [];
      for (let i = 1; i < taps.length; i++) {
        intervals.push(taps[i] - taps[i - 1]);
      }
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const bpm = Math.round(60000 / avgInterval);

      if (bpm > 0 && bpm <= 300) {
        setBpm(bpm);
        setDetectedBpm(bpm);

        // Clear previous feedback timer
        if (feedbackTimerRef.current !== null) {
          clearTimeout(feedbackTimerRef.current);
        }
        feedbackTimerRef.current = window.setTimeout(() => {
          setDetectedBpm(null);
          feedbackTimerRef.current = null;
        }, 1500);
      }
    }

    // Reset taps after 2 seconds of no tapping
    resetTimerRef.current = window.setTimeout(() => {
      tapsRef.current = [];
      resetTimerRef.current = null;
    }, 2000);
  }, [setBpm]);

  return (
    <div className="tap-tempo-wrapper">
      <button
        className="btn btn-sm btn-tap-tempo"
        onClick={handleTap}
        title="Tap rhythmically to set BPM (3+ taps)"
      >
        Tap
      </button>
      {detectedBpm !== null && (
        <span className="tap-tempo-feedback">{detectedBpm}</span>
      )}
    </div>
  );
};
