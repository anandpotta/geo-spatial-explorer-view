
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
      
      // Get the SVG path data if available
      let svgPath = null;
      if (layer._path && layer._path.getAttribute) {
        const pathElement = layer._path as SVGPathElement;
        svgPath = pathElement.getAttribute('d');
        
        // Apply visible-path-stroke class to ensure path visibility
        pathElement.classList.add('visible-path-stroke');
        
        // Force a reflow to ensure the browser renders the path
        pathElement.getBoundingClientRect();
        
        // Set style attributes directly to ensure visibility
        pathElement.setAttribute('stroke', '#33C3F0');
        pathElement.setAttribute('stroke-width', '4px');
        pathElement.setAttribute('stroke-opacity', '1');
        pathElement.setAttribute('fill-opacity', '0.3');
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
              
              // Set style attributes directly to ensure visibility
              pathElement.setAttribute('stroke', '#33C3F0');
              pathElement.setAttribute('stroke-width', '4px');
              pathElement.setAttribute('stroke-opacity', '1');
              pathElement.setAttribute('fill-opacity', '0.3');
              
              // Force a reflow to ensure the path is displayed
              pathElement.getBoundingClientRect();
            }
          }
        }, 100);
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
        
        // Apply a backup visibility check after a short delay
        setTimeout(() => {
          if (layer._path) {
            const pathElement = layer._path as SVGPathElement;
            if (!pathElement.classList.contains('visible-path-stroke')) {
              pathElement.classList.add('visible-path-stroke');
              console.log('Visibility restored to path element');
            }
          }
        }, 500);
      }
    } catch (err) {
      console.error('Error creating shape:', err);
      toast.error('Failed to create shape');
    }
  };
  
  return { handleCreated };
}
