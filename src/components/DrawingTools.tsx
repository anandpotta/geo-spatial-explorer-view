
import { useState, useRef, useEffect } from 'react';
import { Trash2, Edit, Square, Circle, Polyline } from 'lucide-react';
import MapControls from './drawing/MapControls';
import { useClearAllOperation } from '@/hooks/useClearAllOperation';

interface Position {
  x: number;
  y: number;
}

interface DrawingToolsProps {
  onToolSelect: (tool: string) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  onClearAll?: () => void;
}

const DrawingTools = ({ 
  onToolSelect, 
  onZoomIn, 
  onZoomOut, 
  onReset,
  onClearAll
}: DrawingToolsProps) => {
  const [position, setPosition] = useState<Position>({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 });
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { handleClearAllWrapper, ClearAllConfirmDialog } = useClearAllOperation(onClearAll);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      
      const newX = Math.max(0, Math.min(window.innerWidth - (containerRef.current?.offsetWidth || 0), e.clientX - dragOffset.x));
      const newY = Math.max(0, Math.min(window.innerHeight - (containerRef.current?.offsetHeight || 0), e.clientY - dragOffset.y));
      
      setPosition({ x: newX, y: newY });
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
  }, [isDragging, dragOffset]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    setIsDragging(true);
    e.preventDefault();
  };

  const handleToolClick = (tool: string) => {
    if (tool === 'clear') {
      handleClearAllWrapper();
      return;
    }
    
    setActiveTool(tool === activeTool ? null : tool);
    onToolSelect(tool);
  };

  return (
    <>
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
        onMouseDown={handleMouseDown}
      >
        <MapControls 
          onZoomIn={onZoomIn}
          onZoomOut={onZoomOut}
          onReset={onReset}
        />
        
        <div className="flex flex-col gap-2 mt-4">
          <div className="grid grid-cols-3 gap-1">
            <button
              className={`p-2 rounded-md bg-blue-100 hover:bg-blue-200 transition-colors flex items-center justify-center ${activeTool === 'polygon' ? 'bg-blue-300' : ''}`}
              onClick={() => handleToolClick('polygon')}
              aria-label="Draw polygon"
            >
              <Polyline className="h-5 w-5 text-blue-600" />
            </button>
            <button
              className={`p-2 rounded-md bg-blue-100 hover:bg-blue-200 transition-colors flex items-center justify-center ${activeTool === 'rectangle' ? 'bg-blue-300' : ''}`}
              onClick={() => handleToolClick('rectangle')}
              aria-label="Draw rectangle"
            >
              <Square className="h-5 w-5 text-blue-600" />
            </button>
            <button
              className={`p-2 rounded-md bg-blue-100 hover:bg-blue-200 transition-colors flex items-center justify-center ${activeTool === 'circle' ? 'bg-blue-300' : ''}`}
              onClick={() => handleToolClick('circle')}
              aria-label="Draw circle"
            >
              <Circle className="h-5 w-5 text-blue-600" />
            </button>
          </div>
          
          <button
            className={`p-2 rounded-md bg-amber-100 hover:bg-amber-200 transition-colors flex items-center justify-center ${activeTool === 'edit' ? 'bg-amber-300' : ''}`}
            onClick={() => handleToolClick('edit')}
            aria-label="Edit shapes"
          >
            <Edit className="h-5 w-5 text-amber-600" />
            <span className="ml-2">Edit</span>
          </button>
          
          <button
            className="w-full p-2 rounded-md bg-red-500 text-white hover:bg-red-600 transition-colors flex items-center justify-center"
            onClick={() => handleToolClick('clear')}
            aria-label="Clear all layers"
          >
            <Trash2 className="h-5 w-5" />
            <span className="ml-2">Clear All</span>
          </button>
        </div>
      </div>

      <ClearAllConfirmDialog />
    </>
  );
};

export default DrawingTools;
