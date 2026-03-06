import React, { useState, useCallback } from 'react';
import './styles/globals.css';
import './styles/production.css';
import './styles/ai-features.css';
import './styles/qol.css';
import { Transport } from './components/Transport';
import { Timeline } from './components/Timeline';
import { Track } from './components/Track';
import { ChatPanel } from './components/ChatPanel';
import { PatternEditor } from './components/PatternEditor';
import { SampleManager } from './components/SampleManager';
import { ExportDialog } from './components/ExportDialog';
import { MidiExportDialog } from './components/MidiExportDialog';
import { ToastContainer } from './components/Toast';
import { BeatIndicator } from './components/BeatIndicator';
import { MasterEffects } from './components/MasterEffects';
import { ScaleSelector } from './components/ScaleSelector';
import { GenreTemplatePicker } from './components/GenreTemplatePicker';
import { SongGenerator } from './components/SongGenerator';
import { MixingSuggestions } from './components/MixingSuggestions';
import { ProjectBrowser } from './components/ProjectBrowser';
import { ResizablePanel } from './components/ResizablePanel';
import { useProjectStore } from './store/projectStore';
import { useUndoStore } from './store/undoMiddleware';
import { useAudioEngine } from './hooks/useAudioEngine';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import type { TrackType } from './engine/types';
import type { GenreTemplate } from './engine/genreTemplates';

export const App: React.FC = () => {
  const project = useProjectStore((s) => s.project);
  const isPlaying = useProjectStore((s) => s.isPlaying);
  const selectedClipId = useProjectStore((s) => s.selectedClipId);
  const addTrack = useProjectStore((s) => s.addTrack);
  const removeClip = useProjectStore((s) => s.removeClip);
  const addClip = useProjectStore((s) => s.addClip);
  const placeClip = useProjectStore((s) => s.placeClip);
  const selectClip = useProjectStore((s) => s.selectClip);
  const selectTrack = useProjectStore((s) => s.selectTrack);
  const setPlaying = useProjectStore((s) => s.setPlaying);
  const saveProject = useProjectStore((s) => s.saveProject);
  const loadProject = useProjectStore((s) => s.loadProject);
  const setProject = useProjectStore((s) => s.setProject);
  const setBpm = useProjectStore((s) => s.setBpm);
  const setScaleConfig = useProjectStore((s) => s.setScaleConfig);
  const newProject = useProjectStore((s) => s.newProject);

  const [showSampleManager, setShowSampleManager] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showMidiExport, setShowMidiExport] = useState(false);
  const [showGenrePicker, setShowGenrePicker] = useState(false);
  const [showSongGenerator, setShowSongGenerator] = useState(false);
  const [showMixingSuggestions, setShowMixingSuggestions] = useState(false);
  const [showProjectBrowser, setShowProjectBrowser] = useState(false);

  const { initEngine, previewPattern, stopPreview } = useAudioEngine();
  const { undo, redo } = useUndoStore();

  // Keyboard shortcut handlers
  const togglePlayStop = useCallback(async () => {
    await initEngine();
    setPlaying(!isPlaying);
  }, [initEngine, isPlaying, setPlaying]);

  const deleteSelectedClip = useCallback(() => {
    if (selectedClipId) {
      removeClip(selectedClipId);
    }
  }, [selectedClipId, removeClip]);

  const duplicateSelectedClip = useCallback(() => {
    if (!selectedClipId) return;
    const clip = project.clips[selectedClipId];
    if (!clip) return;

    for (const track of project.tracks) {
      for (const [bar, cId] of Object.entries(track.clips)) {
        if (cId === selectedClipId) {
          let nextBar = Number(bar) + clip.durationBars;
          while (track.clips[nextBar] !== undefined && nextBar < project.totalBars) {
            nextBar++;
          }
          if (nextBar >= project.totalBars) return;

          const newClip = {
            ...clip,
            id: crypto.randomUUID(),
            name: `${clip.name} (copy)`,
          };
          addClip(newClip);
          placeClip(track.id, nextBar, newClip.id);
          selectClip(newClip.id);
          return;
        }
      }
    }
  }, [selectedClipId, project, addClip, placeClip, selectClip]);

  const deselectAll = useCallback(() => {
    selectClip(null);
    selectTrack(null);
    setShowExportDialog(false);
    setShowMidiExport(false);
    setShowGenrePicker(false);
    setShowSongGenerator(false);
    setShowMixingSuggestions(false);
    setShowProjectBrowser(false);
  }, [selectClip, selectTrack]);

  useKeyboardShortcuts({
    togglePlayStop,
    deleteSelectedClip,
    undo,
    redo,
    duplicateSelectedClip,
    saveProject,
    deselectAll,
  });

  const trackTypes: TrackType[] = ['drums', 'bass', 'melody', 'chords', 'fx', 'custom'];

  const handleAddTrack = (type: TrackType) => {
    const name = type.charAt(0).toUpperCase() + type.slice(1);
    addTrack(name, type);
  };

  const handleApplyGenreTemplate = useCallback((template: GenreTemplate) => {
    newProject();
    setBpm(template.bpm);
    setScaleConfig({ root: template.scaleRoot, scale: template.scaleName });

    // Create tracks and clips from template
    const store = useProjectStore.getState();
    for (const t of template.tracks) {
      const trackType = t.type as TrackType;
      store.addTrack(t.name, trackType);
    }

    // Remove default tracks and use template tracks
    const updatedState = useProjectStore.getState();
    const templateTrackCount = template.tracks.length;
    const allTracks = updatedState.project.tracks;

    // Place clips for each template track
    for (let i = 0; i < templateTrackCount; i++) {
      const trackDef = template.tracks[i];
      const track = allTracks[allTracks.length - templateTrackCount + i];
      if (!track) continue;

      const clip = {
        id: crypto.randomUUID(),
        name: `${trackDef.name} Loop`,
        pattern: trackDef.pattern,
        color: '#e94560',
        durationBars: 4,
      };
      store.addClip(clip);
      store.placeClip(track.id, 0, clip.id);
    }

    setShowGenrePicker(false);
  }, [newProject, setBpm, setScaleConfig]);

  return (
    <div className="app-layout">
      <Transport
        onOpenSamples={() => setShowSampleManager(true)}
        onInitEngine={initEngine}
        onOpenExport={() => setShowExportDialog(true)}
        onOpenMidiExport={() => setShowMidiExport(true)}
        onOpenGenres={() => setShowGenrePicker(true)}
        onOpenSongGenerator={() => setShowSongGenerator(true)}
        onOpenMixingSuggestions={() => setShowMixingSuggestions(true)}
        onOpenProjectBrowser={() => setShowProjectBrowser(true)}
      />

      <ResizablePanel
        direction="horizontal"
        initialSize={220}
        minSize={160}
        maxSize={350}
        side="right"
        storageKey="sidebar-width"
      >
        <div className="sidebar-inner">
          <div className="sidebar-header">
            <h3>Tracks</h3>
          </div>
          <div className="track-list">
            {project.tracks.map((track) => (
              <Track key={track.id} track={track} />
            ))}
          </div>
          <div className="add-track-area">
            <div className="add-track-bar">
              {trackTypes.map((type) => (
                <button
                  key={type}
                  className="btn btn-sm"
                  onClick={() => handleAddTrack(type)}
                  title={`Add ${type} track`}
                >
                  + {type}
                </button>
              ))}
            </div>
          </div>
          <MasterEffects />
          <ScaleSelector />
        </div>
      </ResizablePanel>

      <div className="main-area">
        <Timeline />
        {selectedClipId && <PatternEditor onPreview={previewPattern} onStopPreview={stopPreview} />}
      </div>

      <ResizablePanel
        direction="horizontal"
        initialSize={300}
        minSize={200}
        maxSize={500}
        side="left"
        storageKey="chat-width"
      >
        <ChatPanel />
      </ResizablePanel>

      <ToastContainer />

      {showSampleManager && (
        <SampleManager onClose={() => setShowSampleManager(false)} />
      )}
      {showExportDialog && (
        <ExportDialog onClose={() => setShowExportDialog(false)} />
      )}
      {showMidiExport && (
        <MidiExportDialog onClose={() => setShowMidiExport(false)} />
      )}
      {showGenrePicker && (
        <GenreTemplatePicker
          onClose={() => setShowGenrePicker(false)}
          onApply={handleApplyGenreTemplate}
        />
      )}
      {showSongGenerator && (
        <SongGenerator onClose={() => setShowSongGenerator(false)} />
      )}
      {showMixingSuggestions && (
        <MixingSuggestions onClose={() => setShowMixingSuggestions(false)} />
      )}
      {showProjectBrowser && (
        <ProjectBrowser
          onClose={() => setShowProjectBrowser(false)}
          onLoadProject={(id) => {
            loadProject(id);
            setShowProjectBrowser(false);
          }}
        />
      )}
    </div>
  );
};
