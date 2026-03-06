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
    pattern: 'stack(s("bd ~ bd ~, ~ sd ~ sd, [hh hh] [hh hh] [hh hh] [hh oh]").gain(0.75))',
    tags: ['rock', 'basic', '4/4', 'beginner'],
  },
  {
    name: 'Four on Floor',
    trackType: 'drums',
    pattern: 'stack(s("bd*4, ~ cp ~ cp, [~ hh] [~ hh] [~ hh] [~ oh]").gain(0.8))',
    tags: ['house', 'dance', 'edm', '4/4'],
  },
  {
    name: 'Boom Bap',
    trackType: 'drums',
    pattern: 'stack(s("bd ~ ~ ~ bd ~ ~ bd, ~ ~ sd ~ ~ ~ sd ~, hh*8").gain(0.7), s("~ ~ ~ ~ ~ ~ oh ~").gain(0.35))',
    tags: ['hip-hop', 'boom-bap', '90s', 'classic'],
  },
  {
    name: 'Lo-fi Dusty',
    trackType: 'drums',
    pattern: 'stack(s("bd ~ [~ bd] ~, ~ [~ sd:1] ~ sd:2, [hh hh] [~ hh] [hh hh] [hh ~]").gain(0.6), s("~ rim ~ ~").gain(0.2))',
    tags: ['lofi', 'chill', 'dusty', 'hip-hop'],
  },
  {
    name: 'Trap',
    trackType: 'drums',
    pattern: 'stack(s("bd ~ ~ ~ bd ~ [~ bd] ~, ~ ~ ~ ~ sd ~ ~ ~").gain(0.85), s("[hh hh hh hh] [hh hh hh [hh hh hh]] [hh hh hh hh] [hh [hh hh hh] hh [hh hh hh hh hh]]").gain(0.5))',
    tags: ['trap', 'hip-hop', 'hi-hat rolls', '808'],
  },
  {
    name: 'DnB Breaks',
    trackType: 'drums',
    pattern: 'stack(s("bd ~ [~ bd] ~, [~ ~] sd ~ [sd ~], hh*8").gain(0.8), s("~ ~ ~ ~ ~ ~ ~ oh").gain(0.3))',
    tags: ['dnb', 'drum-and-bass', 'breakbeat', 'fast'],
  },
  {
    name: 'Reggaeton Dembow',
    trackType: 'drums',
    pattern: 'stack(s("bd ~ ~ bd, ~ [~ sd] ~ sd, ~ [rim rim] ~ [rim rim]").gain(0.8), s("[~ hh] [~ hh] [~ hh] [~ oh]").gain(0.4))',
    tags: ['reggaeton', 'dembow', 'latin', 'urban'],
  },

  // ===== BASS =====
  {
    name: 'Sub Bass',
    trackType: 'bass',
    pattern: 'note("<c2 c2 eb2 f2>").sound("sine").gain(0.85).lpf(300)',
    tags: ['sub', 'simple', 'deep', 'beginner'],
  },
  {
    name: 'Walking Bass',
    trackType: 'bass',
    pattern: 'note("c2 e2 f2 g2 a2 g2 f2 e2").sound("sawtooth").lpf(900).gain(0.6).decay(0.1).sustain(0.4)',
    tags: ['walking', 'jazz', 'melodic', 'moving'],
  },
  {
    name: 'Acid 303',
    trackType: 'bass',
    pattern: 'note("c2 [c2 c3] c2 [~ c2] eb2 [c2 c3] g1 [c2 ~]").sound("sawtooth").lpf(sine.slow(4).range(300, 3000)).lpq(12).gain(0.65)',
    tags: ['acid', '303', 'squelchy', 'electronic'],
  },
  {
    name: 'Reese Bass',
    trackType: 'bass',
    pattern: 'note("<c1 [~ c1] eb1 ~, f1 ~ g1 [~ ab1]>").sound("sawtooth").lpf(sine.slow(2).range(200, 1200)).lpq(5).gain(0.7)',
    tags: ['reese', 'dnb', 'dark', 'wobble'],
  },
  {
    name: '808 Slide',
    trackType: 'bass',
    pattern: 'note("a1 ~ ~ a1 ~ [a1 e1] ~ ~").sound("sine").gain(0.9).lpf(400).decay(0.8).sustain(0.6)',
    tags: ['808', 'trap', 'hip-hop', 'slide'],
  },
  {
    name: 'Funk Bass',
    trackType: 'bass',
    pattern: 'note("c2 ~ [c2 c2] ~ eb2 ~ c2 [g1 ~]").sound("square").lpf(1200).gain(0.6).decay(0.05).sustain(0.3)',
    tags: ['funk', 'slap', 'groovy', 'rhythmic'],
  },
  {
    name: 'Dub Bass',
    trackType: 'bass',
    pattern: 'note("~ c2 ~ ~ ~ c2 ~ eb2").sound("sine").gain(0.8).lpf(500).room(0.4).delay(0.3)',
    tags: ['dub', 'reggae', 'offbeat', 'deep'],
  },

  // ===== MELODY =====
  {
    name: 'Simple Arp',
    trackType: 'melody',
    pattern: 'note("c4 e4 g4 c5 g4 e4 c4 e4").sound("triangle").decay(0.08).sustain(0.2).gain(0.45)',
    tags: ['arpeggio', 'simple', 'beginner', 'rising'],
  },
  {
    name: 'Synth Lead',
    trackType: 'melody',
    pattern: 'note("c5 ~ eb5 ~ g5 f5 eb5 ~").sound("sawtooth").lpf(3500).gain(0.45).decay(0.15).sustain(0.5)',
    tags: ['lead', 'synth', 'melodic', 'bright'],
  },
  {
    name: 'Ambient Drift',
    trackType: 'melody',
    pattern: 'note("c5 ~ ~ g4 ~ ~ eb5 ~").sound("sine").gain(0.3).delay(0.55).room(0.7)',
    tags: ['ambient', 'atmospheric', 'slow', 'spacious'],
  },
  {
    name: 'Jazz Lick',
    trackType: 'melody',
    pattern: 'note("bb4 c5 d5 f5 ~ eb5 d5 [c5 bb4]").sound("sine").lpf(2500).gain(0.4).room(0.3).delay(0.15)',
    tags: ['jazz', 'smooth', 'bebop', 'swing'],
  },
  {
    name: 'Retro Arp',
    trackType: 'melody',
    pattern: 'note("c4 eb4 g4 bb4 g4 eb4 f4 ab4 c5 ab4 f4 ab4 g4 bb4 d5 bb4").sound("square").lpf(4000).gain(0.35).delay(0.25)',
    tags: ['retro', 'synthwave', 'arpeggio', '80s'],
  },
  {
    name: 'Pluck Staccato',
    trackType: 'melody',
    pattern: 'note("[c5 ~] [e5 ~] [g4 ~] [c5 ~] [d5 ~] [b4 ~] [a4 ~] [g4 ~]").sound("triangle").decay(0.03).sustain(0.05).gain(0.5)',
    tags: ['pluck', 'staccato', 'rhythmic', 'crisp'],
  },
  {
    name: 'Pentatonic Riff',
    trackType: 'melody',
    pattern: 'note("c4 eb4 f4 g4 bb4 g4 f4 eb4").sound("sawtooth").lpf(2000).gain(0.4).decay(0.1).sustain(0.3)',
    tags: ['pentatonic', 'riff', 'rock', 'bluesy'],
  },

  // ===== CHORDS =====
  {
    name: 'Minor 7ths',
    trackType: 'chords',
    pattern: 'note("<[c3,eb3,g3,bb3] [f3,ab3,c4,eb4] [g3,bb3,d4,f4] [c3,eb3,g3,bb3]>").sound("sawtooth").lpf(1800).gain(0.35).room(0.3)',
    tags: ['minor', 'seventh', 'dark', 'moody'],
  },
  {
    name: 'Major Pop',
    trackType: 'chords',
    pattern: 'note("<[c3,e3,g3] [a2,c3,e3] [f3,a3,c4] [g3,b3,d4]>").sound("triangle").gain(0.4)',
    tags: ['major', 'pop', 'bright', 'classic'],
  },
  {
    name: 'Jazz Voicings',
    trackType: 'chords',
    pattern: 'note("<[bb2,d3,f3,a3] [eb3,g3,bb3,d4] [ab2,c3,eb3,g3] [db3,f3,ab3,c4]>").sound("sine").gain(0.35).room(0.4)',
    tags: ['jazz', 'voicings', 'extended', 'ii-V-I'],
  },
  {
    name: 'Ambient Pads',
    trackType: 'chords',
    pattern: 'note("<[c3,eb3,g3] [ab2,c3,eb3] [bb2,d3,f3]>/3").sound("sawtooth").lpf(1200).gain(0.25).room(0.7).delay(0.4)',
    tags: ['pad', 'ambient', 'sustained', 'atmospheric'],
  },
  {
    name: 'House Stabs',
    trackType: 'chords',
    pattern: 'note("<~ [g3,bb3,d4] ~ [g3,bb3,d4], ~ ~ [c3,eb3,g3] ~>").sound("piano").gain(0.5).decay(0.1).sustain(0.2)',
    tags: ['house', 'stabs', 'dance', 'offbeat'],
  },
  {
    name: 'Power Fifths',
    trackType: 'chords',
    pattern: 'note("<[c3,g3,c4] ~ [f3,c4,f4] ~, [ab3,eb4,ab4] ~ [bb3,f4,bb4] ~>/2").sound("sawtooth").lpf(1500).gain(0.5).distortion(0.3)',
    tags: ['power', 'rock', 'heavy', 'driving'],
  },
  {
    name: 'Lo-fi Piano',
    trackType: 'chords',
    pattern: 'note("<[c3,eb3,g3,bb3] ~ [f3,ab3,c4] ~, ~ [ab2,c3,eb3,g3] ~ [g2,bb2,d3]>").sound("piano").gain(0.4).lpf(2000).room(0.4)',
    tags: ['lofi', 'piano', 'jazzy', 'mellow'],
  },
];
