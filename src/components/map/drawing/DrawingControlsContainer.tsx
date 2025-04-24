
import { useRef } from 'react';
import { DrawingData } from '@/utils/drawing-utils';
import DrawingControls from '../DrawingControls';

interface DrawingControlsContainerProps {
  onShapeCreated: (shape: any) => void;
  activeTool: string | null;
  onRegionClick: (drawing: DrawingData) => void;
  onClearAll?: () => void;
}

const DrawingControlsContainer = ({
  onShapeCreated,
  activeTool,
  onRegionClick,
  onClearAll
}: DrawingControlsContainerProps) => {
  // Use useRef for references that React will pass to children
  const drawingControlsRef = useRef(null);
  
  return (
    <DrawingControls 
      ref={drawingControlsRef}
      onCreated={onShapeCreated}
      activeTool={activeTool}
      onRegionClick={onRegionClick}
      onClearAll={onClearAll}
    />
  );
};

export default DrawingControlsContainer;
