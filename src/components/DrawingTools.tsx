import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import DrawingToolButton from './drawing/DrawingToolButton';
import MapControls from './drawing/MapControls';
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
  const [position, setPosition] = useState<Position>({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [isClearDialogOpen, setIsClearDialogOpen] = useState(false);
  
  const handleToolClick = (tool: string) => {
    if (tool === 'clear') {
      setIsClearDialogOpen(true);
      return;
    }
    onToolSelect(tool);
  };

  const handleClearAll = () => {
    const markers = getSavedMarkers();
    const drawings = getSavedDrawings();

    markers.forEach(marker => {
      deleteMarker(marker.id);
    });

    drawings.forEach(drawing => {
      deleteDrawing(drawing.id);
    });

    localStorage.removeItem('savedMarkers');
    localStorage.removeItem('savedDrawings');

    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new Event('markersUpdated'));
    
    if (onClearAll) {
      onClearAll();
    }
    
    setIsClearDialogOpen(false);
    toast.success('All layers cleared');
  };

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
    <>
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
