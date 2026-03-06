import React, { useState, useCallback } from 'react';
import { useProjectStore } from '../store/projectStore';
import { strudelEngine } from '../engine/StrudelEngine';

interface Variation {
  pattern: string;
  description: string;
}

export const VariationGenerator: React.FC = () => {
  const selectedClipId = useProjectStore((s) => s.selectedClipId);
  const project = useProjectStore((s) => s.project);
  const updateClip = useProjectStore((s) => s.updateClip);

  const [variations, setVariations] = useState<Variation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [previewingPattern, setPreviewingPattern] = useState<string | null>(null);

  const handlePreviewToggle = useCallback(async (patternCode: string) => {
    if (previewingPattern === patternCode) {
      strudelEngine.stop();
      setPreviewingPattern(null);
    } else {
      strudelEngine.stop();
      await strudelEngine.previewPattern(patternCode);
      setPreviewingPattern(patternCode);
    }
  }, [previewingPattern]);

  const selectedClip = selectedClipId ? project.clips[selectedClipId] : null;

  const selectedClipTrackType = selectedClipId
    ? project.tracks.find((t) =>
        Object.values(t.clips).includes(selectedClipId)
      )?.type ?? 'custom'
    : 'custom';

  const handleGenerate = useCallback(async () => {
    if (!selectedClip) return;

    setIsLoading(true);
    setError(null);
    setVariations([]);
    setExpanded(true);

    try {
      const response = await fetch('/api/variations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pattern: selectedClip.pattern,
          trackType: selectedClipTrackType,
          count: 4,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      setVariations(data.variations || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate variations');
    } finally {
      setIsLoading(false);
    }
  }, [selectedClip, selectedClipTrackType]);

  const handleApply = useCallback(
    (variation: Variation) => {
      if (!selectedClipId) return;
      updateClip(selectedClipId, { pattern: variation.pattern });
    },
    [selectedClipId, updateClip]
  );

  if (!selectedClip) return null;

  return (
    <div className="variation-generator">
      <div className="variation-generator-header">
        <button
          className="btn btn-sm btn-accent"
          onClick={handleGenerate}
          disabled={isLoading}
        >
          {isLoading ? 'Generating...' : 'Generate Variations'}
        </button>
        {variations.length > 0 && (
          <button
            className="btn btn-sm"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? 'Hide' : 'Show'} ({variations.length})
          </button>
        )}
      </div>

      {expanded && (
        <div className="variation-list">
          {isLoading && (
            <div className="variation-loading">
              <div className="dots">
                <span className="dot" />
                <span className="dot" />
                <span className="dot" />
              </div>
              Generating variations...
            </div>
          )}

          {error && (
            <div className="variation-error">{error}</div>
          )}

          {variations.map((variation, idx) => (
            <div key={idx} className={`variation-item ${previewingPattern === variation.pattern ? 'previewing' : ''}`}>
              <div className="variation-desc">{variation.description}</div>
              <pre className="variation-pattern">{variation.pattern}</pre>
              <div className="variation-actions">
                <button
                  className={`preview-btn ${previewingPattern === variation.pattern ? 'active' : ''}`}
                  onClick={() => handlePreviewToggle(variation.pattern)}
                  title={previewingPattern === variation.pattern ? 'Stop preview' : 'Preview variation'}
                >
                  {previewingPattern === variation.pattern ? '\u25A0' : '\u25B6'}
                </button>
                <button
                  className="btn btn-sm btn-accent"
                  onClick={() => handleApply(variation)}
                >
                  Apply
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
