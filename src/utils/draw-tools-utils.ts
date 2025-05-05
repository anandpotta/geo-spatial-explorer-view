
import L from 'leaflet';
import { toast } from 'sonner';
import { getMapFromLayer } from './leaflet-type-utils';

/**
 * Create edit control options with proper safeguards
 */
export const createEditControlOptions = () => ({
  position: 'topright',
  draw: {
    rectangle: true,
    polygon: true,
    circle: true,
    circlemarker: false,
    marker: true,
    polyline: false
  },
  edit: {
    selectedPathOptions: {
      maintainColor: false,
      opacity: 0.7
    },
    remove: true,
    edit: {
      noMissingHandlers: true  // Add this to prevent errors when handlers are missing
    }
  }
});

/**
 * Process a newly created shape
 */
export const processCreatedShape = (e: any, onCreated: (shape: any) => void) => {
  try {
    const { layerType, layer } = e;
    
    if (!layer) {
      console.error('No layer created');
      return;
    }
    
    // Ensure the layer has proper edit handlers
    if (layer.enableEdit && typeof layer.enableEdit === 'function') {
      // Make sure the layer has proper editing capabilities
      try {
        layer._map = getMapFromLayer(layer._map || layer._leaflet_events?.mouseover?.[0]?.ctx);
      } catch (err) {
        console.error('Error setting layer map reference:', err);
      }
    }
    
    // Create a properly structured shape object
    let shape: any = { type: layerType, layer };
    
    // Extract SVG path data if available
    if (layer._path) {
      shape.svgPath = layer._path.getAttribute('d');
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
    
    // Wait for the next tick to ensure DOM is updated
    setTimeout(() => {
      // Try to get SVG path data after layer is rendered
      if (!shape.svgPath && layer._path) {
        shape.svgPath = layer._path.getAttribute('d');
      }
      
      onCreated(shape);
    }, 50);
  } catch (err) {
    console.error('Error handling created shape:', err);
    toast.error('Error creating shape');
  }
};
