
import { toast } from 'sonner';

/**
 * Hook to handle shape creation events
 */
export function useShapeCreation(onCreated: (shape: any) => void) {
  const handleCreated = (e: any) => {
    try {
      const { layerType, layer } = e;
      
      if (!layer) {
        console.error('No layer created');
        return;
      }
      
      // Create a properly structured shape object
      let shape: any = { type: layerType, layer };
      
      // Extract SVG path data if available
      if (layer._path) {
        // Apply anti-flickering optimizations to the created path
        layer._path.style.transform = 'translateZ(0)';
        layer._path.style.willChange = 'auto'; // Reset willChange after creation
        layer._path.style.transition = 'none'; // Remove transitions after creation
        
        // Store the SVG path data
        shape.svgPath = layer._path.getAttribute('d');
        
        // Ensure any path we create has a unique class for easier finding
        layer._path.classList.add('leaflet-interactive-created');
      }
      
      // For markers, extract position information
      if (layerType === 'marker' && layer.getLatLng) {
        const position = layer.getLatLng();
        shape.position = [position.lat, position.lng];
      }
      
      // For polygons, rectangles, and circles
      else if (['polygon', 'rectangle', 'circle'].includes(layerType)) {
        // Convert to GeoJSON to have a consistent format
        shape.geoJSON = layer.toGeoJSON();
        
        // Extract coordinates based on shape type
        if (layerType === 'polygon' || layerType === 'rectangle') {
          const latLngs = layer.getLatLngs();
          if (Array.isArray(latLngs) && latLngs.length > 0) {
            // Handle potentially nested arrays (multi-polygons)
            const firstRing = Array.isArray(latLngs[0]) ? latLngs[0] : latLngs;
            shape.coordinates = firstRing.map((ll: L.LatLng) => [ll.lat, ll.lng]);
          }
        } else if (layerType === 'circle') {
          const center = layer.getLatLng();
          shape.coordinates = [[center.lat, center.lng]];
          shape.radius = layer.getRadius();
        }
      }
      
      // Ensure we always get valid SVG path data by checking within a short delay
      // This helps with timing issues that can cause flickering
      setTimeout(() => {
        // If we didn't get SVG path data initially, try again after rendering
        if (!shape.svgPath && layer._path) {
          shape.svgPath = layer._path.getAttribute('d');
          
          // Apply optimizations again to ensure they stick
          if (layer._path) {
            layer._path.style.transform = 'translateZ(0)';
          }
        }
        
        onCreated(shape);
      }, 30);
    } catch (err) {
      console.error('Error handling created shape:', err);
      toast.error('Error creating shape');
    }
  };

  return { handleCreated };
}
