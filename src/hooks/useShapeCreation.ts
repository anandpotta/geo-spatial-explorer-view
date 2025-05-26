
import { toast } from 'sonner';

export function useShapeCreation(onCreated: (shape: any) => void) {
  const handleCreated = (e: any) => {
    const layer = e.layer;
    const layerType = e.layerType;
    
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
      }
      
      // Create a shape object with additional properties
      const shape = {
        layer,
        geoJSON,
        svgPath,
        center: layer.getBounds ? layer.getBounds().getCenter() : null,
        type: layerType, // Use the layerType from the event to distinguish between different shapes
        id: crypto.randomUUID() // Generate unique ID for tracking
      };
      
      // Only add position for actual marker types, not for circles or other shapes
      if (layerType === 'marker' && layer.getLatLng) {
        const latLng = layer.getLatLng();
        shape.position = [latLng.lat, latLng.lng];
      }
      
      console.log(`Shape created: ${layerType}`, shape);
      
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
