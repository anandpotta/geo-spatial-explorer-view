
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
        // Get SVG path data immediately to ensure we capture it
        shape.svgPath = layer._path.getAttribute('d');
        
        // Store a backup of the path data on the element itself
        layer._path.setAttribute('data-saved-path', shape.svgPath);
        
        // Apply anti-flickering optimizations to the created path
        layer._path.style.transform = 'translateZ(0)';
        layer._path.style.willChange = 'auto'; // Reset willChange after creation
        layer._path.style.transition = 'none'; // Remove transitions after creation
        
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
          
          // Special handling for polygons to preserve SVG path
          if (layerType === 'polygon') {
            console.log('Capturing polygon SVG path:', shape.svgPath);
            
            // If we didn't get the path directly, try to get it from DOM
            if (!shape.svgPath && layer._path) {
              console.log('Trying to get SVG path from DOM element');
              shape.svgPath = layer._path.getAttribute('d');
            }
          }
        } else if (layerType === 'circle') {
          const center = layer.getLatLng();
          shape.coordinates = [[center.lat, center.lng]];
          shape.radius = layer.getRadius();
        }
      }
      
      // Double-check that we have SVG path data by using multiple methods
      const ensureSvgPathData = () => {
        if (!shape.svgPath && layer._path) {
          // Try to get path data directly
          shape.svgPath = layer._path.getAttribute('d');
          console.log('Retrieved path data from DOM:', shape.svgPath);
        }
        
        // If still no path, check for stored path in data attribute
        if (!shape.svgPath && layer._path) {
          shape.svgPath = layer._path.getAttribute('data-saved-path') || 
                         layer._path.getAttribute('data-original-path');
          console.log('Retrieved path data from data attribute:', shape.svgPath);
        }
        
        // Apply optimizations again to ensure they stick
        if (layer._path) {
          layer._path.style.transform = 'translateZ(0)';
        }
        
        // Proceed with the creation callback
        onCreated(shape);
      };
      
      // Use a timeout to ensure the DOM has updated and path data is available
      setTimeout(ensureSvgPathData, 50);
      
    } catch (err) {
      console.error('Error handling created shape:', err);
      toast.error('Error creating shape');
    }
  };

  return { handleCreated };
}
