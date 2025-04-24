
import { useRef, useState } from 'react';
import { Trash2 } from 'lucide-react';
import DrawingToolButton from './drawing/DrawingToolButton';
import MapControls from './drawing/MapControls';
import ShapeTools from './drawing/ShapeTools';
import { deleteMarker, getSavedMarkers } from '@/utils/marker-utils';
import { deleteDrawing, getSavedDrawings } from '@/utils/drawing-utils';
import { toast } from 'sonner';
import { DragToolbarProvider, useDragToolbar } from '@/contexts/DragToolbarContext';
import { useDragHandler } from '@/hooks/useDragHandler';
import ClearAllDialog from './drawing/ClearAllDialog';

interface DrawingToolsProps {
  onToolSelect: (tool: string) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  onClearAll?: () => void;
}

const DrawingToolsContent = ({ 
  onToolSelect, 
  onZoomIn, 
  onZoomOut, 
  onReset,
  onClearAll
}: DrawingToolsProps) => {
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [isClearDialogOpen, setIsClearDialogOpen] = useState(false);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const { position, isDragging } = useDragToolbar();
  const { handleMouseDown } = useDragHandler(toolbarRef);
  
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

      <ClearAllDialog
        isOpen={isClearDialogOpen}
        onOpenChange={setIsClearDialogOpen}
        onClearAll={handleClearAll}
      />
    </>
  );
};

const DrawingTools = (props: DrawingToolsProps) => {
  return (
    <DragToolbarProvider>
      <DrawingToolsContent {...props} />
    </DragToolbarProvider>
  );
};

export default DrawingTools;
