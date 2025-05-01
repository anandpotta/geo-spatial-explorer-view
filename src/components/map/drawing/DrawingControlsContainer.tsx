
import { DrawingData } from '@/utils/drawing-utils';
import DrawingControls from '../DrawingControls';
import { forwardRef, useImperativeHandle, useRef, useState, useEffect } from 'react';
import { toast } from 'sonner';
import { DrawingControlsRef } from '@/hooks/useDrawingControls';
import { applyImageClipMask, findSvgPathByDrawingId } from '@/utils/svg-clip-mask';
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

  // Listen for floorPlanUpdated events to attempt reapplying clipmasks
  useEffect(() => {
    const handleFloorPlanUpdated = (event: CustomEvent) => {
      const { drawingId } = event.detail;
      if (drawingId) {
        // Wait for DOM to update
        setTimeout(() => {
          const floorPlans = JSON.parse(localStorage.getItem('floorPlans') || '{}');
          const floorPlan = floorPlans[drawingId];
          
          if (floorPlan && floorPlan.data) {
            const pathElement = findSvgPathByDrawingId(drawingId);
            if (pathElement) {
              applyImageClipMask(pathElement, floorPlan.data, drawingId);
            }
          }
        }, 500);
      }
    };

    window.addEventListener('floorPlanUpdated', handleFloorPlanUpdated as EventListener);
    
    return () => {
      window.removeEventListener('floorPlanUpdated', handleFloorPlanUpdated as EventListener);
    };
  }, []);
  
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
        
        // Apply the image as a clip mask to the SVG path with multiple attempts
        let attempts = 0;
        const maxAttempts = 10;
        
        const tryApplyMask = () => {
          try {
            const pathElement = findSvgPathByDrawingId(drawingId);
            if (pathElement) {
              console.log(`Found path element for drawing ${drawingId}, applying clip mask (attempt ${attempts + 1})`);
              debugSvgElement(pathElement, `Before applying clip mask to ${drawingId}`);
              
              const result = applyImageClipMask(
                pathElement, 
                e.target.result as string, 
                drawingId
              );
              
              if (result) {
                console.log(`Successfully applied clip mask for ${file.name}`);
                debugSvgElement(pathElement, `After applying clip mask to ${drawingId}`);
                toast.success(`${file.name} applied to drawing`);
                
                // Force redraw
                setTimeout(() => {
                  window.dispatchEvent(new Event('resize'));
                }, 50);
              } else if (attempts < maxAttempts) {
                attempts++;
                console.log(`Failed to apply mask, retrying (${attempts}/${maxAttempts})...`);
                setTimeout(tryApplyMask, 300 * attempts);
              } else {
                console.error('Could not apply image to drawing after multiple attempts');
                toast.error('Could not apply image to drawing');
              }
            } else if (attempts < maxAttempts) {
              attempts++;
              console.log(`Path element not found, retrying (${attempts}/${maxAttempts})...`);
              setTimeout(tryApplyMask, 300 * attempts);
            } else {
              console.error('Path element not found for ID after multiple attempts:', drawingId);
              toast.error('Could not find the drawing on the map');
            }
          } catch (err) {
            console.error('Error applying image to path:', err);
            if (attempts < maxAttempts) {
              attempts++;
              setTimeout(tryApplyMask, 300 * attempts);
            } else {
              toast.error('Failed to apply image to drawing');
            }
          }
        };
        
        // Start the retry process
        setTimeout(tryApplyMask, 100);
        
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
