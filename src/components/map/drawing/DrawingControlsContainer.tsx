
import { DrawingData } from '@/utils/drawing-utils';
import DrawingControls from '../DrawingControls';

interface DrawingControlsContainerProps {
  onShapeCreated: (shape: any) => void;
  activeTool: string | null;
  onRegionClick: (drawing: DrawingData) => void;
  onClearAll?: () => void; // Add the onClearAll prop
}

const DrawingControlsContainer = ({
  onShapeCreated,
  activeTool,
  onRegionClick,
  onClearAll
}: DrawingControlsContainerProps) => {
  return (
    <DrawingControls 
      onCreated={onShapeCreated}
      activeTool={activeTool}
      onRegionClick={onRegionClick}
      onClearAll={onClearAll}
    />
  );
};

export default DrawingControlsContainer;
