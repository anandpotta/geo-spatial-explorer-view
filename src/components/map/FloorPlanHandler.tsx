
import { DrawingData } from '@/utils/drawing-utils';
import FloorPlanView from './FloorPlanView';

interface FloorPlanHandlerProps {
  showFloorPlan: boolean;
  selectedDrawing: DrawingData | null;
  onBack: () => void;
}

const FloorPlanHandler = ({ showFloorPlan, selectedDrawing, onBack }: FloorPlanHandlerProps) => {
  if (!showFloorPlan) {
    return null;
  }
  
  return (
    <FloorPlanView 
      onBack={onBack} 
      drawing={selectedDrawing}
    />
  );
};

export default FloorPlanHandler;
