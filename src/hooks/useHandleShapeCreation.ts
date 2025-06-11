
import { useCallback } from 'react';
import { saveDrawing } from '@/utils/drawing-utils';
import { toast } from 'sonner';
import { setCurrentDrawingContext, applyDrawingIdToMarkedPaths } from '@/components/map/drawing/LayerAttributeManager';

export function useHandleShapeCreation(
  onCreated: (shape: any) => void,
  onPathsUpdated?: (paths: string[]) => void,
  svgPaths?: string[]
) {
  const handleCreatedWrapper = useCallback((shape: any) => {
    console.log('handleShapeCreated called with shape type:', shape.layerType);
    
    try {
      // Set drawing context immediately when shape is created
      const drawingId = shape.layer?.drawingId || `drawing-${Date.now()}`;
      console.log(`Setting drawing context for new shape: ${drawingId}`);
      
      // Set the context before any processing
      setCurrentDrawingContext(drawingId);
      
      // Store the drawing ID on the layer
      if (shape.layer) {
        (shape.layer as any).drawingId = drawingId;
      }
      
      // Apply attributes to any marked paths immediately
      setTimeout(() => {
        applyDrawingIdToMarkedPaths(drawingId);
      }, 100);
      
      // Handle different shape types
      if (shape.layerType === 'marker') {
        console.log('Creating marker shape');
        // Handle marker creation if needed
        onCreated(shape);
      } else {
        console.log('Creating polygon shape - no marker creation');
        
        // Save the drawing and get the result
        try {
          const drawingData = saveDrawing(shape);
          
          if (drawingData && typeof drawingData === 'object' && 'id' in drawingData) {
            // Apply attributes again with the actual drawing ID
            setTimeout(() => {
              applyDrawingIdToMarkedPaths(drawingData.id);
            }, 200);
          }
        } catch (saveError) {
          console.error('Error saving drawing:', saveError);
        }
        
        onCreated(shape);
      }
      
      // Update SVG paths if callback provided
      if (onPathsUpdated && svgPaths) {
        onPathsUpdated(svgPaths);
      }
      
    } catch (error) {
      console.error('Error in handleCreatedWrapper:', error);
      toast.error('Failed to create shape');
    }
  }, [onCreated, onPathsUpdated, svgPaths]);

  return { handleCreatedWrapper };
}
