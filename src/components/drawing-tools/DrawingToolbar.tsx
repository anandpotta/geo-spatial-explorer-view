
import { useState, useRef, useEffect } from 'react';
import { Trash2, Edit3, Image } from 'lucide-react';
import { toast } from 'sonner';
import { useToolbarPosition } from './hooks/useToolbarPosition';
import ToolbarContainer from './ToolbarContainer';
import MapControlsGroup from './MapControlsGroup';
import ClearAllButton from './ClearAllButton';
import EditLayersButton from './EditLayersButton';
import ImageControlStatus from './ImageControlStatus';

interface DrawingToolbarProps {
  onToolSelect: (tool: string) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  onClearAll?: () => void;
}

const DrawingToolbar = ({ 
  onToolSelect, 
  onZoomIn, 
  onZoomOut, 
  onReset,
  onClearAll
}: DrawingToolbarProps) => {
  const [isEditActive, setIsEditActive] = useState(false);
  const { 
    position, 
    containerRef, 
    handleMouseDown 
  } = useToolbarPosition();
  
  // Handle custom event to set edit mode active
  useEffect(() => {
    const handleSetEditActive = () => {
      if (!isEditActive) {
        console.log("Setting edit mode active from custom event");
        setIsEditActive(true);
        onToolSelect('edit');
      }
    };
    
    window.addEventListener('set-edit-active', handleSetEditActive);
    
    return () => {
      window.removeEventListener('set-edit-active', handleSetEditActive);
    };
  }, [isEditActive, onToolSelect]);
  
  // Check floor plans on load and when storage changes
  useEffect(() => {
    const checkFloorPlans = () => {
      try {
        const floorPlans = JSON.parse(localStorage.getItem('floorPlans') || '{}');
        if (Object.keys(floorPlans).length > 0 && !isEditActive) {
          console.log("Setting edit mode active due to existing floor plans");
          setIsEditActive(true);
          onToolSelect('edit');
        }
      } catch (e) {
        console.error("Error checking floor plans:", e);
      }
    };
    
    window.addEventListener('storage', checkFloorPlans);
    
    // Check on initial load
    checkFloorPlans();
    
    return () => {
      window.removeEventListener('storage', checkFloorPlans);
    };
  }, [isEditActive, onToolSelect]);

  const handleToolClick = (tool: string) => {
    if (tool === 'edit') {
      setIsEditActive(!isEditActive);
    }
    
    onToolSelect(tool);
  };

  return (
    <ToolbarContainer
      ref={containerRef}
      position={position}
      onMouseDown={handleMouseDown}
    >
      <MapControlsGroup 
        onZoomIn={onZoomIn}
        onZoomOut={onZoomOut}
        onReset={onReset}
      />
      
      <div className="h-4" />
      
      <ClearAllButton onClearAll={onClearAll} />
      
      <div className="h-4" />
      
      <EditLayersButton 
        isActive={isEditActive}
        onClick={() => handleToolClick('edit')}
      />
      
      <ImageControlStatus />
    </ToolbarContainer>
  );
};

export default DrawingToolbar;
