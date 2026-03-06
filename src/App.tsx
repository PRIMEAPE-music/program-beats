import React, { useState } from 'react';
import './styles/globals.css';
import { Transport } from './components/Transport';
import { Timeline } from './components/Timeline';
import { Track } from './components/Track';
import { ChatPanel } from './components/ChatPanel';
import { PatternEditor } from './components/PatternEditor';
import { SampleManager } from './components/SampleManager';
import { useProjectStore } from './store/projectStore';
import type { TrackType } from './engine/types';

export const App: React.FC = () => {
  const project = useProjectStore((s) => s.project);
  const selectedClipId = useProjectStore((s) => s.selectedClipId);
  const addTrack = useProjectStore((s) => s.addTrack);
  const [showSampleManager, setShowSampleManager] = useState(false);

  const trackTypes: TrackType[] = ['drums', 'bass', 'melody', 'chords', 'fx', 'custom'];

  const handleAddTrack = (type: TrackType) => {
    const name = type.charAt(0).toUpperCase() + type.slice(1);
    addTrack(name, type);
  };

  return (
    <div className="app-layout">
      <Transport onOpenSamples={() => setShowSampleManager(true)} />

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
        {selectedClipId && <PatternEditor />}
      </div>

      <ChatPanel />

      {showSampleManager && (
        <SampleManager onClose={() => setShowSampleManager(false)} />
      )}
    </div>
  );
};
