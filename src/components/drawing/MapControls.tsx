
import { ZoomIn, ZoomOut, RotateCw } from 'lucide-react';
import DrawingToolButton from './DrawingToolButton';

interface MapControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
}

const MapControls = ({ onZoomIn, onZoomOut, onReset }: MapControlsProps) => {
  return (
    <div className="flex flex-col gap-2">
      <DrawingToolButton
        icon={ZoomIn}
        label="Zoom In"
        onClick={onZoomIn}
      />
      <DrawingToolButton
        icon={ZoomOut}
        label="Zoom Out"
        onClick={onZoomOut}
      />
      <DrawingToolButton
        icon={RotateCw}
        label="Reset View"
        onClick={onReset}
      />
    </div>
  );
};

export default MapControls;
