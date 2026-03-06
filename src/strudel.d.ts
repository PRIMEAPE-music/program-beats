declare module '@strudel/core' {
  export class Cyclist {
    constructor(options: any);
    started: boolean;
    cps: number;
    pattern: any;
    setStarted(started: boolean): void;
    start(): Promise<void>;
    stop(): void;
    pause(): void;
    setPattern(pat: any, autostart?: boolean): Promise<void>;
    setCps(cps?: number): void;
    now(): number;
  }
  export function repl(options: any): any;
  export function stack(...patterns: any[]): any;
  export function cat(...patterns: any[]): any;
  export function silence(): any;
  export function evalScope(...modules: any[]): Promise<any>;
  export class Pattern {
    queryArc(begin: number, end: number, options?: any): any[];
  }
  export const s: any;
  export const sound: any;
  export const note: any;
}

declare module '@strudel/mini' {
  export function mini(...strings: string[]): any;
  export function miniAllStrings(): void;
  export function m(str: string, offset?: number): any;
  export function h(str: string): any;
  export function minify(thing: any): any;
}

declare module '@strudel/webaudio' {
  export function webaudioOutput(hap: any, deadline: number, duration: number, cps: number, t?: number): void;
  export function webaudioRepl(options?: any): any;
  export function renderPatternAudio(...args: any[]): Promise<void>;
  export function getAudioContext(): AudioContext;
  export function setAudioContext(ctx: AudioContext | null): void;
  export function initAudio(options?: any): Promise<void>;
  export function initAudioOnFirstClick(options?: any): Promise<void>;
  export function registerSynthSounds(): void;
  export function registerSound(key: string, onTrigger: (time: number, hapValue: any, currentTime: number) => any, data?: any): void;
  export function samples(sampleMap: string | Record<string, any>, baseUrl?: string, options?: any): Promise<void>;
}

declare module '@strudel/tonal' {}

declare module '@strudel/soundfonts' {}

declare module 'midi-writer-js' {
  export class Track {
    addEvent(event: any | any[]): this;
    setTempo(bpm: number): this;
    addTrackName(name: string): this;
    channel: number;
  }
  export class NoteEvent {
    constructor(options: {
      pitch: string | string[] | number | number[];
      duration: string;
      velocity?: number;
      startTick?: number;
      channel?: number;
      wait?: string;
    });
  }
  export class Writer {
    constructor(tracks: Track | Track[]);
    dataUri(): string;
    buildFile(): Uint8Array;
  }
}
