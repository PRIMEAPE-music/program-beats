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
    description: 'Laid-back boom bap drums with swing, jazzy Rhodes chords, warm sub bass, and vinyl texture',
    bpm: 82,
    scaleRoot: 'Eb',
    scaleName: 'minor',
    tracks: [
      {
        name: 'Dusty Drums',
        type: 'drums',
        pattern: 'stack(s("bd ~ [~ bd] ~, ~ [~ sd:1] ~ sd:2, [hh hh] [~ hh] [hh hh] [hh ~]").gain(0.6), s("~ ~ rim ~").gain(0.2))',
      },
      {
        name: 'Rhodes Chords',
        type: 'chords',
        pattern: 'note("<[eb3,gb3,bb3,db4] ~ [ab3,cb4,eb4] ~, ~ [bb2,db3,f3,ab3] ~ [gb2,bb2,db3]>").sound("sine").lpf(2200).gain(0.35).room(0.4).delay(0.2)',
      },
      {
        name: 'Warm Bass',
        type: 'bass',
        pattern: 'note("eb2 ~ [~ eb2] ~ gb2 ~ ab2 [~ gb2]").sound("triangle").lpf(600).gain(0.6)',
      },
      {
        name: 'Vinyl Texture',
        type: 'fx',
        pattern: 's("hh*16").gain(sine.slow(8).range(0.01, 0.06)).lpf(2500).hpf(1200)',
      },
    ],
    sections: [
      { name: 'Intro', bars: 4 },
      { name: 'Verse', bars: 8 },
      { name: 'Chorus', bars: 8 },
      { name: 'Verse 2', bars: 8 },
      { name: 'Outro', bars: 4 },
    ],
  },
  {
    name: 'Deep House',
    description: 'Shuffled four-on-the-floor groove, off-beat hats, deep rolling bass, and classic piano stabs',
    bpm: 124,
    scaleRoot: 'A',
    scaleName: 'minor',
    tracks: [
      {
        name: 'House Groove',
        type: 'drums',
        pattern: 'stack(s("bd*4, ~ cp ~ cp").gain(0.8), s("[~ hh] [~ hh] [~ hh] [~ oh]").gain(0.45), s("~ ~ ~ ~ ~ ~ rim ~").gain(0.2))',
      },
      {
        name: 'Deep Bass',
        type: 'bass',
        pattern: 'note("a1 ~ [a1 ~] ~ [~ a1] ~ [a1 e1] ~").sound("sine").gain(0.8).lpf(400).decay(0.3).sustain(0.4)',
      },
      {
        name: 'Piano Stabs',
        type: 'chords',
        pattern: 'note("<~ [a3,c4,e4] ~ [a3,c4,e4], ~ ~ [d3,f3,a3] ~>").sound("piano").gain(0.45).decay(0.1).sustain(0.15).delay(0.15)',
      },
      {
        name: 'Perc Loop',
        type: 'fx',
        pattern: 'stack(s("[~ rim] [~ rim] [~ rim] [~ ~]").gain(0.2), s("hh*16").gain(0.15).lpf(6000))',
      },
    ],
    sections: [
      { name: 'Intro', bars: 8 },
      { name: 'Build', bars: 4 },
      { name: 'Drop', bars: 16 },
      { name: 'Breakdown', bars: 8 },
      { name: 'Drop 2', bars: 16 },
      { name: 'Outro', bars: 8 },
    ],
  },
  {
    name: 'Ambient',
    description: 'Sparse gentle percussion, slowly evolving pad textures, delicate arpeggios, and deep reverb spaces',
    bpm: 68,
    scaleRoot: 'D',
    scaleName: 'major',
    tracks: [
      {
        name: 'Gentle Percussion',
        type: 'drums',
        pattern: 's("~ ~ [rim ~] ~, [~ hh] ~ [~ hh] ~").gain(0.2).room(0.7).delay(0.5)',
      },
      {
        name: 'Evolving Pad',
        type: 'chords',
        pattern: 'note("<[d3,fis3,a3] [a2,d3,fis3] [b2,d3,g3] [g2,b2,d3]>/4").sound("sawtooth").lpf(sine.slow(8).range(800, 1800)).gain(0.2).room(0.85).delay(0.4)',
      },
      {
        name: 'Glass Arps',
        type: 'melody',
        pattern: 'note("d5 ~ fis5 ~ a5 ~ fis5 ~ e5 ~ a5 ~ d6 ~ a5 ~").sound("triangle").gain(0.2).delay(0.55).room(0.7).decay(0.05).sustain(0.1)',
      },
      {
        name: 'Sub Drone',
        type: 'fx',
        pattern: 'note("d2").sound("sine").gain(0.15).room(0.9)',
      },
    ],
    sections: [
      { name: 'Intro', bars: 8 },
      { name: 'Evolve A', bars: 16 },
      { name: 'Evolve B', bars: 16 },
      { name: 'Fade', bars: 8 },
    ],
  },
  {
    name: 'Trap',
    description: 'Hard-hitting 808 kicks, crispy snare rolls, signature triplet hi-hats, dark minor melodies',
    bpm: 145,
    scaleRoot: 'C',
    scaleName: 'minor',
    tracks: [
      {
        name: '808 Drums',
        type: 'drums',
        pattern: 'stack(s("bd ~ ~ ~ bd ~ [~ bd] ~, ~ ~ ~ ~ sd ~ ~ ~").gain(0.9), s("[hh hh hh hh] [hh hh hh [hh hh hh]] [hh hh hh hh] [hh [hh hh hh] hh [hh hh hh hh hh]]").gain(0.5).lpf(9000))',
      },
      {
        name: '808 Bass',
        type: 'bass',
        pattern: 'note("c1 ~ ~ c1 ~ ~ [~ eb1] ~").sound("sine").gain(0.9).lpf(350).decay(0.8).sustain(0.7)',
      },
      {
        name: 'Dark Keys',
        type: 'melody',
        pattern: 'note("c4 ~ eb4 ~ g4 [~ f4] eb4 ~").sound("triangle").lpf(2500).gain(0.35).delay(0.2).room(0.3)',
      },
      {
        name: 'Trap Chords',
        type: 'chords',
        pattern: 'note("<[c3,eb3,g3] ~ ~ ~, ~ ~ [ab2,c3,eb3] ~>/2").sound("sine").gain(0.3).room(0.4).decay(0.2).sustain(0.3)',
      },
    ],
    sections: [
      { name: 'Intro', bars: 4 },
      { name: 'Verse', bars: 8 },
      { name: 'Hook', bars: 8 },
      { name: 'Verse 2', bars: 8 },
      { name: 'Hook 2', bars: 8 },
      { name: 'Outro', bars: 4 },
    ],
  },
  {
    name: 'Synthwave',
    description: 'Retro 80s gated drums, pulsing sequenced bass, bright square-wave arps, and lush analog pads',
    bpm: 108,
    scaleRoot: 'F',
    scaleName: 'minor',
    tracks: [
      {
        name: 'Gated Drums',
        type: 'drums',
        pattern: 'stack(s("bd ~ bd ~, ~ sd ~ sd, [hh hh] [hh hh] [hh hh] [hh oh]").gain(0.75), s("~ ~ ~ ~ ~ ~ ~ cp").gain(0.3))',
      },
      {
        name: 'Sequenced Bass',
        type: 'bass',
        pattern: 'note("[f1 f1] [f1 ~] [ab1 ab1] [ab1 ~], [eb1 eb1] [eb1 ~] [db1 db1] [db1 ~]").sound("sawtooth").lpf(sine.slow(4).range(400, 1400)).gain(0.65).decay(0.05).sustain(0.3)',
      },
      {
        name: 'Square Arps',
        type: 'melody',
        pattern: 'note("f4 ab4 c5 eb5 c5 ab4 f4 ab4, db5 f5 ab5 f5 db5 ab4 db5 f5").sound("square").lpf(5000).gain(0.3).delay(0.3)',
      },
      {
        name: 'Analog Pads',
        type: 'chords',
        pattern: 'note("<[f3,ab3,c4] [db3,f3,ab3] [eb3,gb3,bb3] [db3,f3,ab3]>/2").sound("sawtooth").lpf(2000).gain(0.25).room(0.5)',
      },
    ],
    sections: [
      { name: 'Intro', bars: 4 },
      { name: 'Verse', bars: 8 },
      { name: 'Chorus', bars: 8 },
      { name: 'Solo', bars: 8 },
      { name: 'Chorus 2', bars: 8 },
      { name: 'Outro', bars: 4 },
    ],
  },
  {
    name: 'Drum & Bass',
    description: 'Fast two-step breakbeats, heavy Reese sub bass with filter movement, dark pads, and choppy stab melodies',
    bpm: 174,
    scaleRoot: 'E',
    scaleName: 'minor',
    tracks: [
      {
        name: 'Two-Step Breaks',
        type: 'drums',
        pattern: 'stack(s("bd ~ [~ bd] ~, [~ ~] sd ~ [sd ~], hh*8").gain(0.8), s("~ ~ ~ ~ ~ ~ ~ oh").gain(0.3))',
      },
      {
        name: 'Reese Bass',
        type: 'bass',
        pattern: 'note("<e1 [~ e1] ~ ~, ~ d1 [~ c1] ~>").sound("sawtooth").lpf(sine.slow(2).range(200, 1400)).lpq(6).gain(0.7)',
      },
      {
        name: 'Dark Pads',
        type: 'chords',
        pattern: 'note("<[e3,g3,b3] [c3,e3,g3] [a2,c3,e3] [b2,d3,fis3]>/2").sound("sawtooth").lpf(1600).gain(0.2).room(0.6)',
      },
      {
        name: 'Stab Melody',
        type: 'melody',
        pattern: 'note("[e4 ~] [~ g4] [b4 ~] [a4 ~] [g4 ~] [~ e4] [fis4 ~] [~ ~]").sound("square").lpf(3000).gain(0.3).decay(0.05).sustain(0.1).delay(0.15)',
      },
    ],
    sections: [
      { name: 'Intro', bars: 8 },
      { name: 'Drop A', bars: 16 },
      { name: 'Breakdown', bars: 8 },
      { name: 'Drop B', bars: 16 },
      { name: 'Outro', bars: 8 },
    ],
  },
  {
    name: 'Reggaeton',
    description: 'Signature dembow kick-snare pattern, rim-shot accents, deep bass pulse, and catchy melodic hooks',
    bpm: 94,
    scaleRoot: 'D',
    scaleName: 'minor',
    tracks: [
      {
        name: 'Dembow',
        type: 'drums',
        pattern: 'stack(s("bd ~ ~ bd, ~ [~ sd] ~ sd").gain(0.85), s("~ [rim rim] ~ [rim rim]").gain(0.5), s("[~ hh] [~ hh] [~ hh] [~ oh]").gain(0.35))',
      },
      {
        name: 'Deep Bass',
        type: 'bass',
        pattern: 'note("d2 ~ [d2 ~] ~ [~ d2] ~ [d2 a1] ~").sound("sine").gain(0.85).lpf(400).decay(0.4).sustain(0.5)',
      },
      {
        name: 'Melodic Hook',
        type: 'melody',
        pattern: 'note("d4 [~ f4] a4 ~ [g4 f4] ~ e4 [~ d4]").sound("triangle").gain(0.4).delay(0.15).room(0.2)',
      },
      {
        name: 'Perc Fills',
        type: 'fx',
        pattern: 'stack(s("~ cb ~ cb").gain(0.3), s("~ ~ ~ ~ ~ ~ [sd:1 sd:1 sd:1] ~").gain(0.25))',
      },
    ],
    sections: [
      { name: 'Intro', bars: 4 },
      { name: 'Verse', bars: 8 },
      { name: 'Pre-Chorus', bars: 4 },
      { name: 'Chorus', bars: 8 },
      { name: 'Verse 2', bars: 8 },
      { name: 'Chorus 2', bars: 8 },
      { name: 'Outro', bars: 4 },
    ],
  },
  {
    name: 'Jazz',
    description: 'Swung ride cymbal pattern, brushed snare, chromatic walking bass, and rich extended chord voicings',
    bpm: 132,
    scaleRoot: 'Bb',
    scaleName: 'major',
    tracks: [
      {
        name: 'Swing Kit',
        type: 'drums',
        pattern: 'stack(s("ride [~ ride] ride [~ ride]").gain(0.45), s("~ ~ ~ ~ sd ~ ~ ~").gain(0.2), s("bd ~ ~ ~ ~ ~ bd ~").gain(0.35), s("[hh ~] [~ hh] [hh ~] [~ hh]").gain(0.15))',
      },
      {
        name: 'Walking Bass',
        type: 'bass',
        pattern: 'note("bb1 d2 f2 g2 eb2 g2 a2 f2").sound("sawtooth").lpf(900).gain(0.55).decay(0.1).sustain(0.4)',
      },
      {
        name: 'Jazz Chords',
        type: 'chords',
        pattern: 'note("<[bb2,d3,f3,a3] [eb3,g3,bb3,d4] [ab2,c3,eb3,g3] [f2,a2,c3,eb3]>").sound("piano").gain(0.35).room(0.3)',
      },
      {
        name: 'Horn Melody',
        type: 'melody',
        pattern: 'note("bb4 d5 f5 [~ eb5] d5 c5 [bb4 a4] ~").sound("sawtooth").lpf(2200).gain(0.35).room(0.25).delay(0.1)',
      },
    ],
    sections: [
      { name: 'Head In', bars: 8 },
      { name: 'Solo A', bars: 8 },
      { name: 'Solo B', bars: 8 },
      { name: 'Trading 4s', bars: 8 },
      { name: 'Head Out', bars: 8 },
    ],
  },
  {
    name: 'Techno',
    description: 'Driving kicks, industrial percussion, hypnotic acid bass, and dark atmospheric textures',
    bpm: 135,
    scaleRoot: 'C',
    scaleName: 'minor',
    tracks: [
      {
        name: 'Techno Kick',
        type: 'drums',
        pattern: 'stack(s("bd*4").gain(0.85), s("~ [~ cp] ~ [~ cp]").gain(0.5), s("[hh hh] [hh oh] [hh hh] [hh oh]").gain(0.35))',
      },
      {
        name: 'Acid Line',
        type: 'bass',
        pattern: 'note("c2 [c2 c3] [~ c2] c2 eb2 [c2 g2] [~ c2] c2").sound("sawtooth").lpf(sine.slow(4).range(300, 4000)).lpq(15).gain(0.6)',
      },
      {
        name: 'Industrial Perc',
        type: 'fx',
        pattern: 'stack(s("[rim ~] [~ rim] [rim ~] [rim rim]").gain(0.3), s("~ ~ ~ ~ [mt mt] ~ ~ ~").gain(0.2), s("hh*16").gain(0.12).lpf(5000).hpf(2000))',
      },
      {
        name: 'Dark Atmosphere',
        type: 'chords',
        pattern: 'note("<[c3,eb3,g3] [c3,eb3,g3] [ab2,c3,eb3] [bb2,d3,f3]>/4").sound("sawtooth").lpf(sine.slow(8).range(600, 1400)).gain(0.18).room(0.6)',
      },
    ],
    sections: [
      { name: 'Intro', bars: 8 },
      { name: 'Build', bars: 8 },
      { name: 'Peak', bars: 16 },
      { name: 'Breakdown', bars: 8 },
      { name: 'Peak 2', bars: 16 },
      { name: 'Outro', bars: 8 },
    ],
  },
  {
    name: 'UK Garage',
    description: 'Skippy 2-step drums, shuffled bass, chopped vocal chords, and bright synth hooks',
    bpm: 138,
    scaleRoot: 'G',
    scaleName: 'minor',
    tracks: [
      {
        name: '2-Step Drums',
        type: 'drums',
        pattern: 'stack(s("bd ~ [~ bd] ~, ~ sd ~ [~ sd]").gain(0.8), s("[hh ~] [~ hh] [hh ~] [hh oh]").gain(0.4), s("~ ~ ~ ~ ~ ~ rim ~").gain(0.2))',
      },
      {
        name: 'Skippy Bass',
        type: 'bass',
        pattern: 'note("g1 ~ [g1 ~] ~ [~ g1] ~ [bb1 a1] ~").sound("sine").gain(0.75).lpf(500).decay(0.15).sustain(0.3)',
      },
      {
        name: 'Chopped Chords',
        type: 'chords',
        pattern: 'note("<[g3,bb3,d4] [~ ~] [eb3,g3,bb3] [~ ~], [~ ~] [c3,eb3,g3] [~ ~] [d3,f3,a3]>").sound("piano").gain(0.4).decay(0.08).sustain(0.15)',
      },
      {
        name: 'Bright Synth',
        type: 'melody',
        pattern: 'note("g4 [~ bb4] d5 ~ [c5 bb4] ~ a4 [~ g4]").sound("square").lpf(4500).gain(0.3).delay(0.2)',
      },
    ],
    sections: [
      { name: 'Intro', bars: 4 },
      { name: 'Verse', bars: 8 },
      { name: 'Chorus', bars: 8 },
      { name: 'Breakdown', bars: 4 },
      { name: 'Chorus 2', bars: 8 },
      { name: 'Outro', bars: 4 },
    ],
  },
];
