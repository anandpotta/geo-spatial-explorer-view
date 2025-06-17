
import { useCallback } from 'react';
import { saveDrawing, getSavedDrawings } from '@/utils/drawing-utils';
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
        
        // Save the drawing first to get the actual saved drawing with UUID
        try {
          saveDrawing(shape);
          
          // Get the actual saved drawing by finding the most recently saved one
          // that matches our shape's coordinates
          const savedDrawings = getSavedDrawings();
          const latestDrawing = savedDrawings[savedDrawings.length - 1];
          
          if (latestDrawing && latestDrawing.id) {
            const finalDrawingId = latestDrawing.id;
            console.log(`Drawing saved with final UUID: ${finalDrawingId}`);
            console.log(`Original shape ID was: ${shape.id}`);
            
            // Store the final drawing ID on the layer
            if (shape.layer) {
              (shape.layer as any).drawingId = finalDrawingId;
            }
            
            // Set drawing context with the final UUID
            setCurrentDrawingContext(finalDrawingId);
            
            // Apply attributes to any marked paths with the final UUID
            setTimeout(() => {
              processMarkedPaths(finalDrawingId);
            }, 100);
            
            // Apply attributes again with a longer delay to ensure DOM is ready
            setTimeout(() => {
              processMarkedPaths(finalDrawingId);
            }, 300);
          } else {
            console.error('Could not find saved drawing with UUID');
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
