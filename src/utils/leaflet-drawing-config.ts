
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
    geoJSONOptions.color = '#33C3F0'; // Sky blue color
    
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
        l.options.color = '#33C3F0'; // Sky blue color
        l.options.lineCap = 'round';
        l.options.lineJoin = 'round';
        
        // Make sure markers are draggable
        if (l instanceof L.Marker) {
          l.options.draggable = true;
          if (l.dragging) {
            l.dragging.enable();
          }
          
          // Add draggable class to icon element when available
          // Use type assertion to access internal properties safely
          const markerAny = l as any;
          if (markerAny._icon) {
            markerAny._icon.classList.add('leaflet-marker-draggable');
          }
        }
      }
      
      // Store SVG path data if available
      if (drawing.svgPath && l._path) {
        try {
          l._path.setAttribute('d', drawing.svgPath);
          
          // Add class for visible stroke
          l._path.classList.add('visible-path-stroke');
          
          // Apply additional styling for rectangles specifically
          if (drawing.geoJSON.geometry && drawing.geoJSON.geometry.type === 'Polygon' && 
              drawing.geoJSON.geometry.coordinates[0] && 
              drawing.geoJSON.geometry.coordinates[0].length === 5) {
            // This is likely a rectangle (5 points with first and last being the same)
            l._path.classList.add('leaflet-rectangle-path');
          }
          
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
  color: color || '#33C3F0', // Using sky blue color
  weight: 4, // Increased stroke width
  opacity: 1, // Full opacity for stroke
  fillOpacity: 0.3,
  renderer: L.svg(), // Force SVG renderer
  stroke: true, // Explicitly enable stroke
  lineCap: 'round', // Round line caps
  lineJoin: 'round' // Round line joins
});

// Enhance with draggable configuration for markers
export const getMarkerOptions = (): L.MarkerOptions => ({
  draggable: true,
  autoPan: true,
  zIndexOffset: 1000,
  // Use icon property to set className indirectly
  icon: L.icon({
    iconUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABkAAAApCAYAAADAk4LOAAAGmklEQVRYw7VXeUyTZxjvNnfELFuyIzOabermMZEeQC/OclkO49CpOHXOLJl/CAURuYbQi3KLgEhbrhZ1aDwmaoGqKII6odATmH/scDFbdC7LvFqOCc+e95s2VG50X/LLm/f4/Z7neV/zCGcZcv6wLcePHj82DmMGw8CcZzBsYBjd8BTUVtligVW3x+Yy8WRzvq6aX+qgKbraJFXQicLnkHPOcaXVMo5NRSR0XbFJz5rv0SYKFFbUotVOgRTIuWcY1pPDarXVe40jeJA9iJKS1nRDk7fDdLhZuqpfzS0o5QOCJT5SMpYbqNTd7jew5isnSNEyX02f1pvYCx2Mh34MGMwWaftILH5TQHBtGdadaRUvQnP3K/WzCkLMAR7EandxiCd0AsHTH6ULmw0wHwh7FiFot/EAfOS90ESHMvPsb4no7mWP3dsnUVlQQ3y6ZC6J1AVRAcHkc9roPYC0/vCtgSBxkM+2FahWRW+tGDAtCCuX0wVBWb0Als5QxnZoUhXeUO7mXp9Kx4ISJ0QKN41y9HJXRKfqdSwn4tWMgmx6NjAJx8roRB+BsGSSWWeXHTPAs0MxA5AIfkc6JFSX+XNXtDCVnCYEndxbwknQCEmxiPMIn+DX8FR+SJj8WKrVIgmIH29fMrRgM2aixKQbSBEwGKu+dHEV+WWtgrLfKH0',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
    className: 'leaflet-marker-draggable' // This will now be applied through the icon
  })
});

export const getCoordinatesFromLayer = (layer: any, layerType: string): Array<[number, number]> => {
  if (layerType === 'polygon' || layerType === 'polyline') {
    return layer.getLatLngs()[0].map((latlng: L.LatLng) => [latlng.lat, latlng.lng]);
  } else if (layerType === 'rectangle') {
    const bounds = layer.getBounds();
    const northEast = bounds.getNorthEast();
    const southWest = bounds.getSouthWest();
    
    // For rectangles, ensure we create a proper closed polygon with 5 points
    // (last point same as first to close the shape)
    return [
      [southWest.lat, southWest.lng],
      [northEast.lat, southWest.lng],
      [northEast.lat, northEast.lng],
      [southWest.lat, northEast.lng],
      [southWest.lat, southWest.lng]  // Close the rectangle
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
