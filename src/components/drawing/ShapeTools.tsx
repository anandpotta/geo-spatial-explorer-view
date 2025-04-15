
import { MapPin, Square, Circle, Polygon } from 'lucide-react';
import DrawingToolButton from './DrawingToolButton';

interface ShapeToolsProps {
  activeTool: string | null;
  onToolSelect: (tool: string) => void;
}

const ShapeTools = ({ activeTool, onToolSelect }: ShapeToolsProps) => {
  return (
    <div className="flex flex-col gap-2 bg-background/80 backdrop-blur-sm p-2 rounded-md shadow-md">
      <DrawingToolButton
        icon={MapPin}
        label="Add Marker"
        isActive={activeTool === 'marker'}
        onClick={() => onToolSelect('marker')}
      />
      <DrawingToolButton
        icon={Polygon}
        label="Draw Polygon"
        isActive={activeTool === 'polygon'}
        onClick={() => onToolSelect('polygon')}
      />
      <DrawingToolButton
        icon={Square}
        label="Draw Rectangle"
        isActive={activeTool === 'rectangle'}
        onClick={() => onToolSelect('rectangle')}
      />
      <DrawingToolButton
        icon={Circle}
        label="Draw Circle"
        isActive={activeTool === 'circle'}
        onClick={() => onToolSelect('circle')}
      />
    </div>
  );
};

export default ShapeTools;
