
import { useState, useEffect } from 'react';

interface ShapeToolsContainerProps {
  activeTool: string | null;
  onToolSelect: (tool: string) => void;
}

const ShapeToolsContainer = ({ activeTool, onToolSelect }: ShapeToolsContainerProps) => {
  const [position, setPosition] = useState({ x: 20, y: 180 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const handleMouseDown = (event: React.MouseEvent) => {
    setIsDragging(true);
    const rect = event.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    });
    event.preventDefault();
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    if (isDragging) {
      const newX = event.clientX - dragOffset.x;
      const newY = event.clientY - dragOffset.y;

      // Ensure the container stays within viewport bounds
      setPosition({
        x: Math.max(0, Math.min(window.innerWidth - 100, newX)),
        y: Math.max(0, Math.min(window.innerHeight - 100, newY))
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    const handleMouseUpGlobal = () => {
      if (isDragging) {
        setIsDragging(false);
      }
    };

    document.addEventListener('mouseup', handleMouseUpGlobal);
    return () => document.removeEventListener('mouseup', handleMouseUpGlobal);
  }, [isDragging]);

  return (
    <div 
      className="fixed bg-background/80 backdrop-blur-sm p-4 rounded-lg shadow-lg cursor-move select-none"
      style={{ 
        left: position.x,
        top: position.y,
        zIndex: 20000,
        isolation: 'isolate',
        transition: isDragging ? 'none' : 'background-color 0.2s',
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div className="flex flex-col gap-2">
        <button
          className={`px-4 py-2 rounded-md ${activeTool === 'marker' ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}
          onClick={() => onToolSelect('marker')}
        >
          Add Marker
        </button>
        <button
          className={`px-4 py-2 rounded-md ${activeTool === 'polygon' ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}
          onClick={() => onToolSelect('polygon')}
        >
          Draw Polygon
        </button>
        <button
          className={`px-4 py-2 rounded-md ${activeTool === 'circle' ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}
          onClick={() => onToolSelect('circle')}
        >
          Draw Circle
        </button>
      </div>
    </div>
  );
};

export default ShapeToolsContainer;
