
import { useCallback } from 'react';
import { saveDrawing } from '@/utils/drawing-utils';
import { toast } from 'sonner';
import { setCurrentDrawingContext, processMarkedPaths } from '@/components/map/drawing/LayerAttributeManager';

export function useHandleShapeCreation(
  onCreated: (shape: any) => void,
  onPathsUpdated?: (paths: string[]) => void,
  svgPaths?: string[]
) {
  const handleCreatedWrapper = useCallback((shape: any) => {
    console.log('handleShapeCreated called with shape type:', shape.layerType);
    
    try {
      // Handle different shape types
      if (shape.layerType === 'marker') {
        console.log('Creating marker shape');
        // Handle marker creation if needed
        onCreated(shape);
      } else {
        console.log('Creating polygon shape - no marker creation');
        
        // Save the drawing first - saveDrawing returns void, so we use the shape's existing ID
        try {
          saveDrawing(shape);
          const finalDrawingId = shape.id; // Use the shape's existing ID
          console.log(`Drawing saved with final ID: ${finalDrawingId}`);
          
          // Store the final drawing ID on the layer
          if (shape.layer) {
            (shape.layer as any).drawingId = finalDrawingId;
          }
          
          // Set drawing context with the final ID
          setCurrentDrawingContext(finalDrawingId);
          
          // Apply attributes to any marked paths with the final ID
          setTimeout(() => {
            processMarkedPaths(finalDrawingId);
          }, 100);
          
          // Apply attributes again with a longer delay to ensure DOM is ready
          setTimeout(() => {
            processMarkedPaths(finalDrawingId);
          }, 300);
          
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
