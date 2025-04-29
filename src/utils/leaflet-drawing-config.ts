
import L from 'leaflet';

export const createDrawingLayer = (drawing: any, options: L.PathOptions) => {
  try {
    // Force SVG renderer instead of canvas
    if (options) {
      options.renderer = L.svg();
    }
    
    const layer = L.geoJSON(drawing.geoJSON, { 
      style: options,
      renderer: L.svg() // Force SVG renderer
    });
    
    // Store SVG path data if available
    if (drawing.svgPath) {
      layer.eachLayer((l: any) => {
        if (l._path) {
          try {
            l._path.setAttribute('d', drawing.svgPath);
          } catch (err) {
            console.error('Error setting path data:', err);
          }
        }
      });
    }
    
    return layer;
  } catch (error) {
    console.error('Error creating drawing layer:', error);
    return null;
  }
};

export const getDefaultDrawingOptions = (color?: string): L.PathOptions => ({
  color: color || '#3388ff',
  weight: 3,
  opacity: 0.7,
  fillOpacity: 0.3,
  renderer: L.svg() // Force SVG renderer
});

export const getCoordinatesFromLayer = (layer: any, layerType: string): Array<[number, number]> => {
  if (layerType === 'polygon' || layerType === 'polyline') {
    return layer.getLatLngs()[0].map((latlng: L.LatLng) => [latlng.lat, latlng.lng]);
  } else if (layerType === 'rectangle') {
    const bounds = layer.getBounds();
    const northEast = bounds.getNorthEast();
    const southWest = bounds.getSouthWest();
    
    return [
      [southWest.lat, southWest.lng],
      [northEast.lat, southWest.lng],
      [northEast.lat, northEast.lng],
      [southWest.lat, northEast.lng]
    ];
  } else if (layerType === 'circle') {
    const center = layer.getLatLng();
    return [[center.lat, center.lng]];
  }
  return [];
};

export const getSVGPathFromLayer = (layer: any): string | null => {
  if (!layer) return null;
  
  try {
    // Try to access the SVG path element
    if (layer._path) {
      return layer._path.getAttribute('d') || null;
    }
    
    // If it's a feature group, try to access paths on child layers
    if (layer.eachLayer) {
      let path: string | null = null;
      layer.eachLayer((childLayer: any) => {
        if (!path && childLayer._path) {
          path = childLayer._path.getAttribute('d') || null;
        }
      });
      return path;
    }
  } catch (err) {
    console.error('Error getting SVG path:', err);
  }
  
  return null;
};

