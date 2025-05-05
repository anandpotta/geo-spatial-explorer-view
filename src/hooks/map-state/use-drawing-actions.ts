
import { useCallback } from 'react';
import { DrawingData } from '@/utils/drawing-utils';

export function useDrawingActions(
  setShowFloorPlan: (show: boolean) => void,
  setSelectedDrawing: (drawing: DrawingData | null) => void
) {
  const handleRegionClick = useCallback((drawing: DrawingData) => {
    setSelectedDrawing(drawing);
    setShowFloorPlan(true);
  }, [setSelectedDrawing, setShowFloorPlan]);

  return {
    handleRegionClick
  };
}
