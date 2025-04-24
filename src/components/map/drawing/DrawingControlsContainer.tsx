
import { FeatureGroup } from 'react-leaflet';
import DrawingControls from '../DrawingControls';
import L from 'leaflet';
import { DrawingData } from '@/utils/drawing-utils';

interface DrawingControlsContainerProps {
  onShapeCreated: (shape: any) => void;
  activeTool: string | null;
  onRegionClick: (drawing: DrawingData) => void;
}

const DrawingControlsContainer = ({
  onShapeCreated,
  activeTool,
  onRegionClick
}: DrawingControlsContainerProps) => {
  return (
    <FeatureGroup>
      <DrawingControls 
        onCreated={onShapeCreated}
        activeTool={activeTool}
        onRegionClick={onRegionClick}
      />
    </FeatureGroup>
  );
};

export default DrawingControlsContainer;
