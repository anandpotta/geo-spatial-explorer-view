
import L from 'leaflet';
import { Shape } from './shape-types';

/**
 * Extract position information from a marker layer
 */
export function extractMarkerPosition(layer: L.Layer): [number, number] | undefined {
  if (layer.getLatLng) {
    const position = layer.getLatLng();
    return [position.lat, position.lng];
  }
  return undefined;
}

/**
 * Extract shape-specific data based on shape type
 */
export function extractShapeData(layerType: string, layer: L.Layer): {
  geoJSON?: any;
  coordinates?: [number, number][];
  radius?: number;
} {
  const result: {
    geoJSON?: any;
    coordinates?: [number, number][];
    radius?: number;
  } = {};
  
  if (['polygon', 'rectangle', 'circle'].includes(layerType)) {
    // Convert to GeoJSON to have a consistent format
    if (layer.toGeoJSON) {
      result.geoJSON = layer.toGeoJSON();
    }
    
    // Extract coordinates based on shape type
    if (layerType === 'polygon' || layerType === 'rectangle') {
      if (layer.getLatLngs) {
        const latLngs = layer.getLatLngs();
        if (Array.isArray(latLngs) && latLngs.length > 0) {
          // Handle potentially nested arrays (multi-polygons)
          const firstRing = Array.isArray(latLngs[0]) ? latLngs[0] : latLngs;
          
          // Use explicit type assertion for each coordinate pair
          result.coordinates = firstRing.map((ll: any) => {
            if (ll && typeof ll.lat === 'number' && typeof ll.lng === 'number') {
              return [ll.lat, ll.lng] as [number, number];
            }
            return [0, 0] as [number, number]; // Provide a fallback
          });
        }
      }
    } else if (layerType === 'circle') {
      if (layer.getLatLng) {
        const center = layer.getLatLng();
        result.coordinates = [[center.lat, center.lng] as [number, number]];
      }
      if (layer.getRadius) {
        result.radius = layer.getRadius();
      }
    }
  }
  
  return result;
}
