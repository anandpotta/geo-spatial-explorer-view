
import { useState, useEffect } from 'react';
import MapControls from './drawing/MapControls';
import ClearConfirmationDialog from './drawing/ConfirmationDialog';
import ToolbarContainer from './drawing/ToolbarContainer';
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
    
    if (tool === 'polygon') {
      toast.success('Polygon drawing mode enabled! Click on the map to start drawing.', {
        duration: 3000
      });
    } else if (tool === 'rectangle') {
      toast.success('Rectangle drawing mode enabled! Click and drag on the map to draw.', {
        duration: 3000
      });
    } else if (tool === 'circle') {
      toast.success('Circle drawing mode enabled! Click and drag on the map to set the radius.', {
        duration: 3000
      });
    } else if (tool === 'edit') {
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
        
        {/* Drawing tool buttons */}
        <div className="space-y-2">
          <button
            className={`w-full p-2 rounded-md flex items-center justify-center transition-colors ${activeButton === 'polygon' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            onClick={() => handleToolClick('polygon')}
            aria-label="Draw polygon"
          >
            <svg className="w-5 h-5 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 5L12 12L19 5L12 19L5 5Z" />
            </svg>
            <span>Polygon</span>
          </button>
          
          <button
            className={`w-full p-2 rounded-md flex items-center justify-center transition-colors ${activeButton === 'rectangle' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            onClick={() => handleToolClick('rectangle')}
            aria-label="Draw rectangle"
          >
            <svg className="w-5 h-5 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="4" y="4" width="16" height="16" />
            </svg>
            <span>Rectangle</span>
          </button>
          
          <button
            className={`w-full p-2 rounded-md flex items-center justify-center transition-colors ${activeButton === 'circle' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            onClick={() => handleToolClick('circle')}
            aria-label="Draw circle"
          >
            <svg className="w-5 h-5 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="8" />
            </svg>
            <span>Circle</span>
          </button>
          
          <button
            className={`w-full p-2 rounded-md mb-2 flex items-center justify-center transition-colors ${activeButton === 'edit' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            onClick={() => handleToolClick('edit')}
            aria-label="Edit shapes"
          >
            <svg className="w-5 h-5 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            <span>Edit</span>
          </button>
          
          <button
            className="w-full p-2 rounded-md bg-red-500 text-white hover:bg-red-600 transition-colors flex items-center justify-center"
            onClick={() => handleToolClick('clear')}
            aria-label="Clear all layers"
          >
            <svg className="w-5 h-5 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <span>Clear All</span>
          </button>
        </div>
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
