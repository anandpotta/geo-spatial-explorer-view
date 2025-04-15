
import { ZoomIn, ZoomOut, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MapControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
}

const MapControls = ({ onZoomIn, onZoomOut, onReset }: MapControlsProps) => {
  return (
    <div className="flex flex-col gap-2">
      <Button 
        variant="secondary" 
        size="icon" 
        onClick={onZoomIn} 
        title="Zoom In"
        className="bg-white hover:bg-gray-100 shadow-md"
      >
        <ZoomIn className="h-4 w-4" />
      </Button>
      <Button 
        variant="secondary" 
        size="icon" 
        onClick={onZoomOut} 
        title="Zoom Out"
        className="bg-white hover:bg-gray-100 shadow-md"
      >
        <ZoomOut className="h-4 w-4" />
      </Button>
      <Button 
        variant="secondary" 
        size="icon" 
        onClick={onReset} 
        title="Reset View"
        className="bg-white hover:bg-gray-100 shadow-md"
      >
        <RotateCw className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default MapControls;
