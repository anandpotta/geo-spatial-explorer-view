import { DrawingData } from '@/utils/drawing';
import DrawingControls from '../DrawingControls';
import { forwardRef, useImperativeHandle, useRef } from 'react';

interface DrawingControlsContainerProps {
  onShapeCreated: (shape: any) => void;
  activeTool: string | null;
  onRegionClick: (drawing: DrawingData) => void;
  onClearAll?: () => void;
}

const DrawingControlsContainer = forwardRef(({
  onShapeCreated,
  activeTool,
  onRegionClick,
  onClearAll
}: DrawingControlsContainerProps, ref) => {
  const drawingControlsRef = useRef(null);
  
  useImperativeHandle(ref, () => ({
    ...drawingControlsRef.current
  }));
  
  return (
    <DrawingControls 
      ref={drawingControlsRef}
      onCreated={onShapeCreated}
      activeTool={activeTool}
      onRegionClick={onRegionClick}
      onClearAll={onClearAll}
    />
  );
});

DrawingControlsContainer.displayName = 'DrawingControlsContainer';

export default DrawingControlsContainer;
