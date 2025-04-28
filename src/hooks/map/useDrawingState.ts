
import { useState } from 'react';
import { DrawingData } from '@/utils/drawing';

export function useDrawingState() {
  const [drawings, setDrawings] = useState<DrawingData[]>([]);
  const [currentDrawing, setCurrentDrawing] = useState<DrawingData | null>(null);
  const [selectedDrawing, setSelectedDrawing] = useState<DrawingData | null>(null);
  const [showFloorPlan, setShowFloorPlan] = useState(false);
  
  const handleRegionClick = (drawing: DrawingData) => {
    setSelectedDrawing(drawing);
    setShowFloorPlan(true);
  };

  return {
    drawings,
    setDrawings,
    currentDrawing,
    setCurrentDrawing,
    selectedDrawing,
    setSelectedDrawing,
    showFloorPlan,
    setShowFloorPlan,
    handleRegionClick
  };
}
