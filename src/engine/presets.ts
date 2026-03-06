import type { TrackType } from './types';

export interface Preset {
  name: string;
  trackType: TrackType;
  pattern: string;
  tags: string[];
}

export const PRESETS: Preset[] = [
  // ===== DRUMS =====
  {
    name: 'Basic Rock',
    trackType: 'drums',
    pattern: 's("[bd bd, sd:1 ~ sd:1 ~, hh*8]")',
    tags: ['rock', 'basic', '4/4', 'beginner'],
  },
  {
    name: 'Four on Floor',
    trackType: 'drums',
    pattern: 's("[bd*4, ~ sd ~ sd, hh*8, ~ ~ ~ oh]")',
    tags: ['house', 'dance', 'edm', '4/4'],
  },
  {
    name: 'Breakbeat',
    trackType: 'drums',
    pattern: 's("[bd ~ ~ bd ~ ~ bd ~, ~ ~ sd ~ ~ sd ~ ~, hh*8]")',
    tags: ['breakbeat', 'funk', 'syncopated'],
  },
  {
    name: 'Lo-fi Hip Hop',
    trackType: 'drums',
    pattern: 's("[bd ~ ~ bd:3 ~ ~, ~ ~ sd:2 ~ ~ sd:2, hh hh oh hh]")',
    tags: ['lofi', 'hip-hop', 'chill', 'boom-bap'],
  },
  {
    name: 'Trap',
    trackType: 'drums',
    pattern: 's("[bd ~ ~ ~ bd ~ ~ ~, ~ ~ ~ ~ sd ~ ~ ~, hh*16]")',
    tags: ['trap', 'hip-hop', 'hi-hat rolls'],
  },

  // ===== BASS =====
  {
    name: 'Simple Sub',
    trackType: 'bass',
    pattern: 'note("c2 ~ c2 ~").s("sawtooth").lpf(200)',
    tags: ['sub', 'simple', 'beginner'],
  },
  {
    name: 'Walking Bass',
    trackType: 'bass',
    pattern: 'note("c2 e2 g2 a2").s("sawtooth").lpf(800)',
    tags: ['walking', 'jazz', 'melodic'],
  },
  {
    name: 'Synth Bass',
    trackType: 'bass',
    pattern: 'note("c2 ~ c3 c2 ~ eb2 ~ c2").s("square").lpf(600).decay(.1).sustain(.4)',
    tags: ['synth', 'electronic', 'punchy'],
  },
  {
    name: 'Acid Bass',
    trackType: 'bass',
    pattern: 'note("c2 c2 c3 c2 eb2 c2 c3 c2").s("sawtooth").lpf(sine.range(200,2000).slow(4)).resonance(15)',
    tags: ['acid', '303', 'squelchy', 'electronic'],
  },
  {
    name: 'Reggae Bass',
    trackType: 'bass',
    pattern: 'note("~ c2 ~ ~ ~ c2 ~ eb2").s("triangle").lpf(400)',
    tags: ['reggae', 'offbeat', 'dub'],
  },

  // ===== MELODY =====
  {
    name: 'Simple Arp',
    trackType: 'melody',
    pattern: 'note("c4 e4 g4 b4").s("triangle").decay(.1).sustain(.3)',
    tags: ['arpeggio', 'simple', 'beginner'],
  },
  {
    name: 'Lead Line',
    trackType: 'melody',
    pattern: 'note("c5 ~ e5 d5 ~ c5 b4 ~").s("sawtooth").lpf(3000).decay(.2).sustain(.5)',
    tags: ['lead', 'melodic', 'synth'],
  },
  {
    name: 'Ambient Pad Melody',
    trackType: 'melody',
    pattern: 'note("c4 ~ ~ eb4 ~ ~ g4 ~").s("sine").gain(.5).delay(.5).room(2)',
    tags: ['ambient', 'pad', 'atmospheric', 'slow'],
  },
  {
    name: 'Jazzy Melody',
    trackType: 'melody',
    pattern: 'note("d4 f4 a4 c5 ~ bb4 g4 ~").s("sine").lpf(2000).delay(.3)',
    tags: ['jazz', 'smooth', 'melodic'],
  },
  {
    name: 'Pluck Melody',
    trackType: 'melody',
    pattern: 'note("c5 e5 g4 c5 d5 b4 a4 g4").s("triangle").decay(.05).sustain(.1)',
    tags: ['pluck', 'staccato', 'rhythmic'],
  },

  // ===== CHORDS =====
  {
    name: 'Minor 7ths',
    trackType: 'chords',
    pattern: 'note("<[c3,eb3,g3,bb3] [f3,ab3,c4,eb4]>/2").s("sine").gain(.4)',
    tags: ['minor', 'seventh', 'dark', 'moody'],
  },
  {
    name: 'Major Progression',
    trackType: 'chords',
    pattern: 'note("<[c3,e3,g3] [f3,a3,c4] [g3,b3,d4] [c3,e3,g3]>/4").s("triangle").gain(.4)',
    tags: ['major', 'progression', 'bright', 'classic'],
  },
  {
    name: 'Jazzy Voicings',
    trackType: 'chords',
    pattern: 'note("<[d3,f3,a3,c4] [g3,b3,d4,f4] [c3,e3,g3,b3]>/3").s("sine").gain(.35).room(1)',
    tags: ['jazz', 'voicings', 'extended', 'smooth'],
  },
  {
    name: 'Pad Chords',
    trackType: 'chords',
    pattern: 'note("<[c3,eb3,g3] [ab2,c3,eb3] [bb2,d3,f3]>/3").s("sine").gain(.3).room(2).delay(.4)',
    tags: ['pad', 'ambient', 'sustained', 'atmospheric'],
  },
  {
    name: 'Power Chords',
    trackType: 'chords',
    pattern: 'note("<[c3,g3,c4] [f3,c4,f4] [g3,d4,g4] [c3,g3,c4]>/4").s("sawtooth").lpf(1000).gain(.5)',
    tags: ['power', 'rock', 'heavy', 'distorted'],
  },
];
