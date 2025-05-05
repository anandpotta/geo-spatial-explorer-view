
import { ZoomIn, ZoomOut, RotateCw } from 'lucide-react';
import DrawingToolButton from './DrawingToolButton';
import { useState } from 'react';

interface MapControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
}

const MapControls = ({ onZoomIn, onZoomOut, onReset }: MapControlsProps) => {
  const [isZooming, setIsZooming] = useState(false);
  
  const handleZoomIn = () => {
    if (isZooming) return;
    setIsZooming(true);
    
    // Call the zoom in handler
    onZoomIn();
    
    // Reset the zooming state after a short delay
    setTimeout(() => {
      setIsZooming(false);
    }, 300);
  };
  
  const handleZoomOut = () => {
    if (isZooming) return;
    setIsZooming(true);
    
    // Call the zoom out handler
    onZoomOut();
    
    // Reset the zooming state after a short delay
    setTimeout(() => {
      setIsZooming(false);
    }, 300);
  };
  
  const handleReset = () => {
    if (isZooming) return;
    setIsZooming(true);
    
    // Call the reset handler
    onReset();
    
    // Reset the zooming state after a short delay
    setTimeout(() => {
      setIsZooming(false);
    }, 300);
  };

  return (
    <div className="flex flex-col gap-2">
      <DrawingToolButton
        icon={ZoomIn}
        label="Zoom In"
        onClick={handleZoomIn}
        className={isZooming ? "pointer-events-none opacity-70" : ""}
      />
      <DrawingToolButton
        icon={ZoomOut}
        label="Zoom Out"
        onClick={handleZoomOut}
        className={isZooming ? "pointer-events-none opacity-70" : ""}
      />
      <DrawingToolButton
        icon={RotateCw}
        label="Reset View"
        onClick={handleReset}
        className={isZooming ? "pointer-events-none opacity-70" : ""}
      />
    </div>
  );
};

export default MapControls;
