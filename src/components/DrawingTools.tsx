import { useState, useRef, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import DrawingToolButton from './drawing/DrawingToolButton';
import MapControls from './drawing/MapControls';
import ShapeTools from './drawing/ShapeTools';
import { deleteMarker, getSavedMarkers } from '@/utils/marker-utils';
import { deleteDrawing, getSavedDrawings } from '@/utils/drawing-utils';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

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
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [position, setPosition] = useState<Position>({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 });
  const [isClearDialogOpen, setIsClearDialogOpen] = useState(false);
  const toolbarRef = useRef<HTMLDivElement>(null);
  
  const handleToolClick = (tool: string) => {
    if (tool === 'clear') {
      setIsClearDialogOpen(true);
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
    
    setIsClearDialogOpen(false);
    toast.success('All layers cleared');
  };

  const handleMouseDown = (event: React.MouseEvent) => {
    if (!toolbarRef.current) return;
    
    const rect = toolbarRef.current.getBoundingClientRect();
    setDragOffset({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    });
    setIsDragging(true);
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    if (!isDragging) return;
    
    const newX = event.clientX - dragOffset.x;
    const newY = event.clientY - dragOffset.y;
    
    // Calculate boundaries to keep toolbar within window
    const maxX = window.innerWidth - (toolbarRef.current?.offsetWidth || 0);
    const maxY = window.innerHeight - (toolbarRef.current?.offsetHeight || 0);
    
    setPosition({
      x: Math.max(0, Math.min(maxX, newX)),
      y: Math.max(0, Math.min(maxY, newY))
    });
  };

  useEffect(() => {
    const handleMouseUp = () => {
      setIsDragging(false);
    };

    const handleGlobalMouseMove = (event: MouseEvent) => {
      if (!isDragging) return;
      
      const newX = event.clientX - dragOffset.x;
      const newY = event.clientY - dragOffset.y;
      
      const maxX = window.innerWidth - (toolbarRef.current?.offsetWidth || 0);
      const maxY = window.innerHeight - (toolbarRef.current?.offsetHeight || 0);
      
      setPosition({
        x: Math.max(0, Math.min(maxX, newX)),
        y: Math.max(0, Math.min(maxY, newY))
      });
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleGlobalMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  return (
    <>
      <div 
        ref={toolbarRef}
        className="fixed bg-background/80 backdrop-blur-sm p-2 rounded-md shadow-md cursor-move select-none"
        style={{ 
          left: `${position.x}px`,
          top: `${position.y}px`,
          zIndex: 20000,
          transition: isDragging ? 'none' : 'all 0.2s ease',
          transform: 'translate3d(0,0,0)',
          willChange: isDragging ? 'transform' : 'auto',
          touchAction: 'none'
        }}
        onMouseDown={handleMouseDown}
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

      <AlertDialog open={isClearDialogOpen} onOpenChange={setIsClearDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear All Layers</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to clear all drawings and markers? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleClearAll}>Clear All</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default DrawingTools;
