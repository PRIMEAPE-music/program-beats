import React from 'react';
import { useResizable } from '../hooks/useResizable';

export interface ResizablePanelProps {
  direction: 'horizontal' | 'vertical';
  initialSize: number;
  minSize: number;
  maxSize: number;
  side: 'left' | 'right' | 'top' | 'bottom';
  storageKey: string;
  children: React.ReactNode;
}

export const ResizablePanel: React.FC<ResizablePanelProps> = ({
  direction,
  initialSize,
  minSize,
  maxSize,
  side,
  storageKey,
  children,
}) => {
  const { size, handleProps, isResizing } = useResizable({
    direction,
    initialSize,
    minSize,
    maxSize,
    storageKey,
  });

  const isHorizontal = direction === 'horizontal';
  const handleBefore = side === 'right' || side === 'bottom';

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: isHorizontal
      ? handleBefore ? 'row' : 'row-reverse'
      : handleBefore ? 'column' : 'column-reverse',
    [isHorizontal ? 'width' : 'height']: size,
    flexShrink: 0,
    position: 'relative',
  };

  const handleClass = [
    'resize-handle',
    isHorizontal ? 'resize-handle-horizontal' : 'resize-handle-vertical',
    isResizing ? 'resize-handle-active' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const contentStyle: React.CSSProperties = {
    flex: 1,
    overflow: 'hidden',
    minWidth: 0,
    minHeight: 0,
  };

  return (
    <div style={containerStyle}>
      {handleBefore && (
        <div className={handleClass} {...handleProps} />
      )}
      <div style={contentStyle}>{children}</div>
      {!handleBefore && (
        <div className={handleClass} {...handleProps} />
      )}
    </div>
  );
};
