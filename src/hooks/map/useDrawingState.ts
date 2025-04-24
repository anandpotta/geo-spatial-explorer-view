
import { useState, useCallback } from 'react';
import { DrawingData } from '@/utils/drawing-utils';
import { toast } from 'sonner';

export function useDrawingState() {
  const [drawings, setDrawings] = useState<DrawingData[]>([]);
  const [currentDrawing, setCurrentDrawing] = useState<DrawingData | null>(null);
  const [showFloorPlan, setShowFloorPlan] = useState(false);
  const [selectedDrawing, setSelectedDrawing] = useState<DrawingData | null>(null);

  const handleRegionClick = useCallback((drawing: DrawingData) => {
    setSelectedDrawing(drawing);
    setShowFloorPlan(true);
  }, []);

  return {
    drawings,
    setDrawings,
    currentDrawing,
    setCurrentDrawing,
    showFloorPlan,
    setShowFloorPlan,
    selectedDrawing,
    setSelectedDrawing,
    handleRegionClick
  };
}
