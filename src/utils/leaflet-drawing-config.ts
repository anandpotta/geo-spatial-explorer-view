
import L from 'leaflet';

export const createDrawingLayer = (drawing: any, options: L.PathOptions) => {
  try {
    // Create a copy of options without renderer for GeoJSON
    const geoJSONOptions = { ...options };
    // Remove renderer from GeoJSON options as it's not a valid property
    if ('renderer' in geoJSONOptions) {
      delete geoJSONOptions.renderer;
    }
    
    // Ensure stroke is enabled with proper settings
    geoJSONOptions.stroke = true;
    geoJSONOptions.weight = geoJSONOptions.weight || 4;
    geoJSONOptions.opacity = 1;
    geoJSONOptions.color = '#33C3F0';
    geoJSONOptions.fillColor = '#33c3f061';
    geoJSONOptions.fillOpacity = 1;
    
    // Create layer with corrected options
    const layer = L.geoJSON(drawing.geoJSON, geoJSONOptions);
    
    // After creation, apply SVG renderer to each layer
    layer.eachLayer((l: any) => {
      if (l && l.options) {
        // Apply SVG renderer to the layer options
        l.options.renderer = L.svg();
        l.options.stroke = true;
        l.options.weight = options.weight || 4;
        l.options.opacity = 1;
        l.options.color = '#33C3F0';
        l.options.fillColor = '#33c3f061';
        l.options.fillOpacity = 1;
      }
      
      // Store SVG path data if available
      if (drawing.svgPath && l._path) {
        try {
          l._path.setAttribute('d', drawing.svgPath);
          
          // Add class for visible stroke
          l._path.classList.add('visible-path-stroke');
          
          // Force a reflow to ensure styles are applied
          l._path.getBoundingClientRect();
        } catch (err) {
          console.error('Error setting path data:', err);
        }
      }
    });
    
    return layer;
  } catch (error) {
    console.error('Error creating drawing layer:', error);
    return null;
  }
};

export const getDefaultDrawingOptions = (color?: string): L.PathOptions => ({
  color: color || '#33C3F0',
  weight: 4,
  opacity: 1,
  fillColor: '#33c3f061',
  fillOpacity: 1,
  renderer: L.svg(),
  stroke: true,
  lineCap: 'round',
  lineJoin: 'round'
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
