
import { DrawingData } from '@/utils/drawing-utils';
import DrawingControls from '../DrawingControls';
import { forwardRef, useImperativeHandle, useRef, useState, useEffect } from 'react';
import { DrawingControlsRef } from '@/hooks/useDrawingControls';
import { useClipMaskManagement } from '@/hooks/useClipMaskManagement';
import { useFileUploadHandler } from './file-upload/FileUploadHandler';

interface DrawingControlsContainerProps {
  onShapeCreated: (shape: any) => void;
  activeTool: string | null;
  onRegionClick: (drawing: DrawingData) => void;
  onClearAll?: () => void;
  onRemoveShape?: (drawingId: string) => void;
}

const DrawingControlsContainer = forwardRef<DrawingControlsRef, DrawingControlsContainerProps>(({
  onShapeCreated,
  activeTool,
  onRegionClick,
  onClearAll,
  onRemoveShape
}: DrawingControlsContainerProps, ref) => {
  const drawingControlsRef = useRef<DrawingControlsRef>(null);
  const [svgPaths, setSvgPaths] = useState<string[]>([]);
  
  // Custom hooks
  const { 
    reapplyTriggered, 
    setReapplyTriggered, 
    setupEventListeners, 
    reapplyAllClipMasks 
  } = useClipMaskManagement();

  const { handleUploadToDrawing } = useFileUploadHandler({
    onFloorPlanUpdated: (drawingId) => {
      // Dispatch the event that our clip mask management system listens for
      window.dispatchEvent(new CustomEvent('floorPlanUpdated', { 
        detail: { drawingId } 
      }));
    }
  });
  
  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    getFeatureGroup: () => {
      return drawingControlsRef.current?.getFeatureGroup() as L.FeatureGroup;
    },
    getDrawTools: () => {
      return drawingControlsRef.current?.getDrawTools();
    },
    openFileUploadDialog: (drawingId: string) => {
      drawingControlsRef.current?.openFileUploadDialog(drawingId);
    },
    getSvgPaths: () => {
      return drawingControlsRef.current?.getSvgPaths() || [];
    }
  }));

  // Set up event listeners
  useEffect(() => {
    const cleanup = setupEventListeners();
    
    // Initial application of clip masks
    setTimeout(() => {
      setReapplyTriggered(prev => !prev);
    }, 1000);
    
    return cleanup;
  }, []);
  
  // Effect to reapply all clip masks when needed
  useEffect(() => {
    // This will run when reapplyTriggered changes (on page visibility or component mount)
    // Small delay to ensure DOM is ready
    const timer = setTimeout(reapplyAllClipMasks, 500);
    return () => clearTimeout(timer);
  }, [reapplyTriggered]);
  
  const handlePathsUpdated = (paths: string[]) => {
    setSvgPaths(paths);
    console.log('SVG Paths updated:', paths);
  };
  
  return (
    <DrawingControls 
      ref={drawingControlsRef}
      onCreated={onShapeCreated}
      activeTool={activeTool}
      onRegionClick={onRegionClick}
      onClearAll={onClearAll}
      onRemoveShape={onRemoveShape}
      onUploadToDrawing={handleUploadToDrawing}
      onPathsUpdated={handlePathsUpdated}
    />
  );
});

DrawingControlsContainer.displayName = 'DrawingControlsContainer';

export default DrawingControlsContainer;
