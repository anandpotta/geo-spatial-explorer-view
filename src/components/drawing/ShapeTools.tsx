
import { MapPin, Square, Circle } from 'lucide-react';
import { LucideIcon } from 'lucide-react';
import DrawingToolButton from './DrawingToolButton';
import React from 'react';

// Custom polygon icon since it's not available in lucide-react
const PolygonIcon = React.forwardRef<SVGSVGElement>((props, ref) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    ref={ref}
    {...props}
  >
    <path d="M12 4l8 4v8l-8 4-8-4V8l8-4z" />
  </svg>
));

PolygonIcon.displayName = 'PolygonIcon';

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
        icon={PolygonIcon as LucideIcon}
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
