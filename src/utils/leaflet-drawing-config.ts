import L from 'leaflet';

// Extend the PathOptions and GeoJSONOptions interfaces to include our custom svgPath property
declare module 'leaflet' {
  interface PathOptions {
    svgPath?: string;
    renderer?: L.Renderer;
    imageUrl?: string; // Add imageUrl property to store image paths
  }
  
  interface GeoJSONOptions {
    svgPath?: string;
    renderer?: L.Renderer;
    imageUrl?: string; // Add imageUrl property to store image paths
  }
}

export const createDrawingLayer = (drawing: any, options: L.PathOptions) => {
  try {
    // Enhance options with any properties from the drawing
    const enhancedOptions = {
      ...options,
      renderer: L.svg(),  // Force SVG renderer
      imageUrl: drawing.imageUrl || options.imageUrl // Include image URL if available
    };
    
    const layer = L.geoJSON(drawing.geoJSON, { 
      style: enhancedOptions,
      renderer: L.svg() // Force SVG renderer at the GeoJSON level too
    });
    
    // Store SVG path data if available
    if (drawing.svgPath) {
      layer.options.svgPath = drawing.svgPath;
    }
    
    // After the layer is added to the map, we need to apply the clip mask if an image is present
    if (drawing.imageUrl) {
      layer.on('add', function(e) {
        applyClipMaskToLayer(layer, drawing.imageUrl, drawing.svgPath);
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

/**
 * Apply a clip mask to an SVG layer using an image
 */
export const applyClipMaskToLayer = (layer: L.GeoJSON, imageUrl: string, svgPath?: string): void => {
  try {
    // Wait for the layer to be added to the map and rendered
    setTimeout(() => {
      // Find all SVG path elements in this layer
      layer.eachLayer((pathLayer: any) => {
        if (!pathLayer._path) {
          console.warn('No SVG path element found in layer');
          return;
        }

        const pathElement = pathLayer._path as SVGPathElement;
        if (!pathElement) return;
        
        // Get SVG document that contains the path
        const svgRoot = pathElement.ownerSVGElement;
        if (!svgRoot) {
          console.warn('Could not find SVG root element');
          return;
        }
        
        // Create unique IDs for the pattern and clipPath
        const uniqueId = `clip-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const patternId = `pattern-${uniqueId}`;
        const clipPathId = `clipPath-${uniqueId}`;
        
        // Create the defs element if it doesn't exist
        let defs = svgRoot.querySelector('defs');
        if (!defs) {
          defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
          svgRoot.appendChild(defs);
        }
        
        // Create a clipPath element
        const clipPath = document.createElementNS('http://www.w3.org/2000/svg', 'clipPath');
        clipPath.setAttribute('id', clipPathId);
        
        // Clone the path for use in the clip path
        const pathClone = pathElement.cloneNode(true) as SVGPathElement;
        pathClone.removeAttribute('stroke');
        pathClone.removeAttribute('fill');
        clipPath.appendChild(pathClone);
        
        // Add the clipPath to defs
        defs.appendChild(clipPath);
        
        // Create a pattern element for the image
        const pattern = document.createElementNS('http://www.w3.org/2000/svg', 'pattern');
        pattern.setAttribute('id', patternId);
        pattern.setAttribute('patternUnits', 'userSpaceOnUse');
        pattern.setAttribute('width', '100%');
        pattern.setAttribute('height', '100%');
        
        // Create the image element
        const image = document.createElementNS('http://www.w3.org/2000/svg', 'image');
        image.setAttribute('href', imageUrl);
        image.setAttribute('width', '100%');
        image.setAttribute('height', '100%');
        image.setAttribute('preserveAspectRatio', 'xMidYMid slice');
        
        // Add the image to the pattern
        pattern.appendChild(image);
        
        // Add the pattern to defs
        defs.appendChild(pattern);
        
        // Apply the pattern as fill and the clipPath to the original path
        pathElement.setAttribute('fill', `url(#${patternId})`);
        pathElement.style.clipPath = `url(#${clipPathId})`;
        
        // Add a subtle overlay to make the image appear clipped
        pathElement.style.filter = 'brightness(0.9) contrast(1.1)';
        
        console.log('Applied image clip mask to path');
      });
    }, 100); // Small delay to ensure the SVG is in the DOM
  } catch (error) {
    console.error('Error applying clip mask to layer:', error);
  }
};
