declare module '@strudel/core' {
  export class Cyclist {
    constructor(options: {
      interval: number;
      onTrigger: (hap: any, deadline: number, duration: number, cps: number) => void;
      onSchedule?: () => void;
      getTime: () => number;
    });
    setStarted(started: boolean, cps?: number): void;
    setPattern(pattern: any, autostart?: boolean): void;
  }
  export function stack(...patterns: any[]): any;
  export function cat(...patterns: any[]): any;
  export function silence(): any;
}

declare module '@strudel/mini' {
  export function mini(code: string): any;
}

declare module '@strudel/webaudio' {
  export function initAudioOnFirstClick(): void;
  export function getAudioContext(): AudioContext;
  export function webaudioOutput(hap: any, deadline: number, duration: number, cps: number): void;
  export function registerSynthSounds(): Promise<void>;
  export function registerSound(name: string, handler: (time: number, hapValue: any, currentTime: number) => { node: AudioNode; stop?: (time: number) => void }): void;
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
