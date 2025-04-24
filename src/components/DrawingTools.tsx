
import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import DrawingToolButton from './drawing/DrawingToolButton';
import MapControls from './drawing/MapControls';
import ShapeTools from './drawing/ShapeTools';
import { deleteMarker, getSavedMarkers } from '@/utils/marker-utils';
import { deleteDrawing, getSavedDrawings } from '@/utils/drawing-utils';
import { toast } from 'sonner';

interface Position {
  x: number;
  y: number;
}

interface DrawingToolsProps {
  onToolSelect: (tool: string) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  onClearAll?: () => void; // Add new prop for clearing all state
}

const DrawingTools = ({ 
  onToolSelect, 
  onZoomIn, 
  onZoomOut, 
  onReset,
  onClearAll
}: DrawingToolsProps) => {
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [position, setPosition] = useState<Position>({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  
  const handleToolClick = (tool: string) => {
    if (tool === 'clear') {
      handleClearAll();
      return;
    }
    
    const newActiveTool = tool === activeTool ? null : tool;
    setActiveTool(newActiveTool);
    onToolSelect(tool);
  };

  const handleClearAll = () => {
    const markers = getSavedMarkers();
    const drawings = getSavedDrawings();

    // Clear all markers
    markers.forEach(marker => {
      deleteMarker(marker.id);
    });

    // Clear all drawings
    drawings.forEach(drawing => {
      deleteDrawing(drawing.id);
    });

    // Clear local storage
    localStorage.removeItem('savedMarkers');
    localStorage.removeItem('savedDrawings');

    // Notify components about storage changes
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new Event('markersUpdated'));
    
    // Reset map state through parent component
    if (onClearAll) {
      onClearAll();
    }
    
    toast.success('All layers cleared');
  };

  const handleMouseDown = (event: React.MouseEvent) => {
    setIsDragging(true);
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: Math.max(0, Math.min(window.innerWidth - 100, position.x + event.movementX)),
        y: Math.max(0, Math.min(window.innerHeight - 100, position.y + event.movementY))
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };
  
  return (
    <div 
      className="fixed bg-background/80 backdrop-blur-sm p-2 rounded-md shadow-md cursor-move"
      style={{ 
        left: position.x,
        top: position.y,
        zIndex: 20000,
        isolation: 'isolate',
        userSelect: 'none',
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <ShapeTools 
        activeTool={activeTool} 
        onToolSelect={handleToolClick} 
      />
      
      <div className="h-4" />
      
      <MapControls 
        onZoomIn={onZoomIn}
        onZoomOut={onZoomOut}
        onReset={onReset}
      />
      
      <div className="h-4" />
      
      <DrawingToolButton
        icon={Trash2}
        label="Clear All"
        onClick={() => handleToolClick('clear')}
      />
    </div>
  );
};

export default DrawingTools;
