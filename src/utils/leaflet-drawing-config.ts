
import L from 'leaflet';

// Extend the PathOptions and GeoJSONOptions interfaces to include our custom svgPath property
declare module 'leaflet' {
  interface PathOptions {
    svgPath?: string;
    renderer?: L.Renderer;
  }
  
  interface GeoJSONOptions {
    svgPath?: string;
    renderer?: L.Renderer;
  }
}

export const createDrawingLayer = (drawing: any, options: L.PathOptions) => {
  try {
    // Enforce SVG renderer to ensure paths are rendered as SVG elements
    const enhancedOptions = {
      ...options,
      renderer: L.svg()  // Force SVG renderer
    };
    
    const layer = L.geoJSON(drawing.geoJSON, { 
      style: enhancedOptions,
      renderer: L.svg() // Force SVG renderer at the GeoJSON level too
    });
    
    // Store SVG path data if available
    if (drawing.svgPath) {
      layer.options.svgPath = drawing.svgPath;
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
  renderer: L.svg()  // Force SVG renderer for default options too
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

/**
 * Extract SVG path data from a Leaflet path element
 */
export const extractSvgPathData = (pathElement: SVGPathElement | null): string => {
  if (!pathElement) return '';
  
  try {
    return pathElement.getAttribute('d') || '';
  } catch (error) {
    console.error('Error extracting SVG path data:', error);
    return '';
  }
};

/**
 * Convert GeoJSON coordinates to SVG path data
 * This is a fallback when direct SVG extraction is not possible
 */
export const geoJsonToSvgPath = (coordinates: Array<[number, number]>, map: L.Map | null): string => {
  if (!coordinates || coordinates.length < 3 || !map) return '';
  
  try {
    // Convert geo coordinates to pixel coordinates on the map
    const points = coordinates.map(coord => {
      const point = map.latLngToLayerPoint(new L.LatLng(coord[0], coord[1]));
      return [point.x, point.y];
    });
    
    // Create SVG path data
    let pathData = `M ${points[0][0]} ${points[0][1]}`;
    for (let i = 1; i < points.length; i++) {
      pathData += ` L ${points[i][0]} ${points[i][1]}`;
    }
    pathData += ' Z'; // Close the path
    
    return pathData;
  } catch (error) {
    console.error('Error converting GeoJSON to SVG path:', error);
    return '';
  }
};
