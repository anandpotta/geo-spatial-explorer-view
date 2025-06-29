
import { useState } from 'react';
import { DrawingData } from '@/utils/drawing-utils';

export function useFloorPlanState() {
  const [showFloorPlan, setShowFloorPlan] = useState(false);
  const [selectedDrawing, setSelectedDrawing] = useState<DrawingData | null>(null);
  
  const handleRegionClick = (drawing: DrawingData) => {
    setSelectedDrawing(drawing);
    setShowFloorPlan(true);
  };
  
  return {
    showFloorPlan,
    setShowFloorPlan,
    selectedDrawing,
    setSelectedDrawing,
    handleRegionClick
  };
}
