
import { useState, useRef } from 'react';
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
