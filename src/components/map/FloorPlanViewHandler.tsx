
import React from 'react';
import { DrawingData } from '@/utils/drawing-utils';
import FloorPlanView from './FloorPlanView';

interface FloorPlanViewHandlerProps {
  showFloorPlan: boolean;
  selectedDrawing: DrawingData | null;
  onBack: () => void;
}

const FloorPlanViewHandler = ({ 
  showFloorPlan, 
  selectedDrawing, 
  onBack 
}: FloorPlanViewHandlerProps) => {
  if (!showFloorPlan) return null;

  return (
    <FloorPlanView 
      onBack={onBack} 
      drawing={selectedDrawing}
    />
  );
};

export default FloorPlanViewHandler;
