
import { useState, useRef, useEffect } from 'react';
import { Trash2, Edit2 } from 'lucide-react';
import MapControls from './drawing/MapControls';
import { handleClearAll } from './map/drawing/ClearAllHandler';
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
  const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 });
  const [isClearDialogOpen, setIsClearDialogOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
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
      setIsClearDialogOpen(true);
      return;
    }
    
    onToolSelect(tool);
  };

  const processClientClearAll = () => {
    if (!containerRef.current) return;
    
    // Use the enhanced clear all handler from ClearAllHandler
    const featureGroup = window.featureGroup;
    if (featureGroup) {
      handleClearAll({ 
        featureGroup,
        onClearAll: () => {
          // Additional cleanup after clearing
          if (onClearAll) {
            onClearAll();
          }
          
          // Force redraw of the map after a short delay
          setTimeout(() => {
            window.dispatchEvent(new Event('resize'));
          }, 100);
        }
      });
    } else {
      // Fallback if featureGroup is not available - perform direct localStorage clearing
      // Preserve authentication data
      const authState = localStorage.getItem('geospatial_auth_state');
      const users = localStorage.getItem('geospatial_users');
      
      // Clear everything
      localStorage.clear();
      
      // Restore authentication data
      if (authState) {
        localStorage.setItem('geospatial_auth_state', authState);
      }
      if (users) {
        localStorage.setItem('geospatial_users', users);
      }
      
      // Forcefully clear specific storages that might be causing issues
      localStorage.removeItem('savedDrawings');
      localStorage.removeItem('savedMarkers');
      localStorage.removeItem('floorPlans');
      localStorage.removeItem('svgPaths');
      
      // Dispatch events to notify components
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new Event('markersUpdated'));
      window.dispatchEvent(new Event('drawingsUpdated'));
      window.dispatchEvent(new CustomEvent('floorPlanUpdated', { detail: { cleared: true } }));
      
      if (onClearAll) {
        onClearAll();
      }
      
      toast.success('All map data cleared while preserving user accounts');
    }
    
    setIsClearDialogOpen(false);
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
        
        <div className="h-4" />
        
        <button
          className="w-full p-2 my-2 rounded-md bg-blue-500 text-white hover:bg-blue-600 transition-colors flex items-center justify-center"
          onClick={() => handleToolClick('edit')}
          aria-label="Edit existing shapes"
        >
          <Edit2 className="h-5 w-5" />
          <span className="ml-2">Edit Shapes</span>
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

      <AlertDialog open={isClearDialogOpen} onOpenChange={setIsClearDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear All Layers</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to clear all drawings and markers? User accounts will be preserved, but all other data will be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={processClientClearAll}>Clear All</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default DrawingTools;
