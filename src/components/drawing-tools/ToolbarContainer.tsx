
import { forwardRef, ForwardedRef } from 'react';

interface Position {
  x: number;
  y: number;
}

interface ToolbarContainerProps {
  children: React.ReactNode;
  position: Position;
  onMouseDown: (e: React.MouseEvent) => void;
}

const ToolbarContainer = forwardRef<HTMLDivElement, ToolbarContainerProps>(
  ({ children, position, onMouseDown }, ref) => {
    return (
      <div 
        ref={ref}
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
  }
);

ToolbarContainer.displayName = 'ToolbarContainer';

export default ToolbarContainer;
