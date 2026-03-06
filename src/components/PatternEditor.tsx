import React, { useState, useEffect, useCallback } from 'react';
import { useProjectStore } from '../store/projectStore';

interface PatternEditorProps {
  onPreview: (pattern: string) => void;
  onStopPreview: () => void;
  onOpenGridEditor?: () => void;
}

export const PatternEditor: React.FC<PatternEditorProps> = ({ onPreview, onStopPreview, onOpenGridEditor }) => {
  const project = useProjectStore((s) => s.project);
  const selectedClipId = useProjectStore((s) => s.selectedClipId);
  const updateClip = useProjectStore((s) => s.updateClip);
  const selectClip = useProjectStore((s) => s.selectClip);

  const clip = selectedClipId ? project.clips[selectedClipId] : null;

  const [name, setName] = useState('');
  const [pattern, setPattern] = useState('');
  const [durationBars, setDurationBars] = useState(1);

  // Sync local state when clip selection changes
  useEffect(() => {
    if (clip) {
      setName(clip.name);
      setPattern(clip.pattern);
      setDurationBars(clip.durationBars);
    }
  }, [clip]);

  // Find which track and bar this clip is placed in
  const placement = (() => {
    if (!selectedClipId) return null;
    for (const track of project.tracks) {
      for (const [bar, cId] of Object.entries(track.clips)) {
        if (cId === selectedClipId) {
          return { trackName: track.name, trackType: track.type, bar: Number(bar) };
        }
      }
    }
    return null;
  })();

  const handleSave = useCallback(() => {
    if (!selectedClipId) return;
    updateClip(selectedClipId, {
      name,
      pattern,
      durationBars: Math.max(1, durationBars),
    });
  }, [selectedClipId, name, pattern, durationBars, updateClip]);

  const handleClose = useCallback(() => {
    selectClip(null);
  }, [selectClip]);

  const [isPreviewing, setIsPreviewing] = useState(false);

  const handlePreview = useCallback(() => {
    if (isPreviewing) {
      onStopPreview();
      setIsPreviewing(false);
    } else if (pattern.trim()) {
      onPreview(pattern);
      setIsPreviewing(true);
    }
  }, [pattern, isPreviewing, onPreview, onStopPreview]);

  if (!clip) return null;

  return (
    <div className="pattern-editor">
      <div className="pattern-editor-header">
        <h3>Pattern Editor</h3>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {placement && (
            <span className="pattern-editor-info">
              {placement.trackName} | Bar {placement.bar + 1}
            </span>
          )}
          <button className="btn btn-sm" onClick={handleClose}>
            Close
          </button>
        </div>
      </div>

      <div className="pattern-editor-fields">
        <label>
          Name
          <input
            className="name-input"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Clip name"
          />
        </label>
        <label>
          Bars
          <input
            className="duration-input"
            type="number"
            min={1}
            max={16}
            value={durationBars}
            onChange={(e) => setDurationBars(parseInt(e.target.value, 10) || 1)}
          />
        </label>
      </div>

      <textarea
        className="pattern-textarea"
        value={pattern}
        onChange={(e) => setPattern(e.target.value)}
        placeholder={'Enter Strudel pattern code...\nExample: sound("bd sd hh sd")'}
        spellCheck={false}
      />

      <div className="pattern-editor-actions">
        {onOpenGridEditor && (
          <button className="btn btn-sm" onClick={onOpenGridEditor} title="Open step sequencer grid editor">
            Grid Editor
          </button>
        )}
        <button className="btn btn-sm" onClick={handlePreview}>
          {isPreviewing ? 'Stop' : 'Preview'}
        </button>
        <button className="btn btn-sm btn-accent" onClick={handleSave}>
          Save
        </button>
      </div>
    </div>
  );
};
