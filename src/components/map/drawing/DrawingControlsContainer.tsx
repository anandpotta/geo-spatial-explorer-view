
import { DrawingData } from '@/utils/drawing-utils';
import DrawingControls from '../DrawingControls';
import { forwardRef, useImperativeHandle, useRef } from 'react';
import { toast } from 'sonner';
import { DrawingControlsRef } from '@/hooks/useDrawingControls';
import { saveFloorPlan } from '@/utils/floor-plan-utils';
import { getLeafletLayerPath } from '@/utils/svg-path-utils';

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
  
  useImperativeHandle(ref, () => ({
    getFeatureGroup: () => {
      return drawingControlsRef.current?.getFeatureGroup() as L.FeatureGroup;
    },
    getDrawTools: () => {
      return drawingControlsRef.current?.getDrawTools();
    },
    activateEditMode: () => {
      return drawingControlsRef.current?.activateEditMode() ?? false;
    },
    openFileUploadDialog: (drawingId: string) => {
      drawingControlsRef.current?.openFileUploadDialog(drawingId);
    }
  }));
  
  const handleUploadToDrawing = (drawingId: string, file: File) => {
    // Handle file upload logic here
    const fileType = file.type;
    
    // Check file type and size
    if (!fileType.startsWith('image/') && fileType !== 'application/pdf') {
      toast.error('Please upload an image or PDF file');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast.error('File size should be less than 5MB');
      return;
    }
    
    // Convert the file to base64 string
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target && e.target.result) {
        // Get the path data for clipping
        let pathData = "";
        const layer = drawingControlsRef.current?.getFeatureGroup()?.getLayers().find((l) => (l as any).drawingId === drawingId);
        
        if (layer) {
          try {
            // Try to get SVG path from layer using our utility function
            pathData = getLeafletLayerPath(layer) || "";
          } catch (err) {
            console.error('Error getting path data:', err);
          }
        }
        
        // Save the file data to localStorage with path info for clipping
        saveFloorPlan(
          drawingId,
          e.target.result as string,
          fileType === 'application/pdf',
          file.name,
          pathData
        );
        
        // Trigger a custom event to notify components that a floor plan was uploaded
        window.dispatchEvent(new CustomEvent('floorPlanUpdated', { detail: { drawingId } }));
        
        toast.success(`${file.name} uploaded successfully`);
      }
    };
    
    reader.onerror = () => {
      toast.error('Failed to read the file');
    };
    
    reader.readAsDataURL(file);
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
    />
  );
});

DrawingControlsContainer.displayName = 'DrawingControlsContainer';

export default DrawingControlsContainer;
