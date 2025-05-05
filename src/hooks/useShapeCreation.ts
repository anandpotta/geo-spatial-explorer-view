
import { toast } from 'sonner';

export function useShapeCreation(onCreated: (shape: any) => void) {
  const handleCreated = (e: any) => {
    const layer = e.layer;
    
    if (!layer) {
      console.error('No layer in created event');
      return;
    }
    
    try {
      // Extract GeoJSON for saving
      const geoJSON = layer.toGeoJSON();
      
      // Get the SVG path data if available
      let svgPath = null;
      if (layer._path && layer._path.getAttribute) {
        svgPath = layer._path.getAttribute('d');
        
        // Apply visible-path-stroke class to ensure path visibility
        layer._path.classList.add('visible-path-stroke');
        
        // Force a reflow to ensure the browser renders the path
        layer._path.getBoundingClientRect();
      }
      
      // Enhanced path finding for polygon layers
      if (!svgPath && layer.getLatLngs) {
        // For polygon or rectangle layers, try to find the path from the DOM
        setTimeout(() => {
          if (layer._path && layer._path.getAttribute) {
            const updatedPath = layer._path.getAttribute('d');
            if (updatedPath) {
              // Update the layer with the path data
              layer.svgPath = updatedPath;
              
              // Apply visible-path-stroke class to ensure path visibility
              layer._path.classList.add('visible-path-stroke');
              
              // Force a reflow to ensure the path is displayed
              layer._path.getBoundingClientRect();
            }
          }
        }, 50);
      }
      
      // Create a shape object with additional properties
      const shape = {
        layer,
        geoJSON,
        svgPath,
        center: layer.getBounds ? layer.getBounds().getCenter() : null,
        type: e.layerType
      };
      
      // Call the provided callback with the shape
      if (onCreated) {
        onCreated(shape);
      }
    } catch (err) {
      console.error('Error creating shape:', err);
      toast.error('Failed to create shape');
    }
  };
  
  return { handleCreated };
}
