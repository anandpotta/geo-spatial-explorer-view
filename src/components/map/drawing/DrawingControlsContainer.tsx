
import { DrawingData } from '@/utils/drawing-utils';
import DrawingControls from '../DrawingControls';
import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { toast } from 'sonner';
import { DrawingControlsRef } from '@/hooks/useDrawingControls';
import { applyImageClipMask } from '@/utils/svg-utils';
import { debugSvgElement } from '@/utils/svg-debug-utils';

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
    console.log(`Processing upload for drawing ${drawingId}, file: ${file.name}`);
    
    // Handle file upload logic here
    const fileType = file.type;
    
    // Check file type and size
    if (!fileType.startsWith('image/') && fileType !== 'application/pdf') {
      toast.error('Please upload an image or PDF file');
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast.error('File size should be less than 10MB');
      return;
    }
    
    // Convert the file to base64 string
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target && e.target.result) {
        console.log(`File read complete for ${file.name}`);
        
        // Save the file data to localStorage
        const floorPlans = JSON.parse(localStorage.getItem('floorPlans') || '{}');
        floorPlans[drawingId] = {
          data: e.target.result,
          name: file.name,
          type: file.type,
          uploaded: new Date().toISOString()
        };
        
        localStorage.setItem('floorPlans', JSON.stringify(floorPlans));
        console.log(`Saved floor plan to localStorage for drawing ${drawingId}`);
        
        // Apply the image as a clip mask to the SVG path
        setTimeout(() => {
          try {
            const pathElement = document.querySelector(`.leaflet-interactive[data-drawing-id="${drawingId}"]`);
            if (pathElement) {
              console.log(`Found path element for drawing ${drawingId}, applying clip mask`);
              debugSvgElement(pathElement as SVGElement, `Before applying clip mask to ${drawingId}`);
              
              const result = applyImageClipMask(
                pathElement as SVGPathElement, 
                e.target.result as string, 
                drawingId
              );
              
              if (result) {
                console.log(`Successfully applied clip mask for ${file.name}`);
                debugSvgElement(pathElement as SVGElement, `After applying clip mask to ${drawingId}`);
                toast.success(`${file.name} applied to drawing`);
              } else {
                console.error('Could not apply image to drawing');
                toast.error('Could not apply image to drawing');
              }
            } else {
              console.error('Path element not found for ID:', drawingId);
              toast.error('Could not find the drawing on the map');
            }
          } catch (err) {
            console.error('Error applying image to path:', err);
            toast.error('Failed to apply image to drawing');
          }
        }, 500);
        
        // Trigger a custom event to notify components that a floor plan was uploaded
        window.dispatchEvent(new CustomEvent('floorPlanUpdated', { detail: { drawingId } }));
      }
    };
    
    reader.onerror = () => {
      console.error('Error reading file');
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
