import React, { useCallback, useState } from 'react';
import { useProjectStore } from '../store/projectStore';
import { useUndoStore } from '../store/undoMiddleware';
import { useToastStore } from '../hooks/useToast';
import { BeatIndicator } from './BeatIndicator';
import { TapTempo } from './TapTempo';
import { GENRE_TEMPLATES } from '../engine/genreTemplates';
import type { TrackType } from '../engine/types';

interface TransportProps {
  onOpenSamples: () => void;
  onInitEngine: () => Promise<void>;
  onOpenExport: () => void;
  onOpenMidiExport: () => void;
  onOpenGenres: () => void;
  onOpenSongGenerator: () => void;
  onOpenMixingSuggestions: () => void;
  onOpenProjectBrowser: () => void;
  midiConnected?: boolean;
  midiDevices?: string[];
}

export const Transport: React.FC<TransportProps> = ({
  onOpenSamples,
  onInitEngine,
  onOpenExport,
  onOpenMidiExport,
  onOpenGenres,
  onOpenSongGenerator,
  onOpenMixingSuggestions,
  onOpenProjectBrowser,
  midiConnected = false,
  midiDevices = [],
}) => {
  const project = useProjectStore((s) => s.project);
  const isPlaying = useProjectStore((s) => s.isPlaying);
  const currentBar = useProjectStore((s) => s.currentBar);
  const setPlaying = useProjectStore((s) => s.setPlaying);
  const setBpm = useProjectStore((s) => s.setBpm);
  const setProject = useProjectStore((s) => s.setProject);
  const newProject = useProjectStore((s) => s.newProject);
  const saveProject = useProjectStore((s) => s.saveProject);
  const addClip = useProjectStore((s) => s.addClip);
  const placeClip = useProjectStore((s) => s.placeClip);
  const metronomeEnabled = useProjectStore((s) => s.metronomeEnabled);
  const toggleMetronome = useProjectStore((s) => s.toggleMetronome);
  const showVisualizer = useProjectStore((s) => s.showVisualizer);
  const toggleVisualizer = useProjectStore((s) => s.toggleVisualizer);
  const showMixer = useProjectStore((s) => s.showMixer);
  const toggleMixer = useProjectStore((s) => s.toggleMixer);
  const togglePatternLibrary = useProjectStore((s) => s.togglePatternLibrary);
  const showDrumPad = useProjectStore((s) => s.showDrumPad);
  const toggleDrumPad = useProjectStore((s) => s.toggleDrumPad);
  const addToast = useToastStore((s) => s.addToast);
  const { undo, redo, canUndo, canRedo } = useUndoStore();
  const [isSurprising, setIsSurprising] = useState(false);

  const handlePlayStop = useCallback(async () => {
    await onInitEngine();
    setPlaying(!isPlaying);
  }, [isPlaying, setPlaying, onInitEngine]);

  const handleBpmChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = parseInt(e.target.value, 10);
      if (!isNaN(val) && val > 0 && val <= 300) {
        setBpm(val);
      }
    },
    [setBpm]
  );

  const handleNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setProject({ ...project, name: e.target.value });
    },
    [project, setProject]
  );

  const handleNewProject = useCallback(() => {
    if (window.confirm('Start a new project? Unsaved changes will be lost.')) {
      newProject();
    }
  }, [newProject]);

  const handleSurpriseMe = useCallback(async () => {
    if (isSurprising) return;
    setIsSurprising(true);

    const randomGenre = GENRE_TEMPLATES[Math.floor(Math.random() * GENRE_TEMPLATES.length)];

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Generate a ${randomGenre.name} beat at ${randomGenre.bpm} BPM in ${randomGenre.scaleRoot} ${randomGenre.scaleName}. Include patterns for drums, bass, melody, and chords. Make it sound authentic and interesting.`,
          context: {
            bpm: randomGenre.bpm,
            genre: randomGenre.name,
          },
        }),
      });

      if (!response.ok) throw new Error(`Server error: ${response.status}`);

      const data = await response.json();
      const patterns = data.patterns || [];

      for (const pattern of patterns) {
        const trackType = pattern.trackType as TrackType;
        const matchingTrack = project.tracks.find((t) => t.type === trackType) || project.tracks[0];
        if (!matchingTrack) continue;

        let nextBar = 0;
        while (matchingTrack.clips[nextBar] !== undefined && nextBar < project.totalBars) {
          nextBar++;
        }
        if (nextBar >= project.totalBars) nextBar = 0;

        const newClip = {
          id: crypto.randomUUID(),
          name: pattern.description?.slice(0, 30) || `${trackType} pattern`,
          pattern: pattern.pattern,
          color: '#e94560',
          durationBars: 1,
        };

        addClip(newClip);
        placeClip(matchingTrack.id, nextBar, newClip.id);
      }

      addToast(`Surprise! Generated ${randomGenre.name} patterns (${patterns.length} tracks)`, 'success');
    } catch (err) {
      addToast(
        `Surprise failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
        'error'
      );
    } finally {
      setIsSurprising(false);
    }
  }, [isSurprising, project, addClip, placeClip, addToast]);

  return (
    <div className="transport-bar">
      <div className="transport-left">
        <button
          className="btn btn-play btn-icon"
          onClick={handlePlayStop}
          title={isPlaying ? 'Stop' : 'Play'}
        >
          {isPlaying ? '\u23F9' : '\u25B6'}
        </button>
        <BeatIndicator bpm={project.bpm} isPlaying={isPlaying} />
        <div className="bar-display">
          Bar {currentBar + 1}
        </div>
      </div>

      <div className="transport-center">
        <input
          className="project-name"
          type="text"
          value={project.name}
          onChange={handleNameChange}
          title="Project name"
        />
        <div className="bpm-group">
          <label htmlFor="bpm-input">BPM</label>
          <input
            id="bpm-input"
            className="bpm-input"
            type="number"
            min={20}
            max={300}
            value={project.bpm}
            onChange={handleBpmChange}
          />
        </div>
        <TapTempo />
        <button
          className={`btn btn-sm btn-metronome${metronomeEnabled ? ' active' : ''}`}
          onClick={toggleMetronome}
          title={metronomeEnabled ? 'Disable Metronome' : 'Enable Metronome'}
        >
          Metro
        </button>
        <button
          className={`btn btn-sm btn-visualizer-toggle${showVisualizer ? ' active' : ''}`}
          onClick={toggleVisualizer}
          title={showVisualizer ? 'Hide Visualizer' : 'Show Visualizer'}
        >
          Viz
        </button>
        <button
          className={`btn btn-sm btn-mixer-toggle${showMixer ? ' active' : ''}`}
          onClick={toggleMixer}
          title={showMixer ? 'Hide Mixer' : 'Show Mixer'}
        >
          Mixer
        </button>
        <button
          className={`btn btn-sm btn-pads-toggle${showDrumPad ? ' active' : ''}`}
          onClick={toggleDrumPad}
          title={showDrumPad ? 'Hide Drum Pads' : 'Show Drum Pads (A/S/D/F/G/H/J/K)'}
        >
          Pads
        </button>
        <div
          className={`midi-indicator${midiConnected ? ' connected' : ''}`}
          title={midiConnected ? `MIDI: ${midiDevices.join(', ')}` : 'No MIDI device connected'}
        />
      </div>

      <div className="transport-right">
        <button
          className="btn btn-sm btn-undo"
          onClick={undo}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
        >
          Undo
        </button>
        <button
          className="btn btn-sm btn-redo"
          onClick={redo}
          disabled={!canRedo}
          title="Redo (Ctrl+Shift+Z)"
        >
          Redo
        </button>
        <button
          className="btn btn-sm btn-surprise"
          onClick={handleSurpriseMe}
          disabled={isSurprising}
          title="Generate random AI patterns from a random genre"
        >
          {isSurprising ? 'Working...' : 'Surprise Me'}
        </button>
        <button className="btn btn-sm btn-accent" onClick={onOpenSongGenerator} title="AI Generate Full Song">
          AI Song
        </button>
        <button className="btn btn-sm" onClick={onOpenGenres} title="Genre Templates">
          Genres
        </button>
        <button className="btn btn-sm" onClick={togglePatternLibrary} title="Pattern Library">
          Library
        </button>
        <button className="btn btn-sm" onClick={onOpenMixingSuggestions} title="AI Mixing Suggestions">
          Mix AI
        </button>
        <button className="btn btn-sm" onClick={onOpenExport} title="Export WAV">
          WAV
        </button>
        <button className="btn btn-sm" onClick={onOpenMidiExport} title="Export MIDI">
          MIDI
        </button>
        <button className="btn btn-sm" onClick={onOpenSamples}>
          Samples
        </button>
        <button className="btn btn-sm" onClick={onOpenProjectBrowser} title="Browse Projects">
          Projects
        </button>
        <button className="btn btn-sm" onClick={saveProject} title="Save (Ctrl+S)">
          Save
        </button>
        <button className="btn btn-sm" onClick={handleNewProject}>
          New
        </button>
      </div>
    </div>
  );
};
