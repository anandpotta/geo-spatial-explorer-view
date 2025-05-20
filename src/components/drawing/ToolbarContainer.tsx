
import React, { useRef } from 'react';

interface Position {
  x: number;
  y: number;
}

interface ToolbarContainerProps {
  position: Position;
  isDragging: boolean;
  dragOffset: Position;
  onMouseDown: (e: React.MouseEvent) => void;
  children: React.ReactNode;
}

const ToolbarContainer: React.FC<ToolbarContainerProps> = ({
  position,
  onMouseDown,
  children
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div 
      ref={containerRef}
      className="fixed bg-background/80 backdrop-blur-sm p-2 rounded-md shadow-md cursor-move select-none transition-shadow hover:shadow-lg active:shadow-md"
      style={{ 
        left: position.x,
        top: position.y,
        zIndex: 20000,
        isolation: 'isolate',
        touchAction: 'none'
      }}
      onMouseDown={onMouseDown}
    >
      {children}
    </div>
  );
};

export default ToolbarContainer;
