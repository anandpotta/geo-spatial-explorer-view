
import { DrawingData } from '@/utils/drawing-utils';
import DrawingControls from '../DrawingControls';
import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { toast } from 'sonner';
import { DrawingControlsRef } from '@/hooks/useDrawingControls';
import { applyImageClipMask } from '@/utils/svg-utils';

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
  
  useImperativeHandle(ref, () => ({
    getFeatureGroup: () => {
      return drawingControlsRef.current?.getFeatureGroup() as L.FeatureGroup;
    },
    getDrawTools: () => {
      return drawingControlsRef.current?.getDrawTools();
    },
    activateEditMode: () => {
      // Make sure we return a boolean
      return drawingControlsRef.current?.activateEditMode() || false;
    },
    openFileUploadDialog: (drawingId: string) => {
      drawingControlsRef.current?.openFileUploadDialog(drawingId);
    },
    getSvgPaths: () => {
      return drawingControlsRef.current?.getSvgPaths() || [];
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
        // Save the file data to localStorage
        const floorPlans = JSON.parse(localStorage.getItem('floorPlans') || '{}');
        floorPlans[drawingId] = {
          data: e.target.result,
          name: file.name,
          type: file.type,
          uploaded: new Date().toISOString()
        };
        
        localStorage.setItem('floorPlans', JSON.stringify(floorPlans));
        
        // Apply the image as a clip mask to the SVG path
        setTimeout(() => {
          try {
            const pathElement = document.querySelector(`.leaflet-interactive[data-drawing-id="${drawingId}"]`);
            if (pathElement) {
              applyImageClipMask(
                pathElement as SVGPathElement, 
                e.target.result as string, 
                drawingId
              );
              toast.success(`${file.name} applied to drawing`);
            } else {
              toast.error('Could not find the drawing on the map');
            }
          } catch (err) {
            console.error('Error applying image to path:', err);
            toast.error('Failed to apply image to drawing');
          }
        }, 100);
        
        // Trigger a custom event to notify components that a floor plan was uploaded
        window.dispatchEvent(new CustomEvent('floorPlanUpdated', { detail: { drawingId } }));
      }
    };
    
    reader.onerror = () => {
      toast.error('Failed to read the file');
    };
    
    reader.readAsDataURL(file);
  };
  
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
