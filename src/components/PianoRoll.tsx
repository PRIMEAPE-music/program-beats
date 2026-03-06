import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useProjectStore } from '../store/projectStore';

// ── Constants ──────────────────────────────────────────────

const STEPS = 16;

const DRUM_ROWS = [
  { key: 'bd', label: 'Kick' },
  { key: 'sd', label: 'Snare' },
  { key: 'hh', label: 'Hi-Hat' },
  { key: 'oh', label: 'Open HH' },
  { key: 'cp', label: 'Clap' },
  { key: 'rim', label: 'Rim' },
  { key: 'cb', label: 'Cowbell' },
  { key: 'tom', label: 'Tom' },
  { key: 'cr', label: 'Crash' },
  { key: 'rd', label: 'Ride' },
];

// C2 (note 36) to C6 (note 84) — bottom to top visually
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

function buildNoteRows(): { key: string; label: string; isBlack: boolean }[] {
  const rows: { key: string; label: string; isBlack: boolean }[] = [];
  for (let octave = 5; octave >= 2; octave--) {
    for (let i = NOTE_NAMES.length - 1; i >= 0; i--) {
      const name = NOTE_NAMES[i];
      rows.push({
        key: `${name.toLowerCase().replace('#', 's')}${octave}`,
        label: `${name}${octave}`,
        isBlack: name.includes('#'),
      });
    }
  }
  return rows;
}

const NOTE_ROWS = buildNoteRows();

type Velocity = 0 | 1 | 2 | 3; // 0=off, 1=low, 2=medium, 3=high
type GridState = Velocity[][];

function createEmptyGrid(rowCount: number): GridState {
  return Array.from({ length: rowCount }, () => new Array(STEPS).fill(0));
}

// ── Pattern Parsing ────────────────────────────────────────

/**
 * Attempt to parse a simple Strudel `sound("...")` drum pattern into grid state.
 * Supports patterns like: sound("bd [hh hh] sd hh")
 * This is best-effort; complex patterns won't parse perfectly.
 */
function parseDrumPattern(pattern: string): GridState | null {
  const grid = createEmptyGrid(DRUM_ROWS.length);
  // Extract the content inside sound("...")
  const match = pattern.match(/sound\(\s*"([^"]+)"\s*\)/);
  if (!match) return null;

  const inner = match[1].trim();
  // Split into top-level steps. We treat spaces as step separators
  // and [...] as subdivisions within a step.
  const tokens = tokenizePattern(inner);
  if (tokens.length === 0) return null;

  // Map tokens into 16 steps (stretch or compress)
  const stepsPerToken = STEPS / tokens.length;
  if (stepsPerToken < 1 || !Number.isInteger(stepsPerToken)) {
    // Non-even division — just place in first N steps
    for (let i = 0; i < Math.min(tokens.length, STEPS); i++) {
      placeTokenInGrid(tokens[i], grid, i);
    }
  } else {
    for (let t = 0; t < tokens.length; t++) {
      const token = tokens[t];
      if (Array.isArray(token)) {
        // Subdivided step — spread sub-tokens across the step's sub-steps
        const subStepCount = token.length;
        for (let s = 0; s < subStepCount; s++) {
          const stepIdx = t * stepsPerToken + Math.floor((s * stepsPerToken) / subStepCount);
          if (stepIdx < STEPS) {
            placeTokenInGrid(token[s], grid, stepIdx);
          }
        }
      } else {
        placeTokenInGrid(token, grid, t * stepsPerToken);
      }
    }
  }

  return grid;
}

type PatternToken = string | string[];

function tokenizePattern(inner: string): PatternToken[] {
  const tokens: PatternToken[] = [];
  let i = 0;
  while (i < inner.length) {
    if (inner[i] === ' ') { i++; continue; }
    if (inner[i] === '[') {
      // Find matching ]
      const end = inner.indexOf(']', i);
      if (end === -1) break;
      const subContent = inner.slice(i + 1, end).trim();
      tokens.push(subContent.split(/\s+/));
      i = end + 1;
    } else if (inner[i] === '~') {
      tokens.push('~');
      i++;
    } else {
      let word = '';
      while (i < inner.length && inner[i] !== ' ' && inner[i] !== '[' && inner[i] !== ']') {
        word += inner[i]; i++;
      }
      tokens.push(word);
    }
  }
  return tokens;
}

function placeTokenInGrid(token: string | string[], grid: GridState, step: number) {
  if (step < 0 || step >= STEPS) return;
  const samples = Array.isArray(token) ? token : [token];
  for (const sample of samples) {
    if (sample === '~') continue;
    // Strip any velocity/modifier suffixes for matching
    const clean = sample.replace(/[:@].*/g, '');
    const rowIdx = DRUM_ROWS.findIndex((r) => r.key === clean);
    if (rowIdx >= 0) {
      grid[rowIdx][step] = 3; // default high velocity
    }
  }
}

/**
 * Parse a note() pattern into the note grid.
 * Supports patterns like: note("c3 e3 g3 ~")
 */
function parseNotePattern(pattern: string): GridState | null {
  const grid = createEmptyGrid(NOTE_ROWS.length);
  const match = pattern.match(/note\(\s*"([^"]+)"\s*\)/);
  if (!match) return null;

  const inner = match[1].trim();
  const tokens = tokenizePattern(inner);
  if (tokens.length === 0) return null;

  const stepsPerToken = STEPS / tokens.length;

  for (let t = 0; t < tokens.length; t++) {
    const token = tokens[t];
    const stepIdx = Number.isInteger(stepsPerToken)
      ? t * stepsPerToken
      : Math.min(t, STEPS - 1);

    if (Array.isArray(token)) {
      for (const sub of token) {
        placeNoteInGrid(sub, grid, stepIdx);
      }
    } else {
      placeNoteInGrid(token, grid, stepIdx);
    }
  }

  return grid;
}

function placeNoteInGrid(token: string, grid: GridState, step: number) {
  if (step < 0 || step >= STEPS || token === '~') return;
  const clean = token.replace(/[:@].*/g, '').trim();
  const rowIdx = NOTE_ROWS.findIndex((r) => r.key === clean);
  if (rowIdx >= 0) {
    grid[rowIdx][step] = 3;
  }
}

// ── Pattern Generation ─────────────────────────────────────

function gridToDrumPattern(grid: GridState): string {
  // Build a step-based pattern: for each step, collect active samples
  const steps: string[] = [];
  for (let s = 0; s < STEPS; s++) {
    const active: string[] = [];
    for (let r = 0; r < DRUM_ROWS.length; r++) {
      if (grid[r][s] > 0) {
        const sample = DRUM_ROWS[r].key;
        const vel = grid[r][s];
        if (vel < 3) {
          // Attach gain for lower velocities
          const gain = vel === 1 ? 0.4 : 0.7;
          active.push(`${sample}:0*${gain}`);
        } else {
          active.push(sample);
        }
      }
    }
    if (active.length === 0) {
      steps.push('~');
    } else if (active.length === 1) {
      steps.push(active[0]);
    } else {
      steps.push(`[${active.join(' ')}]`);
    }
  }

  // Simplify: if all 16 steps fit evenly, try to reduce
  const simplified = simplifySteps(steps);
  return `sound("${simplified}")`;
}

function gridToNotePattern(grid: GridState): string {
  const steps: string[] = [];
  for (let s = 0; s < STEPS; s++) {
    const active: string[] = [];
    for (let r = 0; r < NOTE_ROWS.length; r++) {
      if (grid[r][s] > 0) {
        active.push(NOTE_ROWS[r].key);
      }
    }
    if (active.length === 0) {
      steps.push('~');
    } else if (active.length === 1) {
      steps.push(active[0]);
    } else {
      steps.push(`[${active.join(' ')}]`);
    }
  }

  const simplified = simplifySteps(steps);
  return `note("${simplified}")`;
}

function simplifySteps(steps: string[]): string {
  // Remove trailing rests
  let end = steps.length;
  while (end > 1 && steps[end - 1] === '~') end--;
  const trimmed = steps.slice(0, end);

  // If we can group into groups of 4 (4 bars of 4 steps), use that
  return trimmed.join(' ');
}

// ── Component ──────────────────────────────────────────────

interface PianoRollProps {
  onClose: () => void;
}

export const PianoRoll: React.FC<PianoRollProps> = ({ onClose }) => {
  const project = useProjectStore((s) => s.project);
  const selectedClipId = useProjectStore((s) => s.selectedClipId);
  const updateClip = useProjectStore((s) => s.updateClip);

  const clip = selectedClipId ? project.clips[selectedClipId] : null;

  // Determine default mode based on track type
  const trackType = useMemo(() => {
    if (!selectedClipId) return null;
    for (const track of project.tracks) {
      for (const cId of Object.values(track.clips)) {
        if (cId === selectedClipId) return track.type;
      }
    }
    return null;
  }, [selectedClipId, project.tracks]);

  const defaultMode = trackType === 'drums' ? 'drum' : 'note';
  const [mode, setMode] = useState<'drum' | 'note'>(defaultMode);

  const rows = mode === 'drum' ? DRUM_ROWS : NOTE_ROWS;
  const rowCount = rows.length;

  const [grid, setGrid] = useState<GridState>(() => createEmptyGrid(rowCount));
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [paintValue, setPaintValue] = useState<Velocity>(3);

  // Reset grid when mode changes or clip changes
  useEffect(() => {
    const newRowCount = mode === 'drum' ? DRUM_ROWS.length : NOTE_ROWS.length;
    if (!clip) {
      setGrid(createEmptyGrid(newRowCount));
      return;
    }

    // Try to parse the existing pattern
    const parsed = mode === 'drum'
      ? parseDrumPattern(clip.pattern)
      : parseNotePattern(clip.pattern);

    if (parsed) {
      setGrid(parsed);
    } else {
      setGrid(createEmptyGrid(newRowCount));
    }
  }, [mode, clip?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Update mode when track type changes
  useEffect(() => {
    setMode(defaultMode);
  }, [defaultMode]);

  const handleCellClick = useCallback((row: number, step: number, shiftKey: boolean) => {
    setGrid((prev) => {
      const next = prev.map((r) => [...r]);
      if (shiftKey) {
        // Cycle velocity: off -> low -> med -> high -> off
        next[row][step] = ((next[row][step] + 1) % 4) as Velocity;
      } else {
        // Toggle on/off (high velocity)
        next[row][step] = next[row][step] > 0 ? 0 : 3;
      }
      return next;
    });
  }, []);

  const handleCellMouseDown = useCallback((row: number, step: number, e: React.MouseEvent) => {
    e.preventDefault();
    setIsMouseDown(true);
    if (e.shiftKey) {
      // Shift+click: cycle velocity
      handleCellClick(row, step, true);
    } else {
      // Determine paint value based on current cell state
      setGrid((prev) => {
        const current = prev[row][step];
        const newVal: Velocity = current > 0 ? 0 : 3;
        setPaintValue(newVal);
        const next = prev.map((r) => [...r]);
        next[row][step] = newVal;
        return next;
      });
    }
  }, [handleCellClick]);

  const handleCellMouseEnter = useCallback((row: number, step: number) => {
    if (!isMouseDown) return;
    setGrid((prev) => {
      const next = prev.map((r) => [...r]);
      next[row][step] = paintValue;
      return next;
    });
  }, [isMouseDown, paintValue]);

  const handleMouseUp = useCallback(() => {
    setIsMouseDown(false);
  }, []);

  // Global mouse up listener
  useEffect(() => {
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, [handleMouseUp]);

  const handleClear = useCallback(() => {
    const newRowCount = mode === 'drum' ? DRUM_ROWS.length : NOTE_ROWS.length;
    setGrid(createEmptyGrid(newRowCount));
  }, [mode]);

  const handleApply = useCallback(() => {
    if (!selectedClipId) return;
    const pattern = mode === 'drum'
      ? gridToDrumPattern(grid)
      : gridToNotePattern(grid);
    updateClip(selectedClipId, { pattern });
  }, [selectedClipId, mode, grid, updateClip]);

  const generatedPattern = useMemo(() => {
    return mode === 'drum'
      ? gridToDrumPattern(grid)
      : gridToNotePattern(grid);
  }, [mode, grid]);

  if (!clip) return null;

  const velocityClass = (v: Velocity): string => {
    if (v === 0) return '';
    if (v === 1) return 'vel-low';
    if (v === 2) return 'vel-med';
    return 'vel-high';
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="piano-roll-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Toolbar */}
        <div className="piano-roll-toolbar">
          <div className="piano-roll-toolbar-left">
            <h3>Grid Editor</h3>
            <span className="piano-roll-clip-name">{clip.name}</span>
          </div>
          <div className="piano-roll-toolbar-center">
            <button
              className={`btn btn-sm ${mode === 'drum' ? 'btn-accent' : ''}`}
              onClick={() => setMode('drum')}
            >
              Drum
            </button>
            <button
              className={`btn btn-sm ${mode === 'note' ? 'btn-accent' : ''}`}
              onClick={() => setMode('note')}
            >
              Note
            </button>
          </div>
          <div className="piano-roll-toolbar-right">
            <button className="btn btn-sm" onClick={handleClear}>
              Clear
            </button>
            <button className="btn btn-sm btn-accent" onClick={handleApply}>
              Apply
            </button>
            <button className="btn btn-sm" onClick={onClose}>
              Close
            </button>
          </div>
        </div>

        {/* Step numbers header */}
        <div className="piano-roll-grid-wrapper">
          <div className="piano-roll-header">
            <div className="piano-roll-label-spacer" />
            {Array.from({ length: STEPS }, (_, i) => (
              <div
                key={i}
                className={`piano-roll-step-num ${i % 4 === 0 ? 'beat-start' : ''}`}
              >
                {i + 1}
              </div>
            ))}
          </div>

          {/* Grid body */}
          <div className={`piano-roll-body ${mode === 'note' ? 'piano-roll-body-notes' : ''}`}>
            {rows.map((row, rowIdx) => (
              <div
                key={row.key}
                className={`piano-roll-row ${
                  mode === 'note' && (row as { isBlack?: boolean }).isBlack ? 'black-key' : ''
                } ${mode === 'note' && row.label.startsWith('C') && !row.label.includes('#') ? 'c-row' : ''}`}
              >
                <div className="piano-roll-row-label" title={row.label}>
                  {row.label}
                </div>
                {Array.from({ length: STEPS }, (_, step) => {
                  const v = grid[rowIdx]?.[step] ?? 0;
                  return (
                    <div
                      key={step}
                      className={`piano-roll-cell ${v > 0 ? 'active' : ''} ${velocityClass(v as Velocity)} ${step % 4 === 0 ? 'beat-start' : ''}`}
                      onMouseDown={(e) => handleCellMouseDown(rowIdx, step, e)}
                      onMouseEnter={() => handleCellMouseEnter(rowIdx, step)}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Pattern preview */}
        <div className="piano-roll-pattern-preview">
          <span className="piano-roll-preview-label">Pattern:</span>
          <code className="piano-roll-preview-code">{generatedPattern}</code>
        </div>

        {/* Velocity hint */}
        <div className="piano-roll-hint">
          Click to toggle | Shift+Click to cycle velocity (low / med / high) | Drag to paint
        </div>
      </div>
    </div>
  );
};
