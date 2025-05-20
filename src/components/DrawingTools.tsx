import { useState, useEffect } from 'react';
import MapControls from './drawing/MapControls';
import ClearConfirmationDialog from './drawing/ConfirmationDialog';
import ToolbarContainer from './drawing/ToolbarContainer';
import ToolButtons from './drawing/ToolButtons';
import { toast } from 'sonner';
import { preserveAuthData } from '@/utils/clear-operations';

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
  const [activeButton, setActiveButton] = useState<string | null>(null);
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      
      const newX = Math.max(0, Math.min(window.innerWidth - 200, e.clientX - dragOffset.x));
      const newY = Math.max(0, Math.min(window.innerHeight - 200, e.clientY - dragOffset.y));
      
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
    const rect = e.currentTarget.getBoundingClientRect();
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
    
    // Toggle active button
    setActiveButton(prev => tool === prev ? null : tool);
    onToolSelect(tool);
    
    if (tool === 'edit') {
      // Show info about edit mode to guide the user
      toast.success('Edit mode enabled! Click on any shape to modify it.', {
        duration: 3000
      });
    }
  };

  const processClientClearAll = () => {
    // Use the enhanced clear all handler from ClearAllHandler
    const featureGroup = (window as any).featureGroup;
    if (featureGroup) {
      // Call the passed in onClearAll prop
      if (onClearAll) {
        onClearAll();
      }
      
      // Force redraw of the map after a short delay
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 100);
    } else {
      // Fallback if featureGroup is not available - perform direct localStorage clearing
      // Preserve authentication data and get restore function
      const restoreAuth = preserveAuthData();
      
      // Clear everything
      localStorage.clear();
      
      // Restore authentication data
      restoreAuth();
      
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
      <ToolbarContainer 
        position={position}
        isDragging={isDragging}
        dragOffset={dragOffset}
        onMouseDown={handleMouseDown}
      >
        <MapControls 
          onZoomIn={onZoomIn}
          onZoomOut={onZoomOut}
          onReset={onReset}
        />
        
        <div className="h-4" />
        
        <ToolButtons 
          activeButton={activeButton}
          onToolClick={handleToolClick}
        />
      </ToolbarContainer>

      <ClearConfirmationDialog 
        isOpen={isClearDialogOpen} 
        onConfirm={processClientClearAll}
        onCancel={() => setIsClearDialogOpen(false)}
      />
    </>
  );
};

export default DrawingTools;
