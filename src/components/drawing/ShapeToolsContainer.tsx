
import { useState } from 'react';
import ShapeTools from './ShapeTools';

interface ShapeToolsContainerProps {
  activeTool: string | null;
  onToolSelect: (tool: string) => void;
}

const ShapeToolsContainer = ({ activeTool, onToolSelect }: ShapeToolsContainerProps) => {
  const [position, setPosition] = useState({ x: 20, y: 180 }); // Start below DrawingTools
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = (event: React.MouseEvent) => {
    setIsDragging(true);
    event.preventDefault();
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
      className="fixed bg-background/80 backdrop-blur-sm p-2 rounded-md shadow-md cursor-move select-none"
      style={{ 
        left: position.x,
        top: position.y,
        zIndex: 20000,
        isolation: 'isolate',
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <ShapeTools 
        activeTool={activeTool}
        onToolSelect={onToolSelect}
      />
    </div>
  );
};

export default ShapeToolsContainer;
