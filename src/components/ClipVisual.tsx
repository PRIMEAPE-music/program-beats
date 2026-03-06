import React from 'react';
import type { TrackType } from '../engine/types';

interface ClipVisualProps {
  pattern: string;
  trackType: TrackType;
  color: string;
}

const DRUM_COLORS: Record<string, string> = {
  bd: '#e74c3c',
  kick: '#e74c3c',
  sd: '#3498db',
  snare: '#3498db',
  hh: '#f1c40f',
  hat: '#f1c40f',
  oh: '#e67e22',
  cp: '#9b59b6',
  clap: '#9b59b6',
  rim: '#1abc9c',
  tom: '#2ecc71',
  cb: '#e91e63',
};

const DRUM_TOKENS = ['bd', 'kick', 'sd', 'snare', 'hh', 'hat', 'oh', 'cp', 'clap', 'rim', 'tom', 'cb'];

const NOTE_REGEX = /([a-g][#bs]?)(\d)/gi;

function parseDrumHits(pattern: string): { token: string; position: number }[] {
  const hits: { token: string; position: number }[] = [];
  const lower = pattern.toLowerCase();
  let idx = 0;
  for (const token of DRUM_TOKENS) {
    let searchFrom = 0;
    while (true) {
      const pos = lower.indexOf(token, searchFrom);
      if (pos === -1) break;
      hits.push({ token, position: idx++ });
      searchFrom = pos + token.length;
    }
  }
  // Sort by position in original string
  hits.sort((a, b) => a.position - b.position);
  return hits;
}

function parseNotes(pattern: string): { note: string; octave: number; position: number }[] {
  const notes: { note: string; octave: number; position: number }[] = [];
  let match: RegExpExecArray | null;
  const regex = new RegExp(NOTE_REGEX.source, 'gi');
  let idx = 0;
  while ((match = regex.exec(pattern)) !== null) {
    notes.push({
      note: match[1].toLowerCase(),
      octave: parseInt(match[2], 10),
      position: idx++,
    });
  }
  return notes;
}

function noteToY(note: string, octave: number): number {
  const noteValues: Record<string, number> = {
    c: 0, 'c#': 1, cs: 1, db: 1,
    d: 2, 'd#': 3, ds: 3, eb: 3,
    e: 4, f: 5, 'f#': 6, fs: 6, gb: 6,
    g: 7, 'g#': 8, gs: 8, ab: 8,
    a: 9, 'a#': 10, as: 10, bb: 10,
    b: 11,
  };
  const val = (noteValues[note] ?? 0) + octave * 12;
  // Map roughly to 0-1 range (C2=24 to C6=72)
  const min = 24;
  const max = 72;
  return 1 - Math.max(0, Math.min(1, (val - min) / (max - min)));
}

const DrumVisual: React.FC<{ pattern: string }> = ({ pattern }) => {
  const hits = parseDrumHits(pattern);
  if (hits.length === 0) return null;
  const maxHits = Math.min(hits.length, 16);
  const displayHits = hits.slice(0, maxHits);

  return (
    <div className="clip-visual clip-visual-drums">
      {displayHits.map((hit, i) => (
        <div
          key={i}
          className="drum-dot"
          style={{
            backgroundColor: DRUM_COLORS[hit.token] || '#aaa',
            left: `${(i / maxHits) * 100}%`,
          }}
          title={hit.token}
        />
      ))}
    </div>
  );
};

const MelodicVisual: React.FC<{ pattern: string; color: string }> = ({ pattern, color }) => {
  const notes = parseNotes(pattern);
  if (notes.length === 0) return null;
  const maxNotes = Math.min(notes.length, 16);
  const displayNotes = notes.slice(0, maxNotes);
  const barWidth = 100 / maxNotes;

  return (
    <div className="clip-visual clip-visual-melodic">
      {displayNotes.map((n, i) => {
        const yPct = noteToY(n.note, n.octave) * 100;
        return (
          <div
            key={i}
            className="note-bar"
            style={{
              left: `${(i / maxNotes) * 100}%`,
              top: `${yPct}%`,
              width: `${barWidth * 0.8}%`,
              backgroundColor: color,
            }}
            title={`${n.note}${n.octave}`}
          />
        );
      })}
    </div>
  );
};

const FallbackVisual: React.FC<{ color: string }> = ({ color }) => {
  return (
    <div className="clip-visual clip-visual-fallback" style={{ borderColor: color }}>
      <svg width="100%" height="100%" viewBox="0 0 80 30" preserveAspectRatio="none">
        <path
          d="M0,15 Q10,5 20,15 T40,15 T60,15 T80,15"
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          opacity="0.6"
        />
        <path
          d="M0,20 Q10,10 20,20 T40,20 T60,20 T80,20"
          fill="none"
          stroke={color}
          strokeWidth="1"
          opacity="0.3"
        />
      </svg>
    </div>
  );
};

/**
 * Parse a pattern string into a 16-step rhythm grid.
 * Returns an array of 16 booleans indicating hits vs rests.
 */
function parseRhythmSteps(pattern: string): boolean[] {
  const steps = new Array(16).fill(false);

  // Extract the content inside the first function call like s("...") or note("...")
  const innerMatch = pattern.match(/(?:s|note|n|sound)\s*\(\s*"([^"]+)"/);
  const tokens = innerMatch ? innerMatch[1] : pattern;

  // Split on whitespace to get individual tokens
  const parts = tokens.trim().split(/\s+/);
  if (parts.length === 0) return steps;

  // Map each token position into the 16-step grid
  const stepSize = 16 / parts.length;
  parts.forEach((part, i) => {
    const pos = Math.round(i * stepSize);
    if (pos < 16 && part !== '~' && part !== '-' && part !== '.') {
      steps[pos] = true;
    }
  });

  return steps;
}

const RhythmViz: React.FC<{ pattern: string; color: string }> = ({ pattern, color }) => {
  const steps = parseRhythmSteps(pattern);
  const hasAnyHit = steps.some(Boolean);
  if (!hasAnyHit) return null;

  return (
    <div className="clip-rhythm-viz">
      {steps.map((hit, i) => (
        <div
          key={i}
          className={`rhythm-step ${hit ? 'rhythm-step-hit' : ''}`}
          style={hit ? { backgroundColor: color } : undefined}
        />
      ))}
    </div>
  );
};

export const ClipVisual: React.FC<ClipVisualProps> = ({ pattern, trackType, color }) => {
  if (!pattern || pattern.trim() === '') {
    return <FallbackVisual color={color} />;
  }

  // Always render the rhythm viz alongside the existing visual
  const rhythmViz = <RhythmViz pattern={pattern} color={color} />;

  if (trackType === 'drums') {
    const hits = parseDrumHits(pattern);
    if (hits.length > 0) {
      return <>{rhythmViz}<DrumVisual pattern={pattern} /></>;
    }
    return <>{rhythmViz}<FallbackVisual color={color} /></>;
  }

  // Melodic types: bass, melody, chords
  if (trackType === 'bass' || trackType === 'melody' || trackType === 'chords') {
    const notes = parseNotes(pattern);
    if (notes.length > 0) {
      return <>{rhythmViz}<MelodicVisual pattern={pattern} color={color} /></>;
    }
    return <>{rhythmViz}<FallbackVisual color={color} /></>;
  }

  // fx, custom, or anything else
  const notes = parseNotes(pattern);
  if (notes.length > 0) {
    return <>{rhythmViz}<MelodicVisual pattern={pattern} color={color} /></>;
  }
  const hits = parseDrumHits(pattern);
  if (hits.length > 0) {
    return <>{rhythmViz}<DrumVisual pattern={pattern} /></>;
  }
  return <>{rhythmViz}<FallbackVisual color={color} /></>;
};
