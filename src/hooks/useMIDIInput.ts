import { useState, useEffect, useRef, useCallback } from 'react';
import { strudelEngine } from '../engine/StrudelEngine';

const NOTE_NAMES = ['c', 'cs', 'd', 'ds', 'e', 'f', 'fs', 'g', 'gs', 'a', 'as', 'b'];

// MIDI note number to Strudel note name (e.g., 60 = c4)
function midiNoteToName(note: number): string {
  const octave = Math.floor(note / 12) - 1;
  const name = NOTE_NAMES[note % 12];
  return `${name}${octave}`;
}

// GM drum map (channel 10) — common mappings
const DRUM_MAP: Record<number, string> = {
  36: 'bd',   // Bass Drum 1
  35: 'bd',   // Acoustic Bass Drum
  38: 'sd',   // Acoustic Snare
  40: 'sd',   // Electric Snare
  42: 'hh',   // Closed Hi-Hat
  44: 'hh',   // Pedal Hi-Hat
  46: 'oh',   // Open Hi-Hat
  39: 'cp',   // Hand Clap
  37: 'rim',  // Side Stick / Rimshot
  49: 'cr',   // Crash Cymbal 1
  57: 'cr',   // Crash Cymbal 2
  51: 'rd',   // Ride Cymbal 1
  59: 'rd',   // Ride Cymbal 2
  56: 'cb',   // Cowbell
  45: 'tom',  // Low Tom
  47: 'tom',  // Low-Mid Tom
  48: 'tom',  // Hi-Mid Tom
  50: 'tom',  // High Tom
};

export interface MIDIInputState {
  midiAvailable: boolean;
  connectedDevices: string[];
  lastNote: string | null;
}

export function useMIDIInput(): MIDIInputState {
  const [midiAvailable, setMidiAvailable] = useState(false);
  const [connectedDevices, setConnectedDevices] = useState<string[]>([]);
  const [lastNote, setLastNote] = useState<string | null>(null);
  const midiAccessRef = useRef<MIDIAccess | null>(null);

  const handleMIDIMessage = useCallback((event: MIDIMessageEvent) => {
    const data = event.data;
    if (!data || data.length < 3) return;

    const status = data[0];
    const note = data[1];
    const velocity = data[2];

    // Extract channel (lower nibble of status byte)
    const channel = (status & 0x0f) + 1; // 1-16
    const messageType = status & 0xf0;

    // Note On (0x90) with velocity > 0
    if (messageType === 0x90 && velocity > 0) {
      if (!strudelEngine.isInitialized()) return;

      if (channel === 10) {
        // Drum channel
        const drumSound = DRUM_MAP[note];
        if (drumSound) {
          const noteName = drumSound;
          setLastNote(noteName);
          strudelEngine.previewPattern(`s("${drumSound}")`);
        }
      } else {
        // Melodic channel
        const noteName = midiNoteToName(note);
        setLastNote(noteName);
        strudelEngine.previewPattern(`note("${noteName}").sound("piano")`);
      }
    }
  }, []);

  const updateDeviceList = useCallback(() => {
    if (!midiAccessRef.current) return;
    const devices: string[] = [];
    midiAccessRef.current.inputs.forEach((input) => {
      if (input.name) devices.push(input.name);
    });
    setConnectedDevices(devices);
  }, []);

  const attachListeners = useCallback(() => {
    if (!midiAccessRef.current) return;
    midiAccessRef.current.inputs.forEach((input) => {
      input.onmidimessage = handleMIDIMessage;
    });
    updateDeviceList();
  }, [handleMIDIMessage, updateDeviceList]);

  useEffect(() => {
    if (!navigator.requestMIDIAccess) {
      setMidiAvailable(false);
      return;
    }

    let cancelled = false;

    navigator.requestMIDIAccess({ sysex: false })
      .then((access) => {
        if (cancelled) return;
        midiAccessRef.current = access;
        setMidiAvailable(true);

        // Attach to existing inputs
        attachListeners();

        // Listen for device connect/disconnect
        access.onstatechange = () => {
          attachListeners();
        };
      })
      .catch((err) => {
        console.warn('[useMIDIInput] MIDI access denied or unavailable:', err);
        setMidiAvailable(false);
      });

    return () => {
      cancelled = true;
      if (midiAccessRef.current) {
        midiAccessRef.current.inputs.forEach((input) => {
          input.onmidimessage = null;
        });
      }
    };
  }, [attachListeners]);

  return { midiAvailable, connectedDevices, lastNote };
}
