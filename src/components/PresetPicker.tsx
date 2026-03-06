import React, { useState, useCallback, useMemo } from 'react';
import type { TrackType } from '../engine/types';
import { PRESETS } from '../engine/presets';
import { strudelEngine } from '../engine/StrudelEngine';

interface PresetPickerProps {
  trackType: TrackType;
  onSelect: (pattern: string, name: string) => void;
  onClose: () => void;
}

export const PresetPicker: React.FC<PresetPickerProps> = ({
  trackType,
  onSelect,
  onClose,
}) => {
  const [search, setSearch] = useState('');
  const [previewingPattern, setPreviewingPattern] = useState<string | null>(null);

  const handlePreviewToggle = useCallback(async (patternCode: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (previewingPattern === patternCode) {
      strudelEngine.stop();
      setPreviewingPattern(null);
    } else {
      strudelEngine.stop();
      await strudelEngine.previewPattern(patternCode);
      setPreviewingPattern(patternCode);
    }
  }, [previewingPattern]);

  const filtered = useMemo(() => {
    const byType = PRESETS.filter((p) => p.trackType === trackType);
    if (!search.trim()) return byType;
    const q = search.toLowerCase();
    return byType.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q))
    );
  }, [trackType, search]);

  return (
    <div className="preset-picker" onClick={(e) => e.stopPropagation()}>
      <div className="preset-picker-header">
        <span className="preset-picker-title">
          Presets: {trackType}
        </span>
        <button className="btn btn-sm" onClick={onClose}>
          X
        </button>
      </div>
      <input
        className="preset-search"
        type="text"
        placeholder="Search by name or tag..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        autoFocus
      />
      <div className="preset-list">
        {filtered.length === 0 && (
          <div className="preset-empty">No presets found</div>
        )}
        {filtered.map((preset) => (
          <div
            key={preset.name}
            className={`preset-item ${previewingPattern === preset.pattern ? 'previewing' : ''}`}
            onClick={() => onSelect(preset.pattern, preset.name)}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div className="preset-item-name">{preset.name}</div>
              <button
                className={`preview-btn ${previewingPattern === preset.pattern ? 'active' : ''}`}
                onClick={(e) => handlePreviewToggle(preset.pattern, e)}
                title={previewingPattern === preset.pattern ? 'Stop preview' : 'Preview preset'}
              >
                {previewingPattern === preset.pattern ? '\u25A0' : '\u25B6'}
              </button>
            </div>
            <div className="preset-item-tags">
              {preset.tags.map((t) => (
                <span key={t} className="preset-tag">
                  {t}
                </span>
              ))}
            </div>
            <div className="preset-item-pattern">{preset.pattern}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
