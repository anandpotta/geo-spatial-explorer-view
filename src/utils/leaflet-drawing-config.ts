
import L from 'leaflet';

// Extend the PathOptions and GeoJSONOptions interfaces to include our custom svgPath property
declare module 'leaflet' {
  interface PathOptions {
    svgPath?: string;
    renderer?: L.Renderer;
    clipImage?: string;
  }
  
  interface GeoJSONOptions {
    svgPath?: string;
    clipImage?: string;
  }
}

export const createDrawingLayer = (drawing: any, options: L.PathOptions) => {
  try {
    // Always use SVG renderer for better path handling
    options.renderer = L.svg();
    
    const layer = L.geoJSON(drawing.geoJSON, { 
      style: (feature) => {
        // Create a new options object to avoid modifying the original
        const styleOptions = { ...options };
        
        // Add the clip image if available
        if (drawing.clipImage) {
          styleOptions.clipImage = drawing.clipImage;
        }
        
        // Store SVG path data if available
        if (drawing.svgPath) {
          styleOptions.svgPath = drawing.svgPath;
        }
        
        return styleOptions;
      }
    });
    
    // Add the image clip mask if available
    if (drawing.clipImage) {
      layer.on('add', (event) => {
        setTimeout(() => {
          applyClipMaskToLayer(layer, drawing.clipImage, drawing.svgPath);
        }, 100); // Small delay to ensure the layer is fully rendered
      });
    }
    
    return layer;
  } catch (error) {
    console.error('Error creating drawing layer:', error);
    return null;
  }
};

/**
 * Apply a clip mask to a layer using the provided image and SVG path
 */
export const applyClipMaskToLayer = (layer: L.GeoJSON | null, imageUrl: string, svgPath?: string) => {
  if (!layer || !imageUrl) return;
  
  try {
    // Process each path in the GeoJSON layer
    layer.eachLayer((l: any) => {
      if (!l._path) return;
      
      const svgElement = l._path;
      if (!svgElement) return;
      
      // Get the SVG parent element
      const svg = svgElement.ownerSVGElement;
      if (!svg) return;
      
      // Create a unique ID for this clip path
      const clipId = `clip-path-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Get the path data from the element
      const pathData = svgElement.getAttribute('d');
      if (!pathData) return;
      
      // Create a defs element if it doesn't exist
      let defs = svg.querySelector('defs');
      if (!defs) {
        defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        svg.appendChild(defs);
      }
      
      // Create a clip path element
      const clipPath = document.createElementNS('http://www.w3.org/2000/svg', 'clipPath');
      clipPath.setAttribute('id', clipId);
      
      // Create a path element for the clip path
      const clipPathPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      clipPathPath.setAttribute('d', pathData);
      
      // Add the path to the clip path
      clipPath.appendChild(clipPathPath);
      
      // Add the clip path to the defs
      defs.appendChild(clipPath);
      
      // Create an image element
      const image = document.createElementNS('http://www.w3.org/2000/svg', 'image');
      
      // Get the bounding box of the path
      const bbox = svgElement.getBBox();
      
      // Set the image attributes
      image.setAttribute('x', bbox.x.toString());
      image.setAttribute('y', bbox.y.toString());
      image.setAttribute('width', bbox.width.toString());
      image.setAttribute('height', bbox.height.toString());
      image.setAttribute('preserveAspectRatio', 'xMidYMid slice');
      image.setAttribute('clip-path', `url(#${clipId})`);
      image.setAttribute('href', imageUrl);
      
      // Add the image before the path in the SVG
      svg.insertBefore(image, svgElement);
      
      // Reduce the opacity of the original path
      svgElement.setAttribute('fill-opacity', '0.1');
    });
  } catch (error) {
    console.error('Error applying clip mask:', error);
  }
};

export const getDefaultDrawingOptions = (color?: string): L.PathOptions => ({
  color: color || '#3388ff',
  weight: 3,
  opacity: 0.7,
  fillOpacity: 0.3,
  renderer: L.svg() // Always use SVG renderer
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
