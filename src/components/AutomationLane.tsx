import React, { useCallback, useRef, useEffect, useState } from 'react';
import { useProjectStore } from '../store/projectStore';
import type { AutomationLane as AutomationLaneData, AutomationPoint } from '../engine/types';

const LANE_HEIGHT = 80;
const BAR_WIDTH = 80;
const POINT_RADIUS = 5;

const PARAM_LABELS: Record<string, string> = {
  volume: 'Volume',
  lpf: 'Low Pass',
  hpf: 'High Pass',
  delay: 'Delay',
  reverb: 'Reverb',
  distortion: 'Distortion',
};

interface AutomationLaneProps {
  lane: AutomationLaneData;
  trackId: string;
  totalBars: number;
}

export const AutomationLane: React.FC<AutomationLaneProps> = ({ lane, trackId, totalBars }) => {
  const updateAutomationPoints = useProjectStore((s) => s.updateAutomationPoints);
  const toggleAutomationLane = useProjectStore((s) => s.toggleAutomationLane);
  const removeAutomationLane = useProjectStore((s) => s.removeAutomationLane);

  const svgRef = useRef<SVGSVGElement>(null);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [localPoints, setLocalPoints] = useState<AutomationPoint[]>(lane.points);

  // Sync local points when lane.points changes externally
  useEffect(() => {
    if (draggingIndex === null) {
      setLocalPoints(lane.points);
    }
  }, [lane.points, draggingIndex]);

  const width = totalBars * BAR_WIDTH;

  const barToX = useCallback((bar: number) => bar * BAR_WIDTH, []);
  const valueToY = useCallback((value: number) => LANE_HEIGHT - value * LANE_HEIGHT, []);
  const xToBar = useCallback((x: number) => Math.max(0, Math.min(x / BAR_WIDTH, totalBars)), [totalBars]);
  const yToValue = useCallback((y: number) => Math.max(0, Math.min(1, 1 - y / LANE_HEIGHT)), []);

  const getSvgCoords = useCallback((e: React.MouseEvent | MouseEvent) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }, []);

  // Click on SVG to add a point
  const handleSvgClick = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      // Only handle direct clicks on the SVG background, not on points
      if ((e.target as Element).closest('.automation-point-handle')) return;
      const { x, y } = getSvgCoords(e);
      const bar = xToBar(x);
      const value = yToValue(y);
      const newPoints = [...localPoints, { bar, value }].sort((a, b) => a.bar - b.bar);
      setLocalPoints(newPoints);
      updateAutomationPoints(trackId, lane.id, newPoints);
    },
    [getSvgCoords, xToBar, yToValue, localPoints, updateAutomationPoints, trackId, lane.id]
  );

  // Right-click on a point to delete
  const handlePointRightClick = useCallback(
    (e: React.MouseEvent, index: number) => {
      e.preventDefault();
      e.stopPropagation();
      const newPoints = localPoints.filter((_, i) => i !== index);
      setLocalPoints(newPoints);
      updateAutomationPoints(trackId, lane.id, newPoints);
    },
    [localPoints, updateAutomationPoints, trackId, lane.id]
  );

  // Drag start on a point
  const handlePointMouseDown = useCallback(
    (e: React.MouseEvent, index: number) => {
      e.preventDefault();
      e.stopPropagation();
      setDraggingIndex(index);
    },
    []
  );

  // Drag move / end (global mouse events)
  useEffect(() => {
    if (draggingIndex === null) return;

    const handleMouseMove = (e: MouseEvent) => {
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const bar = xToBar(x);
      const value = yToValue(y);

      setLocalPoints((prev) => {
        const updated = [...prev];
        updated[draggingIndex] = { bar, value };
        return updated;
      });
    };

    const handleMouseUp = () => {
      // Commit local points, sorted
      setLocalPoints((prev) => {
        const sorted = [...prev].sort((a, b) => a.bar - b.bar);
        updateAutomationPoints(trackId, lane.id, sorted);
        return sorted;
      });
      setDraggingIndex(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingIndex, xToBar, yToValue, updateAutomationPoints, trackId, lane.id]);

  // Build the SVG path for the line
  const buildPath = () => {
    if (localPoints.length === 0) return '';
    const sorted = [...localPoints].sort((a, b) => a.bar - b.bar);
    return sorted
      .map((p, i) => {
        const x = barToX(p.bar);
        const y = valueToY(p.value);
        return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
      })
      .join(' ');
  };

  return (
    <div className={`automation-lane${!lane.enabled ? ' disabled' : ''}`}>
      <div className="automation-lane-header">
        <span className="automation-lane-param">{PARAM_LABELS[lane.parameter] || lane.parameter}</span>
        <div className="automation-lane-controls">
          <button
            className={`btn-auto-toggle${lane.enabled ? ' active' : ''}`}
            onClick={() => toggleAutomationLane(trackId, lane.id)}
            title={lane.enabled ? 'Disable lane' : 'Enable lane'}
          >
            {lane.enabled ? 'ON' : 'OFF'}
          </button>
          <button
            className="btn-auto-remove"
            onClick={() => removeAutomationLane(trackId, lane.id)}
            title="Remove automation lane"
          >
            &#x2715;
          </button>
        </div>
      </div>
      <div className="automation-lane-canvas" style={{ width }}>
        <svg
          ref={svgRef}
          width={width}
          height={LANE_HEIGHT}
          onClick={handleSvgClick}
          className="automation-svg"
        >
          {/* Grid lines for each bar */}
          {Array.from({ length: totalBars }, (_, i) => (
            <line
              key={`grid-${i}`}
              x1={i * BAR_WIDTH}
              y1={0}
              x2={i * BAR_WIDTH}
              y2={LANE_HEIGHT}
              className="automation-grid-line"
            />
          ))}
          {/* Horizontal guides at 0.25, 0.5, 0.75 */}
          {[0.25, 0.5, 0.75].map((v) => (
            <line
              key={`hguide-${v}`}
              x1={0}
              y1={valueToY(v)}
              x2={width}
              y2={valueToY(v)}
              className="automation-guide-line"
            />
          ))}
          {/* Automation curve */}
          {localPoints.length > 0 && (
            <path
              d={buildPath()}
              className="automation-curve"
              fill="none"
            />
          )}
          {/* Points */}
          {localPoints.map((p, i) => (
            <circle
              key={i}
              cx={barToX(p.bar)}
              cy={valueToY(p.value)}
              r={POINT_RADIUS}
              className={`automation-point-handle${draggingIndex === i ? ' dragging' : ''}`}
              onMouseDown={(e) => handlePointMouseDown(e, i)}
              onContextMenu={(e) => handlePointRightClick(e, i)}
            />
          ))}
        </svg>
      </div>
    </div>
  );
};

/* ── Parameter selector dropdown for adding new lanes ── */

const ALL_PARAMS: AutomationLaneData['parameter'][] = [
  'volume', 'lpf', 'hpf', 'delay', 'reverb', 'distortion',
];

interface AddAutomationDropdownProps {
  trackId: string;
  existingParams: string[];
}

export const AddAutomationDropdown: React.FC<AddAutomationDropdownProps> = ({
  trackId,
  existingParams,
}) => {
  const addAutomationLane = useProjectStore((s) => s.addAutomationLane);
  const [open, setOpen] = useState(false);

  const available = ALL_PARAMS.filter((p) => !existingParams.includes(p));

  if (available.length === 0) return null;

  return (
    <div className="add-automation-dropdown">
      <button
        className="btn-add-automation"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        title="Add automation lane"
      >
        + Auto
      </button>
      {open && (
        <div className="automation-dropdown-menu">
          {available.map((param) => (
            <div
              key={param}
              className="automation-dropdown-item"
              onClick={(e) => {
                e.stopPropagation();
                addAutomationLane(trackId, param);
                setOpen(false);
              }}
            >
              {PARAM_LABELS[param] || param}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
