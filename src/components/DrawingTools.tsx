
import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import DrawingToolButton from './drawing/DrawingToolButton';
import MapControls from './drawing/MapControls';
import ShapeTools from './drawing/ShapeTools';

interface DrawingToolsProps {
  onToolSelect: (tool: string) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
}

const DrawingTools = ({ 
  onToolSelect, 
  onZoomIn, 
  onZoomOut, 
  onReset 
}: DrawingToolsProps) => {
  const [activeTool, setActiveTool] = useState<string | null>(null);
  
  const handleToolClick = (tool: string) => {
    const newActiveTool = tool === activeTool ? null : tool;
    setActiveTool(newActiveTool);
    onToolSelect(tool);
  };
  
  return (
    <div 
      className="absolute right-4 top-1/2 transform -translate-y-1/2 flex flex-col gap-2 bg-background/80 backdrop-blur-sm p-2 rounded-md shadow-md"
      style={{ 
        zIndex: 20000,
        isolation: 'isolate',
        position: 'fixed'
      }}
    >
      <ShapeTools 
        activeTool={activeTool} 
        onToolSelect={handleToolClick} 
      />
      
      <div className="h-4" /> {/* Spacer */}
      
      <MapControls 
        onZoomIn={onZoomIn}
        onZoomOut={onZoomOut}
        onReset={onReset}
      />
      
      <div className="h-4" /> {/* Spacer */}
      
      <DrawingToolButton
        icon={Trash2}
        label="Clear All"
        onClick={() => handleToolClick('clear')}
      />
    </div>
  );
};

export default DrawingTools;
