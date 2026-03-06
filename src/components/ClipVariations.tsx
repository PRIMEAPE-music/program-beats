import React, { useCallback } from 'react';
import { useProjectStore } from '../store/projectStore';
import '../styles/production.css';

interface ClipVariationsProps {
  clipId: string;
}

const VARIATION_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

export const ClipVariations: React.FC<ClipVariationsProps> = ({ clipId }) => {
  const clip = useProjectStore((s) => s.project.clips[clipId]);
  const addClipVariation = useProjectStore((s) => s.addClipVariation);
  const setActiveVariation = useProjectStore((s) => s.setActiveVariation);

  const handleAddVariation = useCallback(() => {
    if (!clip) return;
    // Copy the current active pattern as a starting point
    const currentPattern =
      clip.activeVariation !== undefined && clip.variations
        ? clip.variations[clip.activeVariation]
        : clip.pattern;
    addClipVariation(clipId, currentPattern);
  }, [clip, clipId, addClipVariation]);

  const handleSelectMain = useCallback(() => {
    setActiveVariation(clipId, undefined);
  }, [clipId, setActiveVariation]);

  const handleSelectVariation = useCallback(
    (index: number) => {
      setActiveVariation(clipId, index);
    },
    [clipId, setActiveVariation]
  );

  if (!clip) return null;

  const variations = clip.variations || [];
  const isMainActive = clip.activeVariation === undefined;

  return (
    <div className="clip-variations">
      <span className="clip-variations-label">Var:</span>
      {/* Main pattern button */}
      <button
        className={`variation-btn main${isMainActive ? ' active' : ''}`}
        onClick={handleSelectMain}
        title="Main pattern"
      >
        M
      </button>
      {/* Variation buttons */}
      {variations.map((_, i) => (
        <button
          key={i}
          className={`variation-btn${clip.activeVariation === i ? ' active' : ''}`}
          onClick={() => handleSelectVariation(i)}
          title={`Variation ${VARIATION_LABELS[i] || i + 1}`}
        >
          {VARIATION_LABELS[i] || i + 1}
        </button>
      ))}
      {/* Add variation button */}
      {variations.length < 8 && (
        <button
          className="variation-add-btn"
          onClick={handleAddVariation}
          title="Add variation"
        >
          +
        </button>
      )}
    </div>
  );
};
