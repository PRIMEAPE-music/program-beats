import React, { useState, useEffect, useCallback } from 'react';
import { patternLibrary, type SavedPattern } from '../engine/PatternLibrary';
import { useProjectStore } from '../store/projectStore';
import { useToastStore } from '../hooks/useToast';
import type { TrackType } from '../engine/types';
import { TRACK_COLORS } from '../engine/types';

interface PatternLibraryProps {
  onClose: () => void;
  onPreview: (pattern: string) => void;
  onStopPreview: () => void;
}

const TRACK_TYPES: TrackType[] = ['drums', 'bass', 'melody', 'chords', 'fx'];

export const PatternLibrary: React.FC<PatternLibraryProps> = ({
  onClose,
  onPreview,
  onStopPreview,
}) => {
  const [patterns, setPatterns] = useState<SavedPattern[]>([]);
  const [activeTab, setActiveTab] = useState<TrackType | 'all'>('all');
  const [search, setSearch] = useState('');
  const [initialized, setInitialized] = useState(false);
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  const [saveName, setSaveName] = useState('');
  const [saveTags, setSaveTags] = useState('');
  const [showSaveForm, setShowSaveForm] = useState(false);

  const project = useProjectStore((s) => s.project);
  const selectedClipId = useProjectStore((s) => s.selectedClipId);
  const selectedTrackId = useProjectStore((s) => s.selectedTrackId);
  const addClip = useProjectStore((s) => s.addClip);
  const placeClip = useProjectStore((s) => s.placeClip);
  const addToast = useToastStore((s) => s.addToast);

  const refreshPatterns = useCallback(() => {
    setPatterns(patternLibrary.getAllPatterns());
  }, []);

  useEffect(() => {
    patternLibrary.init().then(() => {
      setInitialized(true);
      refreshPatterns();
    });
  }, [refreshPatterns]);

  const selectedClip = selectedClipId ? project.clips[selectedClipId] : null;
  const selectedTrack = selectedTrackId
    ? project.tracks.find((t) => t.id === selectedTrackId)
    : null;

  const filteredPatterns = patterns.filter((p) => {
    if (activeTab !== 'all' && p.trackType !== activeTab) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchesName = p.name.toLowerCase().includes(q);
      const matchesTags = p.tags.some((t) => t.toLowerCase().includes(q));
      if (!matchesName && !matchesTags) return false;
    }
    return true;
  });

  // Group by track type
  const grouped = new Map<TrackType, SavedPattern[]>();
  for (const p of filteredPatterns) {
    const list = grouped.get(p.trackType) || [];
    list.push(p);
    grouped.set(p.trackType, list);
  }

  const handleSaveCurrent = useCallback(async () => {
    if (!selectedClip) {
      addToast('Select a clip first to save its pattern', 'error');
      return;
    }
    if (!saveName.trim()) {
      addToast('Enter a name for the pattern', 'error');
      return;
    }

    const trackType = selectedTrack?.type || 'custom';
    const tags = saveTags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    await patternLibrary.savePattern(
      saveName.trim(),
      selectedClip.pattern,
      trackType as TrackType,
      tags,
    );
    refreshPatterns();
    setSaveName('');
    setSaveTags('');
    setShowSaveForm(false);
    addToast(`Saved "${saveName.trim()}" to library`, 'success');
  }, [selectedClip, selectedTrack, saveName, saveTags, refreshPatterns, addToast]);

  const handleDelete = useCallback(
    async (id: string, name: string) => {
      await patternLibrary.deletePattern(id);
      refreshPatterns();
      addToast(`Deleted "${name}" from library`, 'info');
    },
    [refreshPatterns, addToast],
  );

  const handlePreview = useCallback(
    (id: string, pattern: string) => {
      if (previewingId === id) {
        onStopPreview();
        setPreviewingId(null);
      } else {
        onPreview(pattern);
        setPreviewingId(id);
      }
    },
    [previewingId, onPreview, onStopPreview],
  );

  const handleApply = useCallback(
    (pattern: SavedPattern) => {
      // Find a track of matching type, or use selected track
      const targetTrack =
        selectedTrack?.type === pattern.trackType
          ? selectedTrack
          : project.tracks.find((t) => t.type === pattern.trackType) ||
            project.tracks[0];

      if (!targetTrack) {
        addToast('No track available to apply pattern', 'error');
        return;
      }

      // Find first empty bar
      let bar = 0;
      while (targetTrack.clips[bar] !== undefined && bar < project.totalBars) {
        bar++;
      }
      if (bar >= project.totalBars) bar = 0;

      const newClip = {
        id: crypto.randomUUID(),
        name: pattern.name,
        pattern: pattern.pattern,
        color: TRACK_COLORS[pattern.trackType] || '#e94560',
        durationBars: 1,
      };

      addClip(newClip);
      placeClip(targetTrack.id, bar, newClip.id);
      addToast(`Applied "${pattern.name}" to ${targetTrack.name}`, 'success');
    },
    [selectedTrack, project, addClip, placeClip, addToast],
  );

  if (!initialized) {
    return (
      <div className="pattern-library-overlay" onClick={onClose}>
        <div className="pattern-library-modal" onClick={(e) => e.stopPropagation()}>
          <p style={{ color: 'var(--text-dim)', padding: 24 }}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pattern-library-overlay" onClick={onClose}>
      <div className="pattern-library-modal" onClick={(e) => e.stopPropagation()}>
        <div className="pattern-library-header">
          <h2>Pattern Library</h2>
          <button className="btn btn-sm" onClick={onClose}>
            Close
          </button>
        </div>

        {/* Save Current Form */}
        <div className="pattern-library-save-area">
          {!showSaveForm ? (
            <button
              className="btn btn-sm btn-accent"
              onClick={() => setShowSaveForm(true)}
              disabled={!selectedClip}
              title={selectedClip ? 'Save current clip pattern' : 'Select a clip first'}
            >
              Save Current Pattern
            </button>
          ) : (
            <div className="pattern-library-save-form">
              <div className="save-form-row">
                <input
                  type="text"
                  className="pattern-library-input"
                  placeholder="Pattern name..."
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveCurrent();
                    if (e.key === 'Escape') setShowSaveForm(false);
                  }}
                />
                <input
                  type="text"
                  className="pattern-library-input"
                  placeholder="Tags (comma-separated)..."
                  value={saveTags}
                  onChange={(e) => setSaveTags(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveCurrent();
                    if (e.key === 'Escape') setShowSaveForm(false);
                  }}
                />
              </div>
              {selectedClip && (
                <div className="save-form-preview">
                  {selectedClip.pattern.slice(0, 80)}
                  {selectedClip.pattern.length > 80 ? '...' : ''}
                </div>
              )}
              <div className="save-form-actions">
                <button className="btn btn-sm" onClick={() => setShowSaveForm(false)}>
                  Cancel
                </button>
                <button className="btn btn-sm btn-primary" onClick={handleSaveCurrent}>
                  Save
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Search & Filter */}
        <div className="pattern-library-controls">
          <input
            type="text"
            className="pattern-library-search"
            placeholder="Search by name or tags..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="pattern-library-tabs">
            <button
              className={`pattern-tab ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => setActiveTab('all')}
            >
              All
            </button>
            {TRACK_TYPES.map((type) => (
              <button
                key={type}
                className={`pattern-tab ${activeTab === type ? 'active' : ''}`}
                onClick={() => setActiveTab(type)}
                style={
                  activeTab === type
                    ? { borderColor: TRACK_COLORS[type], color: TRACK_COLORS[type] }
                    : {}
                }
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Pattern List */}
        <div className="pattern-library-list">
          {filteredPatterns.length === 0 ? (
            <div className="pattern-library-empty">
              {patterns.length === 0
                ? 'No saved patterns yet. Select a clip and click "Save Current Pattern" to get started.'
                : 'No patterns match your search.'}
            </div>
          ) : activeTab === 'all' ? (
            // Grouped view
            Array.from(grouped.entries()).map(([type, items]) => (
              <div key={type} className="pattern-group">
                <div
                  className="pattern-group-header"
                  style={{ borderLeftColor: TRACK_COLORS[type] }}
                >
                  {type.toUpperCase()} ({items.length})
                </div>
                {items.map((p) => (
                  <PatternCard
                    key={p.id}
                    pattern={p}
                    isPreviewing={previewingId === p.id}
                    onPreview={() => handlePreview(p.id, p.pattern)}
                    onApply={() => handleApply(p)}
                    onDelete={() => handleDelete(p.id, p.name)}
                  />
                ))}
              </div>
            ))
          ) : (
            filteredPatterns.map((p) => (
              <PatternCard
                key={p.id}
                pattern={p}
                isPreviewing={previewingId === p.id}
                onPreview={() => handlePreview(p.id, p.pattern)}
                onApply={() => handleApply(p)}
                onDelete={() => handleDelete(p.id, p.name)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Pattern Card ────────────────────────────────────────────

interface PatternCardProps {
  pattern: SavedPattern;
  isPreviewing: boolean;
  onPreview: () => void;
  onApply: () => void;
  onDelete: () => void;
}

const PatternCard: React.FC<PatternCardProps> = ({
  pattern,
  isPreviewing,
  onPreview,
  onApply,
  onDelete,
}) => {
  return (
    <div className="pattern-card">
      <div className="pattern-card-top">
        <span
          className="pattern-card-type-dot"
          style={{ background: TRACK_COLORS[pattern.trackType] }}
        />
        <span className="pattern-card-name">{pattern.name}</span>
        <span className="pattern-card-date">
          {new Date(pattern.savedAt).toLocaleDateString()}
        </span>
      </div>
      {pattern.tags.length > 0 && (
        <div className="pattern-card-tags">
          {pattern.tags.map((tag) => (
            <span key={tag} className="pattern-card-tag">
              {tag}
            </span>
          ))}
        </div>
      )}
      <div className="pattern-card-code">
        {pattern.pattern.slice(0, 120)}
        {pattern.pattern.length > 120 ? '...' : ''}
      </div>
      <div className="pattern-card-actions">
        <button
          className={`btn btn-sm pattern-action-btn ${isPreviewing ? 'active' : ''}`}
          onClick={onPreview}
          title={isPreviewing ? 'Stop preview' : 'Preview pattern'}
        >
          {isPreviewing ? 'Stop' : 'Preview'}
        </button>
        <button
          className="btn btn-sm pattern-action-btn btn-primary"
          onClick={onApply}
          title="Apply to matching track"
        >
          Apply
        </button>
        <button
          className="btn btn-sm pattern-action-btn pattern-delete-btn"
          onClick={onDelete}
          title="Delete from library"
        >
          Delete
        </button>
      </div>
    </div>
  );
};
