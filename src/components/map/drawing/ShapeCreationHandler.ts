
import L from 'leaflet';
import { toast } from 'sonner';
import { addEditingCapability } from './LayerEditingUtils';

interface Shape {
  type: string;
  layer: L.Layer;
  svgPath?: string;
  position?: [number, number];
  geoJSON?: any;
  coordinates?: [number, number][];
  radius?: number;
}

/**
 * Handles shape creation events from Leaflet Draw
 */
export function handleShapeCreated(e: any, onCreated: (shape: any) => void): void {
  try {
    const { layerType, layer } = e;
    
    if (!layer) {
      console.error('No layer created');
      return;
    }
    
    // Ensure the layer has editing capability
    if (layer instanceof L.Path && !layer.editing) {
      addEditingCapability(layer);
    }
    
    // Create a properly structured shape object
    let shape: Shape = { type: layerType, layer };
    
    // Force rendering as SVG path
    if (layer.options) {
      layer.options.renderer = L.svg();
    }
    
    // Extract SVG path data if available
    if (layer._path) {
      shape.svgPath = layer._path.getAttribute('d');
    } else {
      // For circle or other shapes, try to regenerate the path
      setTimeout(() => {
        if (layer._path) {
          shape.svgPath = layer._path.getAttribute('d');
          onCreated(shape);
        }
      }, 10);
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
}
