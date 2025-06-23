
// Simplified hook for library distribution - no external dependencies
export function useHandleShapeCreation(
  onCreated: (shape: any) => void,
  onPathsUpdated?: (paths: string[]) => void,
  svgPaths?: string[]
) {
  const handleCreatedWrapper = (shape: any) => {
    console.log('handleShapeCreated called with shape type:', shape.layerType);
    
    try {
      // Handle different shape types
      if (shape.layerType === 'marker') {
        console.log('Creating marker shape');
        onCreated(shape);
      } else {
        console.log('Creating polygon shape');
        
        // Generate a simple ID for the shape
        const shapeId = shape.id || crypto.randomUUID();
        shape.id = shapeId;
        
        // Store the drawing ID on the layer if available
        if (shape.layer) {
          (shape.layer as any).drawingId = shapeId;
        }
        
        // Call onCreated callback
        onCreated(shape);
        
        // Dispatch custom event for consuming application to handle
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('geoShapeCreated', { 
            detail: { shape, shapeId }
          }));
        }
      }
      
      // Update SVG paths if callback provided
      if (onPathsUpdated && svgPaths) {
        onPathsUpdated(svgPaths);
      }
      
    } catch (error) {
      console.error('Error in handleCreatedWrapper:', error);
    }
  };

  return { handleCreatedWrapper };
}
