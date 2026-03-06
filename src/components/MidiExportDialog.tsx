import React, { useState, useMemo } from 'react';
import { useProjectStore } from '../store/projectStore';
import { analyzeTracksForExport, downloadMidi } from '../engine/MidiExporter';

export interface MidiExportDialogProps {
  onClose: () => void;
}

export const MidiExportDialog: React.FC<MidiExportDialogProps> = ({ onClose }) => {
  const project = useProjectStore((s) => s.project);
  const trackInfo = useMemo(() => analyzeTracksForExport(project), [project]);

  const [includedIds, setIncludedIds] = useState<Set<string>>(() => {
    const set = new Set<string>();
    for (const info of trackInfo) {
      if (info.exportable) set.add(info.track.id);
    }
    return set;
  });

  const toggleTrack = (id: string) => {
    setIncludedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleExport = () => {
    downloadMidi(project, undefined, includedIds);
    onClose();
  };

  const exportableCount = trackInfo.filter((t) => t.exportable).length;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="midi-export-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Export MIDI</h2>
          <button className="btn-icon" onClick={onClose} title="Close">
            &times;
          </button>
        </div>

        <div className="midi-export-info">
          <div className="midi-export-info-row">
            <span>Project:</span>
            <strong>{project.name}</strong>
          </div>
          <div className="midi-export-info-row">
            <span>BPM:</span>
            <strong>{project.bpm}</strong>
          </div>
          <div className="midi-export-info-row">
            <span>Tracks:</span>
            <strong>{project.tracks.length}</strong>
          </div>
          <div className="midi-export-info-row">
            <span>Total Bars:</span>
            <strong>{project.totalBars}</strong>
          </div>
        </div>

        <div className="midi-track-list">
          <h3>Tracks ({exportableCount} exportable)</h3>
          {trackInfo.map(({ track, exportable, reason }) => (
            <label
              key={track.id}
              className={`midi-track-item ${!exportable ? 'midi-track-item-disabled' : ''}`}
            >
              <input
                type="checkbox"
                checked={includedIds.has(track.id)}
                onChange={() => toggleTrack(track.id)}
                disabled={!exportable}
              />
              <span className="midi-track-name">{track.name}</span>
              <span className="midi-track-type">{track.type}</span>
              {!exportable && (
                <span className="midi-track-reason">{reason}</span>
              )}
            </label>
          ))}
        </div>

        <div className="modal-actions">
          <button className="btn" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleExport}
            disabled={includedIds.size === 0}
          >
            Export MIDI
          </button>
        </div>
      </div>
    </div>
  );
};
