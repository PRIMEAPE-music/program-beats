import React, { useState, useCallback } from 'react';
import './styles/globals.css';
import { Transport } from './components/Transport';
import { Timeline } from './components/Timeline';
import { Track } from './components/Track';
import { ChatPanel } from './components/ChatPanel';
import { PatternEditor } from './components/PatternEditor';
import { SampleManager } from './components/SampleManager';
import { ExportDialog } from './components/ExportDialog';
import { useProjectStore } from './store/projectStore';
import { useUndoStore } from './store/undoMiddleware';
import { useAudioEngine } from './hooks/useAudioEngine';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import type { TrackType } from './engine/types';

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
  const [showSampleManager, setShowSampleManager] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
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

    // Find which track and bar this clip is on
    for (const track of project.tracks) {
      for (const [bar, cId] of Object.entries(track.clips)) {
        if (cId === selectedClipId) {
          // Find next empty bar on this track
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

  return (
    <div className="app-layout">
      <Transport onOpenSamples={() => setShowSampleManager(true)} onInitEngine={initEngine} onOpenExport={() => setShowExportDialog(true)} />

      <div className="sidebar">
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
      </div>

      <div className="main-area">
        <Timeline />
        {selectedClipId && <PatternEditor onPreview={previewPattern} onStopPreview={stopPreview} />}
      </div>

      <ChatPanel />

      {showSampleManager && (
        <SampleManager onClose={() => setShowSampleManager(false)} />
      )}

      {showExportDialog && (
        <ExportDialog onClose={() => setShowExportDialog(false)} />
      )}
    </div>
  );
};
