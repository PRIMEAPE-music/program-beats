export interface Clip {
  id: string;
  name: string;
  pattern: string; // Strudel mini-notation or code
  color: string;
  durationBars: number; // how many bars this clip spans
  variations?: string[]; // array of alternative patterns
  activeVariation?: number; // index into variations, undefined = main pattern
}

export interface TrackEffects {
  delay: number;      // 0-1
  reverb: number;     // 0-1 (room)
  lpf: number;        // 20-20000 Hz (low pass filter cutoff)
  hpf: number;        // 20-20000 Hz (high pass filter cutoff)
  distortion: number; // 0-1
}

export interface MasterEffects {
  reverb: number;     // 0-1
  delay: number;      // 0-1
  compression: number; // 0-1
}

export interface ScaleConfig {
  root: string;       // e.g. "C", "F#", "Bb"
  scale: string;      // e.g. "minor", "major", "dorian", "pentatonic"
}

export interface Track {
  id: string;
  name: string;
  type: TrackType;
  volume: number; // 0-1
  muted: boolean;
  solo: boolean;
  clips: Record<number, string>; // position (bar index) -> clip ID
  effects: TrackEffects;
}

export type TrackType = 'drums' | 'bass' | 'melody' | 'chords' | 'fx' | 'custom';

export interface Section {
  id: string;
  name: string; // e.g. "Intro", "Verse", "Chorus"
  startBar: number;
  endBar: number;
  color: string;
}

export interface Project {
  id: string;
  name: string;
  bpm: number;
  tracks: Track[];
  clips: Record<string, Clip>; // clip ID -> Clip
  sections: Section[];
  totalBars: number;
  masterEffects: MasterEffects;
  scaleConfig: ScaleConfig;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  patterns?: GeneratedPattern[];
  timestamp: number;
}

export interface GeneratedPattern {
  trackType: TrackType;
  pattern: string;
  description: string;
}

export const TRACK_COLORS: Record<TrackType, string> = {
  drums: '#e74c3c',
  bass: '#3498db',
  melody: '#2ecc71',
  chords: '#9b59b6',
  fx: '#f39c12',
  custom: '#1abc9c',
};

export const DEFAULT_CLIP_COLORS = [
  '#e74c3c', '#3498db', '#2ecc71', '#9b59b6',
  '#f39c12', '#1abc9c', '#e67e22', '#e91e63',
];
