import MidiWriter from 'midi-writer-js';
import type { Project, Track, Clip } from './types';

// GM Drum map
const DRUM_MAP: Record<string, number> = {
  bd: 36, kick: 36,
  sd: 38, snare: 38,
  hh: 42, hihat: 42,
  oh: 46, openhat: 46,
  cp: 39, clap: 39,
  rim: 37, rimshot: 37,
  cb: 56, cowbell: 56,
  cr: 49, crash: 49,
  ride: 51,
  lt: 41, lowtom: 41,
  mt: 45, midtom: 45,
  ht: 48, hitom: 48,
  // extras
  perc: 39,
  tom: 45,
  cymbal: 49,
};

// Note name to MIDI number mapping
const NOTE_NAMES: Record<string, number> = {
  c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11,
};

/**
 * Parse a note name like "c4", "eb3", "f#5" to a MIDI note number.
 * Returns undefined if it can't be parsed.
 */
function parseNoteName(token: string): number | undefined {
  const match = token.match(/^([a-g])([b#]?)(\d)$/i);
  if (!match) return undefined;
  const [, letter, accidental, octaveStr] = match;
  const base = NOTE_NAMES[letter.toLowerCase()];
  if (base === undefined) return undefined;
  let note = base + (parseInt(octaveStr, 10) + 1) * 12;
  if (accidental === '#' || accidental === 's') note += 1;
  if (accidental === 'b') note -= 1;
  return note;
}

/**
 * Tokenize a Strudel mini-notation pattern into a flat list of sound tokens
 * with their relative durations. This is a best-effort parser.
 */
interface ParsedNote {
  token: string;
  /** fraction of a cycle (1 cycle = durationBars bars) */
  fraction: number;
}

function tokenizeMiniNotation(pattern: string): ParsedNote[] {
  // Strip outer quotes if present
  let p = pattern.trim();
  if ((p.startsWith('"') && p.endsWith('"')) || (p.startsWith("'") && p.endsWith("'"))) {
    p = p.slice(1, -1);
  }

  // Remove stuff inside angle brackets (alternation) - just take first
  p = p.replace(/<([^>]*)>/g, (_match, inner: string) => {
    const parts = inner.trim().split(/\s+/);
    return parts[0] || '';
  });

  // Recursively parse
  return parseGroup(p, 1);
}

function parseGroup(input: string, totalFraction: number): ParsedNote[] {
  const results: ParsedNote[] = [];
  let str = input.trim();

  // Resolve square brackets by recursive expansion
  // We need to find top-level tokens separated by spaces
  const tokens = splitTopLevel(str);
  const perToken = totalFraction / Math.max(tokens.length, 1);

  for (const raw of tokens) {
    let tok = raw.trim();
    if (!tok) continue;

    // Handle multiplier: token*N
    let multiplier = 1;
    const multMatch = tok.match(/^(.+)\*(\d+)$/);
    if (multMatch) {
      tok = multMatch[1];
      multiplier = parseInt(multMatch[2], 10);
    }

    // Handle square brackets [a b c]
    if (tok.startsWith('[') && tok.endsWith(']')) {
      const inner = tok.slice(1, -1);
      for (let i = 0; i < multiplier; i++) {
        results.push(...parseGroup(inner, perToken));
      }
      continue;
    }

    // Rest
    if (tok === '~') {
      for (let i = 0; i < multiplier; i++) {
        results.push({ token: '~', fraction: perToken / multiplier });
      }
      continue;
    }

    // Plain token (possibly a note or sample name)
    const noteFraction = perToken / multiplier;
    for (let i = 0; i < multiplier; i++) {
      results.push({ token: tok, fraction: noteFraction });
    }
  }

  return results;
}

/** Split a string by spaces, respecting bracket nesting */
function splitTopLevel(str: string): string[] {
  const result: string[] = [];
  let current = '';
  let depth = 0;
  for (const ch of str) {
    if (ch === '[' || ch === '<' || ch === '{') depth++;
    if (ch === ']' || ch === '>' || ch === '}') depth--;
    if (ch === ' ' && depth === 0) {
      if (current.trim()) result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  if (current.trim()) result.push(current.trim());
  return result;
}

/**
 * Extract the mini-notation pattern string from a Strudel code snippet.
 * Patterns could be like: `s("bd sd hh")` or `note("c4 e4 g4")` or just raw mini-notation.
 */
function extractPatterns(code: string): { type: 'sound' | 'note'; pattern: string }[] {
  const results: { type: 'sound' | 'note'; pattern: string }[] = [];

  // Match s("...") or sound("...")
  const soundRegex = /(?:^|\.)?\s*(?:s|sound)\s*\(\s*["'`]([^"'`]+)["'`]\s*\)/g;
  let m: RegExpExecArray | null;
  while ((m = soundRegex.exec(code)) !== null) {
    results.push({ type: 'sound', pattern: m[1] });
  }

  // Match note("...") or n("...")
  const noteRegex = /(?:^|\.)?\s*(?:note|n)\s*\(\s*["'`]([^"'`]+)["'`]\s*\)/g;
  while ((m = noteRegex.exec(code)) !== null) {
    results.push({ type: 'note', pattern: m[1] });
  }

  // If nothing matched, try treating the whole thing as mini-notation
  if (results.length === 0) {
    const trimmed = code.trim();
    // Check if it looks like mini-notation (has note names or sample names)
    if (/^[a-g][b#]?\d/i.test(trimmed) || /^[\[<]/.test(trimmed)) {
      // Try to figure out if it's notes or sounds
      if (/[a-g][b#]?\d/i.test(trimmed)) {
        results.push({ type: 'note', pattern: trimmed });
      } else {
        results.push({ type: 'sound', pattern: trimmed });
      }
    }
  }

  return results;
}

export interface TrackExportInfo {
  track: Track;
  exportable: boolean;
  reason?: string;
}

/**
 * Analyze which tracks can be exported to MIDI.
 */
export function analyzeTracksForExport(project: Project): TrackExportInfo[] {
  return project.tracks.map((track) => {
    const clipIds = Object.values(track.clips);
    if (clipIds.length === 0) {
      return { track, exportable: false, reason: 'No clips' };
    }

    let hasExportable = false;
    for (const clipId of clipIds) {
      const clip = project.clips[clipId];
      if (!clip) continue;
      const patterns = extractPatterns(clip.pattern);
      if (patterns.length > 0) {
        hasExportable = true;
        break;
      }
    }

    return {
      track,
      exportable: hasExportable,
      reason: hasExportable ? undefined : 'No parseable patterns',
    };
  });
}

/**
 * Convert a project to a MIDI blob.
 */
export function exportToMidi(project: Project, includedTrackIds?: Set<string>): Blob {
  const midiTracks: MidiWriter.Track[] = [];

  for (const track of project.tracks) {
    if (includedTrackIds && !includedTrackIds.has(track.id)) continue;

    const midiTrack = new MidiWriter.Track();
    midiTrack.setTempo(project.bpm);
    midiTrack.addTrackName(track.name);

    const isDrum = track.type === 'drums';
    if (isDrum) {
      // Channel 10 (index 9) for drums
      (midiTrack as any).channel = 10;
    }

    // Collect all clip placements sorted by bar
    const placements = Object.entries(track.clips)
      .map(([bar, clipId]) => ({ bar: Number(bar), clipId }))
      .sort((a, b) => a.bar - b.bar);

    // Track current position in ticks (128 ticks per beat, 4 beats per bar = 512 ticks per bar)
    let currentTick = 0;

    for (const { bar, clipId } of placements) {
      const clip = project.clips[clipId];
      if (!clip) continue;

      const activePattern =
        clip.activeVariation !== undefined && clip.variations
          ? clip.variations[clip.activeVariation] ?? clip.pattern
          : clip.pattern;

      const patterns = extractPatterns(activePattern);
      if (patterns.length === 0) continue;

      const barStartTick = bar * 512; // 4 beats * 128 ticks

      // If we need to jump ahead, add a rest
      if (barStartTick > currentTick) {
        const restTicks = barStartTick - currentTick;
        midiTrack.addEvent(
          new MidiWriter.NoteEvent({
            pitch: [0] as any,
            duration: `T${restTicks}`,
            velocity: 0,
            channel: isDrum ? 10 : 1,
          })
        );
        currentTick = barStartTick;
      }

      const totalClipTicks = clip.durationBars * 512;

      for (const { type, pattern } of patterns) {
        const notes = tokenizeMiniNotation(pattern);

        for (const note of notes) {
          const durationTicks = Math.max(1, Math.round(note.fraction * totalClipTicks));

          if (note.token === '~') {
            // Rest
            midiTrack.addEvent(
              new MidiWriter.NoteEvent({
                pitch: [0] as any,
                duration: `T${durationTicks}`,
                velocity: 0,
                channel: isDrum ? 10 : 1,
              })
            );
            currentTick += durationTicks;
            continue;
          }

          let midiNote: number | undefined;

          if (isDrum || type === 'sound') {
            // Try drum map first
            const cleanToken = note.token.replace(/[:\/].*/g, '').toLowerCase();
            midiNote = DRUM_MAP[cleanToken];
            // If not in drum map, try as note name
            if (midiNote === undefined) {
              midiNote = parseNoteName(cleanToken);
            }
          } else {
            // Melodic
            midiNote = parseNoteName(note.token.toLowerCase());
          }

          if (midiNote !== undefined) {
            midiTrack.addEvent(
              new MidiWriter.NoteEvent({
                pitch: [midiNote] as any,
                duration: `T${durationTicks}`,
                velocity: Math.round(track.volume * 100),
                channel: isDrum ? 10 : 1,
              })
            );
          } else {
            // Unparseable token - add as rest
            midiTrack.addEvent(
              new MidiWriter.NoteEvent({
                pitch: [0] as any,
                duration: `T${durationTicks}`,
                velocity: 0,
                channel: isDrum ? 10 : 1,
              })
            );
          }
          currentTick += durationTicks;
        }
      }
    }

    midiTracks.push(midiTrack);
  }

  if (midiTracks.length === 0) {
    // Create an empty track with tempo
    const emptyTrack = new MidiWriter.Track();
    emptyTrack.setTempo(project.bpm);
    midiTracks.push(emptyTrack);
  }

  const writer = new MidiWriter.Writer(midiTracks);
  const dataUri = writer.dataUri();
  // dataUri is like "data:audio/midi;base64,..."
  const base64 = dataUri.split(',')[1];
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: 'audio/midi' });
}

/**
 * Download a MIDI file of the project.
 */
export function downloadMidi(project: Project, filename?: string, includedTrackIds?: Set<string>): void {
  const blob = exportToMidi(project, includedTrackIds);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `${project.name.replace(/\s+/g, '_')}.mid`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
