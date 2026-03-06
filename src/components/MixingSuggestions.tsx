import React, { useState, useCallback } from 'react';
import { useProjectStore } from '../store/projectStore';
import '../styles/ai-features.css';

interface MixingSuggestionsProps {
  onClose: () => void;
}

interface Suggestion {
  trackName: string;
  issue: string;
  fix: string;
  fixPattern?: string;
}

export const MixingSuggestions: React.FC<MixingSuggestionsProps> = ({ onClose }) => {
  const project = useProjectStore((s) => s.project);
  const updateClip = useProjectStore((s) => s.updateClip);

  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appliedIndices, setAppliedIndices] = useState<Set<number>>(new Set());

  const handleAnalyze = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setSuggestions([]);
    setAppliedIndices(new Set());

    try {
      // Build track data with patterns and effects
      const trackData = project.tracks.map((track) => {
        // Get the first clip's pattern as representative
        const firstClipId = Object.values(track.clips)[0];
        const clip = firstClipId ? project.clips[firstClipId] : null;
        return {
          name: track.name,
          type: track.type,
          pattern: clip?.pattern || '(no pattern)',
          effects: track.effects,
        };
      });

      const response = await fetch('/api/mixing-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tracks: trackData }),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      setSuggestions(data.suggestions || []);
      setHasAnalyzed(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [project]);

  const handleApplyFix = useCallback(
    (suggestion: Suggestion, index: number) => {
      if (!suggestion.fixPattern) return;

      // Find the track by name and update its first clip's pattern
      const track = project.tracks.find((t) => t.name === suggestion.trackName);
      if (!track) return;

      const firstClipId = Object.values(track.clips)[0];
      if (firstClipId) {
        updateClip(firstClipId, { pattern: suggestion.fixPattern });
        setAppliedIndices((prev) => new Set(prev).add(index));
      }
    },
    [project, updateClip]
  );

  return (
    <div className="mixing-suggestions-overlay" onClick={onClose}>
      <div className="mixing-suggestions" onClick={(e) => e.stopPropagation()}>
        <h2>AI Mixing Suggestions</h2>

        {!hasAnalyzed && !isLoading && (
          <div className="mixing-suggestions-empty">
            <p>Analyze your current mix to get AI-powered suggestions for improvements.</p>
            <p style={{ fontSize: 11, marginTop: 8, color: 'var(--text-dim)' }}>
              The AI will review your tracks, patterns, and effects to identify potential issues.
            </p>
          </div>
        )}

        {isLoading && (
          <div className="mixing-suggestions-loading">
            <div className="dots">
              <span className="dot" />
              <span className="dot" />
              <span className="dot" />
            </div>
            Analyzing your mix...
          </div>
        )}

        {error && (
          <div style={{ color: '#e94560', fontSize: 12, padding: 12 }}>
            Error: {error}
          </div>
        )}

        {hasAnalyzed && suggestions.length === 0 && !isLoading && (
          <div className="mixing-suggestions-empty">
            <p>No suggestions returned. Your mix may already sound great, or try adding more tracks/patterns first.</p>
          </div>
        )}

        {suggestions.map((suggestion, idx) => (
          <div key={idx} className="suggestion-card">
            <div className="suggestion-card-header">
              <span className="suggestion-card-track">{suggestion.trackName}</span>
            </div>
            <div className="suggestion-card-issue">
              <strong>Issue:</strong> {suggestion.issue}
            </div>
            <div className="suggestion-card-fix">{suggestion.fix}</div>
            {suggestion.fixPattern && (
              <div className="suggestion-card-pattern">
                <pre>{suggestion.fixPattern}</pre>
              </div>
            )}
            {suggestion.fixPattern && (
              <div className="suggestion-card-actions">
                <button
                  className="btn btn-sm btn-accent"
                  onClick={() => handleApplyFix(suggestion, idx)}
                  disabled={appliedIndices.has(idx)}
                >
                  {appliedIndices.has(idx) ? 'Applied' : 'Apply Fix'}
                </button>
              </div>
            )}
          </div>
        ))}

        <div className="mixing-suggestions-actions">
          <button className="btn btn-primary" onClick={handleAnalyze} disabled={isLoading}>
            {hasAnalyzed ? 'Re-Analyze' : 'Analyze Mix'}
          </button>
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
