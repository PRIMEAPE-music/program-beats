import React, { useState, useCallback } from 'react';
import { useProjectStore } from '../store/projectStore';
import { GENRE_TEMPLATES } from '../engine/genreTemplates';
import type { TrackType } from '../engine/types';
import '../styles/ai-features.css';

interface SongGeneratorProps {
  onClose: () => void;
}

const ALL_SECTIONS = ['Intro', 'Verse', 'Pre-Chorus', 'Chorus', 'Bridge', 'Outro'];

interface SectionPattern {
  trackType: string;
  pattern: string;
  description: string;
}

interface GeneratedSection {
  name: string;
  patterns: SectionPattern[];
}

interface SongResult {
  sections: GeneratedSection[];
}

export const SongGenerator: React.FC<SongGeneratorProps> = ({ onClose }) => {
  const project = useProjectStore((s) => s.project);
  const addTrack = useProjectStore((s) => s.addTrack);
  const addClip = useProjectStore((s) => s.addClip);
  const placeClip = useProjectStore((s) => s.placeClip);
  const addSection = useProjectStore((s) => s.addSection);
  const setBpm = useProjectStore((s) => s.setBpm);

  const [prompt, setPrompt] = useState('');
  const [bpm, setBpmInput] = useState(project.bpm);
  const [genreHint, setGenreHint] = useState('');
  const [selectedSections, setSelectedSections] = useState<string[]>(['Intro', 'Verse', 'Chorus', 'Outro']);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  const [result, setResult] = useState<SongResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setSelectedSections((prev) =>
      prev.includes(section) ? prev.filter((s) => s !== section) : [...prev, section]
    );
  };

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim() || selectedSections.length === 0) return;

    setIsLoading(true);
    setError(null);
    setResult(null);
    setLoadingText('Composing your song... This may take a moment.');

    try {
      const fullPrompt = genreHint
        ? `${prompt} (Genre: ${genreHint})`
        : prompt;

      const response = await fetch('/api/generate-song', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: fullPrompt,
          config: {
            bpm,
            totalBars: selectedSections.length * 8,
            sectionNames: selectedSections,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data: SongResult = await response.json();
      setResult(data);
      setLoadingText('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [prompt, bpm, genreHint, selectedSections]);

  const handleApplyAll = useCallback(() => {
    if (!result) return;

    // Set BPM
    setBpm(bpm);

    // Collect unique track types from the result
    const trackTypes = new Set<string>();
    for (const section of result.sections) {
      for (const pat of section.patterns) {
        trackTypes.add(pat.trackType);
      }
    }

    // Build a fresh project structure
    // First ensure tracks exist for each type
    const trackTypeNames: Record<string, string> = {
      drums: 'Drums',
      bass: 'Bass',
      melody: 'Melody',
      chords: 'Chords',
      fx: 'FX',
      custom: 'Custom',
    };

    // Create tracks for missing types
    const existingTypes = new Set(project.tracks.map((t) => t.type));
    for (const tt of trackTypes) {
      if (!existingTypes.has(tt as TrackType)) {
        addTrack(trackTypeNames[tt] || tt, tt as TrackType);
      }
    }

    // Get latest project state after adding tracks
    const currentProject = useProjectStore.getState().project;

    // Place clips section by section
    let currentBar = 0;
    const barsPerSection = 4;

    for (const section of result.sections) {
      // Add section marker
      addSection({
        id: crypto.randomUUID(),
        name: section.name,
        startBar: currentBar,
        endBar: currentBar + barsPerSection,
        color: '#e94560',
      });

      for (const pat of section.patterns) {
        const track = currentProject.tracks.find((t) => t.type === pat.trackType);
        if (!track) continue;

        const clipId = crypto.randomUUID();
        addClip({
          id: clipId,
          name: `${section.name} - ${pat.description.slice(0, 25)}`,
          pattern: pat.pattern,
          color: '#e94560',
          durationBars: barsPerSection,
        });
        placeClip(track.id, currentBar, clipId);
      }

      currentBar += barsPerSection;
    }

    onClose();
  }, [result, bpm, project, addTrack, addClip, placeClip, addSection, setBpm, onClose]);

  return (
    <div className="song-generator-overlay" onClick={onClose}>
      <div className="song-generator" onClick={(e) => e.stopPropagation()}>
        <h2>Generate Full Song</h2>

        {!result && !isLoading && (
          <>
            <div className="song-generator-field">
              <label>Describe your song</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., A chill lo-fi track with jazzy piano and soft drums, building into a warm chorus..."
                rows={3}
              />
            </div>

            <div className="song-generator-row">
              <div className="song-generator-field">
                <label>BPM</label>
                <input
                  type="number"
                  value={bpm}
                  onChange={(e) => setBpmInput(Number(e.target.value))}
                  min={40}
                  max={300}
                />
              </div>
              <div className="song-generator-field">
                <label>Genre Hint (optional)</label>
                <select value={genreHint} onChange={(e) => setGenreHint(e.target.value)}>
                  <option value="">-- None --</option>
                  {GENRE_TEMPLATES.map((g) => (
                    <option key={g.name} value={g.name}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="song-generator-field">
              <label>Song Sections</label>
              <div className="song-generator-sections">
                {ALL_SECTIONS.map((section) => (
                  <label key={section}>
                    <input
                      type="checkbox"
                      checked={selectedSections.includes(section)}
                      onChange={() => toggleSection(section)}
                    />
                    {section}
                  </label>
                ))}
              </div>
            </div>

            {error && (
              <div style={{ color: '#e94560', fontSize: 12, marginTop: 8 }}>
                Error: {error}
              </div>
            )}

            <div className="song-generator-actions">
              <button className="btn btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                disabled={!prompt.trim() || selectedSections.length === 0}
                onClick={handleGenerate}
              >
                Generate
              </button>
            </div>
          </>
        )}

        {isLoading && (
          <div className="song-generator-loading">
            <div className="dots">
              <span className="dot" />
              <span className="dot" />
              <span className="dot" />
            </div>
            {loadingText}
          </div>
        )}

        {result && (
          <div className="song-preview">
            <h3>Generated Song Preview</h3>
            {result.sections.map((section, sIdx) => (
              <div key={sIdx} className="song-preview-section">
                <div className="song-preview-section-header">{section.name}</div>
                {section.patterns.map((pat, pIdx) => (
                  <div key={pIdx} className="song-preview-pattern">
                    <span className="song-preview-pattern-type">{pat.trackType}</span>
                    <span className="song-preview-pattern-desc">{pat.description}</span>
                    <pre>{pat.pattern}</pre>
                  </div>
                ))}
              </div>
            ))}

            <div className="song-generator-actions">
              <button className="btn btn-secondary" onClick={() => setResult(null)}>
                Back
              </button>
              <button className="btn btn-primary" onClick={handleApplyAll}>
                Apply All
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
