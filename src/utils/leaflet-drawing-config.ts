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
