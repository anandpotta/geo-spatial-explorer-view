
import { MapPin, Square, Circle } from 'lucide-react';
import DrawingToolButton from './DrawingToolButton';

interface ShapeToolsProps {
  activeTool: string | null;
  onToolSelect: (tool: string) => void;
}

const ShapeTools = ({ activeTool, onToolSelect }: ShapeToolsProps) => {
  return (
    <div className="flex flex-col gap-2">
      <DrawingToolButton
        icon={MapPin}
        label="Add Marker"
        isActive={activeTool === 'marker'}
        onClick={() => onToolSelect('marker')}
      />
      <DrawingToolButton
        icon={Square}
        label="Draw Polygon"
        isActive={activeTool === 'polygon'}
        onClick={() => onToolSelect('polygon')}
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
