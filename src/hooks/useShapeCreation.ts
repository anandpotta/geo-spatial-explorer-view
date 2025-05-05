
import { toast } from 'sonner';
import { SVGPathElementWithAttributes } from '@/utils/svg-types';

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
      
      // Generate a unique ID for the shape if it doesn't have one
      const drawingId = layer.drawingId || `drawing-${Date.now()}-${Math.round(Math.random() * 1000)}`;
      layer.drawingId = drawingId;
      
      // Get the SVG path data if available
      let svgPath = null;
      if (layer._path && layer._path.getAttribute) {
        const pathElement = layer._path as SVGPathElement;
        svgPath = pathElement.getAttribute('d');
        
        // Apply visible-path-stroke class to ensure path visibility
        pathElement.classList.add('visible-path-stroke');
        
        // Add drawing ID to the path for future reference
        pathElement.setAttribute('data-drawing-id', drawingId);
        
        // Force a reflow to ensure the browser renders the path
        pathElement.getBoundingClientRect();
      }
      
      // Enhanced path finding for polygon layers
      if (!svgPath && layer.getLatLngs) {
        // For polygon or rectangle layers, try to find the path from the DOM
        setTimeout(() => {
          if (layer._path && layer._path.getAttribute) {
            const pathElement = layer._path as SVGPathElementWithAttributes;
            const updatedPath = pathElement.getAttribute('d');
            if (updatedPath) {
              // Update the layer with the path data
              layer.svgPath = updatedPath;
              
              // Apply visible-path-stroke class to ensure path visibility
              pathElement.classList.add('visible-path-stroke');
              
              // Add drawing ID to the path for future reference
              pathElement.setAttribute('data-drawing-id', layer.drawingId || drawingId);
              
              // Force a reflow to ensure the path is displayed
              pathElement.getBoundingClientRect();
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
        type: e.layerType,
        drawingId: drawingId
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
