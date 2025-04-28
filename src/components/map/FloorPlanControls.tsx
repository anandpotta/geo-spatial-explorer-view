
import { RotateCw, RotateCcw, ZoomIn, ZoomOut, Maximize2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

interface FloorPlanControlsProps {
  scale: number;
  onRotateLeft: () => void;
  onRotateRight: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitToBorders: () => void;
  onReset: () => void;
  onScaleChange: (value: number) => void;
}

const FloorPlanControls = ({
  scale,
  onRotateLeft,
  onRotateRight,
  onZoomIn,
  onZoomOut,
  onFitToBorders,
  onReset,
  onScaleChange
}: FloorPlanControlsProps) => {
  return (
    <div className="absolute left-4 top-4 z-50 bg-white/80 backdrop-blur-sm p-2 rounded-lg shadow-md flex flex-col gap-2">
      <div className="flex gap-1">
        <Button variant="outline" size="icon" onClick={onRotateLeft} title="Rotate Left">
          <RotateCcw className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={onRotateRight} title="Rotate Right">
          <RotateCw className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={onZoomIn} title="Zoom In">
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={onZoomOut} title="Zoom Out">
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={onFitToBorders} title="Fit to Borders">
          <Maximize2 className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={onReset} title="Reset">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs">Scale:</span>
        <Slider 
          value={[scale]} 
          min={0.2} 
          max={3} 
          step={0.05} 
          className="w-32"
          onValueChange={(values) => onScaleChange(values[0])}
        />
        <span className="text-xs">{Math.round(scale * 100)}%</span>
      </div>
      <div>
        <span className="text-xs text-center block">Drag image to reposition</span>
      </div>
    </div>
  );
};

export default FloorPlanControls;
