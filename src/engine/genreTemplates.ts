import type { TrackType } from './types';

export interface GenreTemplate {
  name: string;
  description: string;
  bpm: number;
  scaleRoot: string;
  scaleName: string;
  tracks: Array<{
    name: string;
    type: TrackType;
    pattern: string;
  }>;
  sections: Array<{
    name: string;
    bars: number;
  }>;
}

export const GENRE_TEMPLATES: GenreTemplate[] = [
  {
    name: 'Lo-fi Hip Hop',
    description: 'Dusty drums, jazzy chords, mellow bass, and vinyl crackle for chill study vibes',
    bpm: 85,
    scaleRoot: 'C',
    scaleName: 'minor',
    tracks: [
      {
        name: 'Dusty Drums',
        type: 'drums',
        pattern: 's("bd ~ ~ bd, ~ sd ~ sd:1, hh*8").gain(0.65)',
      },
      {
        name: 'Jazzy Chords',
        type: 'chords',
        pattern: 'note("<Cm7 Fm7 Ab7 G7>").sound("piano").lpf(2000).gain(0.4).room(0.4)',
      },
      {
        name: 'Mellow Bass',
        type: 'bass',
        pattern: 'note("c2 ~ eb2 ~ c2 ~ g1 ~").sound("sawtooth").lpf(600).gain(0.6)',
      },
      {
        name: 'Vinyl Crackle',
        type: 'fx',
        pattern: 's("hh*16").gain(sine.range(0.02, 0.08)).lpf(3000).hpf(800)',
      },
    ],
    sections: [
      { name: 'Intro', bars: 4 },
      { name: 'Verse', bars: 8 },
      { name: 'Chorus', bars: 8 },
      { name: 'Outro', bars: 4 },
    ],
  },
  {
    name: 'House',
    description: 'Four-on-the-floor kicks, driving bass, piano stabs, and rolling hi-hats',
    bpm: 128,
    scaleRoot: 'G',
    scaleName: 'minor',
    tracks: [
      {
        name: 'Four on Floor',
        type: 'drums',
        pattern: 's("bd*4, ~ cp ~ cp, [hh hh] [hh oh] [hh hh] [hh oh]").gain(0.8)',
      },
      {
        name: 'Driving Bass',
        type: 'bass',
        pattern: 'note("g1*2 g1 [g1 bb1], d2 ~ d1 ~").sound("sawtooth").lpf(800).gain(0.7)',
      },
      {
        name: 'Piano Stabs',
        type: 'chords',
        pattern: 'note("<~ Gm7 ~ Gm7, ~ ~ Cm7 ~>").sound("piano").gain(0.5).delay(0.2)',
      },
      {
        name: 'Hi-Hat Patterns',
        type: 'fx',
        pattern: 's("hh*16").gain("[0.3 0.1 0.2 0.1]*4").lpf(8000)',
      },
    ],
    sections: [
      { name: 'Intro', bars: 8 },
      { name: 'Build', bars: 4 },
      { name: 'Drop', bars: 8 },
      { name: 'Breakdown', bars: 8 },
      { name: 'Drop 2', bars: 8 },
    ],
  },
  {
    name: 'Ambient',
    description: 'Sparse pads, gentle arps, soft percussion, and atmospheric textures',
    bpm: 70,
    scaleRoot: 'D',
    scaleName: 'major',
    tracks: [
      {
        name: 'Soft Percussion',
        type: 'drums',
        pattern: 's("~ ~ rim ~, hh*4").gain(0.25).room(0.7).delay(0.4)',
      },
      {
        name: 'Gentle Arps',
        type: 'melody',
        pattern: 'note("d5 fis5 a5 fis5 e5 a5 d6 a5").sound("triangle").gain(0.3).delay(0.5).room(0.6)',
      },
      {
        name: 'Lush Pads',
        type: 'chords',
        pattern: 'note("<D3 A3 Bm G3>/2").sound("sawtooth").lpf(1200).gain(0.25).room(0.8)',
      },
      {
        name: 'Atmosphere',
        type: 'fx',
        pattern: 'note("d4 a4").sound("sine").gain(0.15).room(0.9).delay(0.6)',
      },
    ],
    sections: [
      { name: 'Intro', bars: 8 },
      { name: 'Evolve', bars: 16 },
      { name: 'Outro', bars: 8 },
    ],
  },
  {
    name: 'Trap',
    description: 'Hard 808 bass, rapid hi-hats, heavy snare rolls, and dark melodies',
    bpm: 140,
    scaleRoot: 'A',
    scaleName: 'minor',
    tracks: [
      {
        name: '808 Drums',
        type: 'drums',
        pattern: 's("bd ~ ~ bd ~ ~ bd ~, ~ ~ sd ~ ~ ~ sd ~, hh*16").gain(0.85)',
      },
      {
        name: '808 Bass',
        type: 'bass',
        pattern: 'note("a1 ~ ~ a1 ~ ~ e1 ~").sound("sine").gain(0.9).lpf(400)',
      },
      {
        name: 'Trap Hi-Hats',
        type: 'fx',
        pattern: 's("[hh*4] [hh*8] [hh*4] [hh*16]").gain(0.5).lpf(9000)',
      },
      {
        name: 'Dark Melody',
        type: 'melody',
        pattern: 'note("a4 ~ c5 ~ e5 ~ d5 c5").sound("triangle").lpf(3000).gain(0.4).delay(0.15)',
      },
    ],
    sections: [
      { name: 'Intro', bars: 4 },
      { name: 'Verse', bars: 8 },
      { name: 'Chorus', bars: 8 },
      { name: 'Bridge', bars: 4 },
      { name: 'Outro', bars: 4 },
    ],
  },
  {
    name: 'Synthwave',
    description: 'Retro drums, pulsing bass, bright arpeggios, and lush analog pads',
    bpm: 110,
    scaleRoot: 'F',
    scaleName: 'minor',
    tracks: [
      {
        name: 'Retro Drums',
        type: 'drums',
        pattern: 's("bd ~ bd ~, ~ sd ~ sd, hh*8, ~ ~ ~ oh").gain(0.75)',
      },
      {
        name: 'Pulsing Bass',
        type: 'bass',
        pattern: 'note("f1*4 ab1*2 eb1*2").sound("sawtooth").lpf(sine.range(400, 1200)).gain(0.7)',
      },
      {
        name: 'Bright Arps',
        type: 'melody',
        pattern: 'note("f4 ab4 c5 eb5 c5 ab4 f4 c4").sound("square").lpf(4000).gain(0.35).delay(0.3)',
      },
      {
        name: 'Lush Pads',
        type: 'chords',
        pattern: 'note("<Fm Ab Eb Bbm>/2").sound("sawtooth").lpf(2000).gain(0.3).room(0.5)',
      },
    ],
    sections: [
      { name: 'Intro', bars: 4 },
      { name: 'Verse', bars: 8 },
      { name: 'Chorus', bars: 8 },
      { name: 'Bridge', bars: 4 },
      { name: 'Outro', bars: 4 },
    ],
  },
  {
    name: 'Drum & Bass',
    description: 'Fast breakbeats, deep reese bass, atmospheric pads, and choppy melodies',
    bpm: 174,
    scaleRoot: 'E',
    scaleName: 'minor',
    tracks: [
      {
        name: 'Breakbeats',
        type: 'drums',
        pattern: 's("bd ~ [~ bd] ~, ~ sd ~ [sd sd], hh*8 oh").gain(0.8)',
      },
      {
        name: 'Reese Bass',
        type: 'bass',
        pattern: 'note("<e1 d1 c1 b0>").sound("sawtooth").lpf(sine.range(200, 1600)).lpq(6).gain(0.75)',
      },
      {
        name: 'Atmospheric Pads',
        type: 'chords',
        pattern: 'note("<Em7 Cmaj7 Am7 Bm7>/2").sound("sawtooth").lpf(1800).gain(0.25).room(0.6)',
      },
      {
        name: 'Choppy Melody',
        type: 'melody',
        pattern: 'note("e4 ~ g4 ~ b4 a4 ~ g4").sound("square").lpf(3500).gain(0.35).delay(0.2)',
      },
    ],
    sections: [
      { name: 'Intro', bars: 8 },
      { name: 'Drop', bars: 16 },
      { name: 'Breakdown', bars: 8 },
      { name: 'Drop 2', bars: 16 },
    ],
  },
  {
    name: 'Reggaeton',
    description: 'Dembow rhythm, reggaeton bass, melodic hooks, and Latin percussion',
    bpm: 95,
    scaleRoot: 'D',
    scaleName: 'minor',
    tracks: [
      {
        name: 'Dembow Rhythm',
        type: 'drums',
        pattern: 's("bd ~ ~ bd, ~ sd ~ sd, ~ [rim rim] ~ [rim rim]").gain(0.8)',
      },
      {
        name: 'Reggaeton Bass',
        type: 'bass',
        pattern: 'note("d2 ~ d2 ~, ~ a1 ~ a1").sound("sine").gain(0.85).lpf(500)',
      },
      {
        name: 'Melodic Hooks',
        type: 'melody',
        pattern: 'note("d4 f4 a4 ~ g4 f4 e4 ~").sound("triangle").gain(0.45).delay(0.15)',
      },
      {
        name: 'Percussion',
        type: 'fx',
        pattern: 's("~ cb ~ cb, [hh hh] [hh oh] [hh hh] hh").gain(0.5)',
      },
    ],
    sections: [
      { name: 'Intro', bars: 4 },
      { name: 'Verse', bars: 8 },
      { name: 'Pre-Chorus', bars: 4 },
      { name: 'Chorus', bars: 8 },
      { name: 'Outro', bars: 4 },
    ],
  },
  {
    name: 'Jazz',
    description: 'Swing drums, walking bass, rich jazz chords, and sax-like melodies',
    bpm: 120,
    scaleRoot: 'Bb',
    scaleName: 'major',
    tracks: [
      {
        name: 'Swing Drums',
        type: 'drums',
        pattern: 's("~ ~ ride ~, ~ sd ~ ~, hh [~ hh] hh [~ hh]").gain(0.55)',
      },
      {
        name: 'Walking Bass',
        type: 'bass',
        pattern: 'note("bb1 d2 f2 d2, eb2 g2 bb2 g2").sound("sawtooth").lpf(800).gain(0.6)',
      },
      {
        name: 'Jazz Chords',
        type: 'chords',
        pattern: 'note("<Bb7 Eb7 Cm7 F7>").sound("piano").gain(0.4).room(0.3)',
      },
      {
        name: 'Sax Melody',
        type: 'melody',
        pattern: 'note("bb4 d5 f5 ~ eb5 d5 c5 bb4").sound("sawtooth").lpf(2500).gain(0.4).room(0.3)',
      },
    ],
    sections: [
      { name: 'Head In', bars: 8 },
      { name: 'Solo A', bars: 8 },
      { name: 'Solo B', bars: 8 },
      { name: 'Head Out', bars: 8 },
    ],
  },
];
