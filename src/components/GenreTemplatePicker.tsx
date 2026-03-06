import React, { useState } from 'react';
import { GENRE_TEMPLATES, type GenreTemplate } from '../engine/genreTemplates';
import '../styles/ai-features.css';

interface GenreTemplatePickerProps {
  onClose: () => void;
  onApply: (template: GenreTemplate) => void;
}

export const GenreTemplatePicker: React.FC<GenreTemplatePickerProps> = ({ onClose, onApply }) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleApply = () => {
    if (selectedIndex === null) return;
    if (!showConfirm) {
      setShowConfirm(true);
      return;
    }
    onApply(GENRE_TEMPLATES[selectedIndex]);
  };

  return (
    <div className="genre-template-overlay" onClick={onClose}>
      <div className="genre-template-modal" onClick={(e) => e.stopPropagation()}>
        <h2>Genre Templates</h2>
        <p className="modal-subtitle">
          Select a genre to set up tracks, patterns, BPM, and song sections instantly.
        </p>

        <div className="genre-template-grid">
          {GENRE_TEMPLATES.map((template, idx) => (
            <div
              key={template.name}
              className={`genre-card ${selectedIndex === idx ? 'selected' : ''}`}
              onClick={() => {
                setSelectedIndex(idx);
                setShowConfirm(false);
              }}
            >
              <div className="genre-card-name">{template.name}</div>
              <div className="genre-card-meta">
                <span>{template.bpm} BPM</span>
                <span>{template.scaleRoot} {template.scaleName}</span>
              </div>
              <div className="genre-card-desc">{template.description}</div>
            </div>
          ))}
        </div>

        <div className="genre-template-actions">
          {showConfirm && (
            <span className="genre-confirm-warning">
              This will replace your current project. Click Apply again to confirm.
            </span>
          )}
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            disabled={selectedIndex === null}
            onClick={handleApply}
          >
            {showConfirm ? 'Confirm Apply' : 'Apply'}
          </button>
        </div>
      </div>
    </div>
  );
};
