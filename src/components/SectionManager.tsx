import React, { useState, useCallback } from 'react';
import { useProjectStore } from '../store/projectStore';

const SECTION_NAMES = ['Intro', 'Verse', 'Pre-Chorus', 'Chorus', 'Bridge', 'Breakdown', 'Drop', 'Outro'];

const SECTION_COLORS: Record<string, string> = {
  Intro: '#1abc9c',
  Verse: '#3498db',
  'Pre-Chorus': '#9b59b6',
  Chorus: '#e74c3c',
  Bridge: '#f39c12',
  Breakdown: '#e67e22',
  Drop: '#e91e63',
  Outro: '#1abc9c',
  Custom: '#95a5a6',
};

export const SectionManager: React.FC = () => {
  const project = useProjectStore((s) => s.project);
  const addSection = useProjectStore((s) => s.addSection);
  const removeSection = useProjectStore((s) => s.removeSection);

  const [showDropdown, setShowDropdown] = useState<number | null>(null);
  const [customName, setCustomName] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  const bars = Array.from({ length: project.totalBars }, (_, i) => i);

  const getSectionAtBar = useCallback(
    (bar: number) => {
      return project.sections.find(
        (s) => bar >= s.startBar && bar <= s.endBar
      );
    },
    [project.sections]
  );

  const getSectionStartingAtBar = useCallback(
    (bar: number) => {
      return project.sections.find((s) => s.startBar === bar);
    },
    [project.sections]
  );

  const handleBarClick = (bar: number) => {
    const existingStart = getSectionStartingAtBar(bar);
    if (existingStart) return; // Already has section start here
    setShowDropdown(bar);
    setShowCustomInput(false);
    setCustomName('');
  };

  const handleSelectSection = (bar: number, name: string) => {
    const color = SECTION_COLORS[name] || SECTION_COLORS.Custom;
    // Default section spans 4 bars or until end
    const endBar = Math.min(bar + 3, project.totalBars - 1);
    addSection({
      id: crypto.randomUUID(),
      name,
      startBar: bar,
      endBar,
      color,
    });
    setShowDropdown(null);
  };

  const handleCustomSubmit = (bar: number) => {
    if (!customName.trim()) return;
    handleSelectSection(bar, customName.trim());
    setCustomName('');
    setShowCustomInput(false);
  };

  const handleContextMenu = (e: React.MouseEvent, bar: number) => {
    e.preventDefault();
    const section = getSectionAtBar(bar);
    if (section) {
      removeSection(section.id);
    }
  };

  return (
    <div className="section-markers">
      {bars.map((bar) => {
        const section = getSectionAtBar(bar);
        const isStart = section && section.startBar === bar;

        return (
          <div
            key={bar}
            className={`section-marker-cell${section ? ' in-section' : ''}`}
            onClick={() => handleBarClick(bar)}
            onContextMenu={(e) => handleContextMenu(e, bar)}
          >
            {section && (
              <div
                className="section-span"
                style={{
                  backgroundColor: section.color + '33',
                  borderBottom: `2px solid ${section.color}`,
                }}
              >
                {isStart && (
                  <span
                    className="section-span-label"
                    style={{ color: section.color }}
                  >
                    {section.name}
                  </span>
                )}
              </div>
            )}

            {showDropdown === bar && (
              <div
                className="section-dropdown"
                onClick={(e) => e.stopPropagation()}
              >
                {!showCustomInput ? (
                  <>
                    {SECTION_NAMES.map((name) => (
                      <div
                        key={name}
                        className="section-dropdown-item"
                        onClick={() => handleSelectSection(bar, name)}
                      >
                        <span
                          className="section-color-dot"
                          style={{
                            backgroundColor:
                              SECTION_COLORS[name] || SECTION_COLORS.Custom,
                          }}
                        />
                        {name}
                      </div>
                    ))}
                    <div
                      className="section-dropdown-item"
                      onClick={() => setShowCustomInput(true)}
                    >
                      <span
                        className="section-color-dot"
                        style={{ backgroundColor: SECTION_COLORS.Custom }}
                      />
                      Custom...
                    </div>
                  </>
                ) : (
                  <div className="section-custom-input">
                    <input
                      type="text"
                      placeholder="Section name"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleCustomSubmit(bar);
                        if (e.key === 'Escape') setShowDropdown(null);
                      }}
                      autoFocus
                    />
                    <button
                      className="btn btn-sm btn-accent"
                      onClick={() => handleCustomSubmit(bar)}
                    >
                      Add
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
