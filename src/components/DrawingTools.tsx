
import { useState, useRef, useEffect } from 'react';
import DrawingToolButton from './drawing/DrawingToolButton';
import MapControls from './drawing/MapControls';

interface Position {
  x: number;
  y: number;
}

interface DrawingToolsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
}

const DrawingTools = ({ 
  onZoomIn, 
  onZoomOut, 
  onReset 
}: DrawingToolsProps) => {
  const [position, setPosition] = useState<Position>({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{x: number, y: number}>({ x: 0, y: 0 });

  const handleMouseDown = (event: React.MouseEvent) => {
    setIsDragging(true);
    dragStartRef.current = {
      x: event.clientX - position.x,
      y: event.clientY - position.y
    };
  };

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (isDragging) {
        const newX = event.clientX - dragStartRef.current.x;
        const newY = event.clientY - dragStartRef.current.y;
        
        const toolbarWidth = toolbarRef.current?.offsetWidth || 100;
        const toolbarHeight = toolbarRef.current?.offsetHeight || 100;
        
        setPosition({
          x: Math.max(0, Math.min(window.innerWidth - toolbarWidth, newX)),
          y: Math.max(0, Math.min(window.innerHeight - toolbarHeight, newY))
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, position]);
  
  return (
    <div 
      ref={toolbarRef}
      className="fixed bg-background/80 backdrop-blur-sm p-2 rounded-md shadow-md cursor-move"
      style={{ 
        left: position.x,
        top: position.y,
        zIndex: 20000,
        isolation: 'isolate',
        userSelect: 'none',
        touchAction: 'none',
      }}
      onMouseDown={handleMouseDown}
    >
      <div className="flex flex-col space-y-2">
        <MapControls 
          onZoomIn={onZoomIn}
          onZoomOut={onZoomOut}
          onReset={onReset}
        />
      </div>
    </div>
  );
};

export default DrawingTools;

