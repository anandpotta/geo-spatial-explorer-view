
import L from 'leaflet';

export const createDrawingLayer = (drawing: any, options: L.PathOptions) => {
  try {
    const layer = L.geoJSON(drawing.geoJSON, { style: options });
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
  fillOpacity: 0.3
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

// New function to generate path string from coordinates
export const getPathStringFromCoordinates = (coordinates: Array<[number, number]>): string => {
  if (!coordinates || coordinates.length === 0) return '';
  
  // Start with M (move to) command for the first coordinate
  let pathString = `M ${coordinates[0][1]},${coordinates[0][0]}`;
  
  // Add L (line to) commands for subsequent coordinates
  for (let i = 1; i < coordinates.length; i++) {
    pathString += ` L ${coordinates[i][1]},${coordinates[i][0]}`;
  }
  
  // Close the path if it's a polygon (connect back to start)
  pathString += ' Z';
  
  return pathString;
};

// New function to extract SVG path from Leaflet layer
export const getSvgPathFromLayer = (layer: any, layerType: string): string => {
  const coordinates = getCoordinatesFromLayer(layer, layerType);
  return getPathStringFromCoordinates(coordinates);
};
