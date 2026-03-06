import React, { useState } from 'react';
import { GENRE_TEMPLATES, type GenreTemplate } from '../engine/genreTemplates';
import '../styles/ai-features.css';

interface GenreTemplatePickerProps {
  onClose: () => void;
  onApply: (template: GenreTemplate) => void;
  onApplyFullProject?: (template: GenreTemplate) => void;
}

export const GenreTemplatePicker: React.FC<GenreTemplatePickerProps> = ({
  onClose,
  onApply,
  onApplyFullProject,
}) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [confirmMode, setConfirmMode] = useState<'patterns' | 'full' | null>(null);

  const handleApplyPatterns = () => {
    if (selectedIndex === null) return;
    if (confirmMode !== 'patterns') {
      setConfirmMode('patterns');
      return;
    }
    onApply(GENRE_TEMPLATES[selectedIndex]);
  };

  const handleApplyFullProject = () => {
    if (selectedIndex === null || !onApplyFullProject) return;
    if (confirmMode !== 'full') {
      setConfirmMode('full');
      return;
    }
    onApplyFullProject(GENRE_TEMPLATES[selectedIndex]);
  };

  const selectedTemplate = selectedIndex !== null ? GENRE_TEMPLATES[selectedIndex] : null;

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
                setConfirmMode(null);
              }}
            >
              <div className="genre-card-name">{template.name}</div>
              <div className="genre-card-meta">
                <span>{template.bpm} BPM</span>
                <span>{template.scaleRoot} {template.scaleName}</span>
              </div>
              <div className="genre-card-desc">{template.description}</div>
              {selectedIndex === idx && (
                <div className="genre-card-sections">
                  {template.sections.map((s, i) => (
                    <span key={i} className="genre-section-tag">
                      {s.name} ({s.bars}b)
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="genre-template-actions">
          {confirmMode && (
            <span className="genre-confirm-warning">
              This will replace your current project. Click again to confirm.
            </span>
          )}
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            disabled={selectedIndex === null}
            onClick={handleApplyPatterns}
          >
            {confirmMode === 'patterns' ? 'Confirm Patterns' : 'Patterns Only'}
          </button>
          {onApplyFullProject && (
            <button
              className="btn btn-accent"
              disabled={selectedIndex === null}
              onClick={handleApplyFullProject}
              title={
                selectedTemplate
                  ? `Create full project with ${selectedTemplate.sections.length} sections (${selectedTemplate.sections.reduce((s, sec) => s + sec.bars, 0)} bars)`
                  : 'Select a template first'
              }
            >
              {confirmMode === 'full' ? 'Confirm Full Project' : 'Full Project'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
