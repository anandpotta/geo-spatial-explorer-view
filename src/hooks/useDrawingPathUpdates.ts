
import { useCallback } from 'react';

interface DrawingPathUpdatesProps {
  onPathsUpdated?: (paths: string[]) => void;
}

export function useDrawingPathUpdates({ onPathsUpdated }: DrawingPathUpdatesProps) {
  // Use a wrapper function to prevent redundant updates
  const handlePathsUpdated = useCallback((paths: string[]) => {
    if (onPathsUpdated) {
      // Only log once rather than every time
      onPathsUpdated(paths);
    }
  }, [onPathsUpdated]);

  return { handlePathsUpdated };
}
