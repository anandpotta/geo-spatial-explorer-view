
import { useState, useRef, useEffect } from 'react';
import { MapPin, Square, Circle, Pentagon, MinusSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { LucideIcon } from 'lucide-react';

interface DrawingToolButtonProps {
  icon: LucideIcon;
  label: string;
  isActive?: boolean;
  onClick: () => void;
}

const DrawingToolButton = ({ icon: Icon, label, isActive = false, onClick }: DrawingToolButtonProps) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button 
            variant={isActive ? 'default' : 'outline'} 
            size="icon" 
            onClick={onClick}
            className={`transition-all ${isActive ? 'bg-primary text-primary-foreground shadow-md' : 'hover:bg-accent hover:text-accent-foreground'}`}
          >
            <Icon size={20} />
            <span className="sr-only">{label}</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left">
          <p>{label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

interface DraggableDrawingToolsProps {
  activeTool: string | null;
  onToolSelect: (tool: string) => void;
}

const DraggableDrawingTools = ({ activeTool, onToolSelect }: DraggableDrawingToolsProps) => {
  const [position, setPosition] = useState({ x: 20, y: 80 });
  const [isDragging, setIsDragging] = useState(false);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{x: number, y: number}>({ x: 0, y: 0 });

  const handleMouseDown = (event: React.MouseEvent) => {
    if ((event.target as HTMLElement).tagName === 'DIV') {
      setIsDragging(true);
      dragStartRef.current = {
        x: event.clientX - position.x,
        y: event.clientY - position.y
      };
      event.preventDefault(); // Prevent text selection during drag
    }
  };

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (isDragging) {
        const newX = event.clientX - dragStartRef.current.x;
        const newY = event.clientY - dragStartRef.current.y;
        
        if (toolbarRef.current) {
          const toolbarWidth = toolbarRef.current.offsetWidth;
          const toolbarHeight = toolbarRef.current.offsetHeight;
          
          setPosition({
            x: Math.max(0, Math.min(window.innerWidth - toolbarWidth, newX)),
            y: Math.max(0, Math.min(window.innerHeight - toolbarHeight, newY))
          });
        }
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
  }, [isDragging]);

  return (
    <div 
      ref={toolbarRef}
      className="fixed bg-background/90 backdrop-blur-sm p-2 rounded-md shadow-md cursor-move z-[1000]"
      style={{ 
        left: position.x,
        top: position.y,
        touchAction: 'none',
        boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
        border: '1px solid rgba(0,0,0,0.1)'
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={(e) => {
        const touch = e.touches[0];
        setIsDragging(true);
        dragStartRef.current = {
          x: touch.clientX - position.x,
          y: touch.clientY - position.y
        };
      }}
    >
      <div className="flex flex-col gap-2 select-none">
        <div className="text-xs opacity-70 pb-1 text-center">Drawing Tools</div>
        <DrawingToolButton
          icon={MapPin}
          label="Add Marker"
          isActive={activeTool === 'marker'}
          onClick={() => onToolSelect('marker')}
        />
        <DrawingToolButton
          icon={MinusSquare}
          label="Draw Line"
          isActive={activeTool === 'polyline'}
          onClick={() => onToolSelect('polyline')}
        />
        <DrawingToolButton
          icon={Pentagon}
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
    </div>
  );
};

export default DraggableDrawingTools;
