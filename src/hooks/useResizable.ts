import { useState, useCallback, useEffect, useRef } from 'react';

export interface UseResizableOptions {
  direction: 'horizontal' | 'vertical';
  initialSize: number;
  minSize: number;
  maxSize: number;
  storageKey?: string;
}

export interface UseResizableReturn {
  size: number;
  handleProps: {
    onMouseDown: (e: React.MouseEvent) => void;
  };
  isResizing: boolean;
}

function loadSize(key: string | undefined, fallback: number): number {
  if (!key) return fallback;
  try {
    const stored = localStorage.getItem(`resize-${key}`);
    if (stored !== null) {
      const val = parseFloat(stored);
      if (!isNaN(val)) return val;
    }
  } catch {
    // ignore
  }
  return fallback;
}

function saveSize(key: string | undefined, size: number): void {
  if (!key) return;
  try {
    localStorage.setItem(`resize-${key}`, String(size));
  } catch {
    // ignore
  }
}

export function useResizable(options: UseResizableOptions): UseResizableReturn {
  const { direction, initialSize, minSize, maxSize, storageKey } = options;
  const [size, setSize] = useState(() => loadSize(storageKey, initialSize));
  const [isResizing, setIsResizing] = useState(false);
  const startPos = useRef(0);
  const startSize = useRef(0);

  const clamp = useCallback(
    (val: number) => Math.min(maxSize, Math.max(minSize, val)),
    [minSize, maxSize]
  );

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      startPos.current = direction === 'horizontal' ? e.clientX : e.clientY;
      startSize.current = size;
      setIsResizing(true);
    },
    [direction, size]
  );

  useEffect(() => {
    if (!isResizing) return;

    const onMouseMove = (e: MouseEvent) => {
      const currentPos = direction === 'horizontal' ? e.clientX : e.clientY;
      const delta = currentPos - startPos.current;
      const newSize = clamp(startSize.current + delta);
      setSize(newSize);
    };

    const onMouseUp = () => {
      setIsResizing(false);
      // Save on mouse up
      saveSize(storageKey, size);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);

    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, [isResizing, direction, clamp, storageKey, size]);

  // Save size when it changes (debounced via the mouseup handler above)
  // Also save on unmount
  useEffect(() => {
    return () => {
      saveSize(storageKey, size);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    size,
    handleProps: { onMouseDown },
    isResizing,
  };
}
