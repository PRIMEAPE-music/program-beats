import React, { useState, useMemo } from 'react';
import type { TrackType } from '../engine/types';
import { PRESETS } from '../engine/presets';

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
            className="preset-item"
            onClick={() => onSelect(preset.pattern, preset.name)}
          >
            <div className="preset-item-name">{preset.name}</div>
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
