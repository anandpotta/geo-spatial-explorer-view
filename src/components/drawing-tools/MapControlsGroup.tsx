
import MapControls from '../drawing/MapControls';

interface MapControlsGroupProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
}

const MapControlsGroup = ({ 
  onZoomIn, 
  onZoomOut, 
  onReset 
}: MapControlsGroupProps) => {
  return (
    <MapControls 
      onZoomIn={onZoomIn}
      onZoomOut={onZoomOut}
      onReset={onReset}
    />
  );
};

export default MapControlsGroup;
