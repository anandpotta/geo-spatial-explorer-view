
/**
 * Utility functions for working with SVG paths
 */

/**
 * Extracts path data from SVG elements in a container
 */
export const extractSvgPaths = (container: HTMLElement | null): string[] => {
  if (!container) return [];
  
  const paths: string[] = [];
  try {
    // Find all path elements
    const pathElements = container.querySelectorAll('path');
    pathElements.forEach(path => {
      const pathData = path.getAttribute('d');
      if (pathData) {
        paths.push(pathData);
      }
    });
  } catch (err) {
    console.error('Error extracting SVG paths:', err);
  }
  
  return paths;
};

/**
 * Gets a Leaflet layer's SVG path data
 */
export const getLeafletLayerPath = (layer: any): string | null => {
  if (!layer) return null;
  
  try {
    // Direct access to path element
    if (layer._path) {
      return layer._path.getAttribute('d') || null;
    }
    
    // For feature groups, check each sublayer
    if (typeof layer.eachLayer === 'function') {
      let pathData: string | null = null;
      layer.eachLayer((subLayer: any) => {
        if (!pathData && subLayer._path) {
          pathData = subLayer._path.getAttribute('d') || null;
        }
      });
      return pathData;
    }
  } catch (err) {
    console.error('Error getting layer path data:', err);
  }
  
  return null;
};

/**
 * Finds all SVG path elements on the map
 */
export const findAllPathsInMap = (map: any): SVGPathElement[] => {
  if (!map || !map.getContainer) return [];
  
  try {
    const container = map.getContainer();
    if (!container) return [];
    
    // Find all SVG path elements
    const svgLayers = container.querySelectorAll('.leaflet-overlay-pane svg, .leaflet-pane svg');
    const paths: SVGPathElement[] = [];
    
    svgLayers.forEach(svg => {
      const pathsInSvg = svg.querySelectorAll('path');
      pathsInSvg.forEach(path => paths.push(path));
    });
    
    return paths;
  } catch (err) {
    console.error('Error finding SVG paths in map:', err);
    return [];
  }
};

/**
 * Get path data from all paths on the map
 */
export const getAllMapPathData = (map: any): string[] => {
  const paths = findAllPathsInMap(map);
  return paths.map(path => path.getAttribute('d') || '').filter(Boolean);
};

/**
 * Creates a clip path element and adds it to the SVG defs
 */
export const createSvgClipPath = (
  svgElement: SVGElement | null,
  pathData: string,
  clipPathId: string
): SVGClipPathElement | null => {
  if (!svgElement || !pathData) return null;
  
  try {
    // Find or create defs element
    let defs = svgElement.querySelector('defs');
    if (!defs) {
      defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
      svgElement.appendChild(defs);
    }
    
    // Create clip path element
    const clipPathElement = document.createElementNS('http://www.w3.org/2000/svg', 'clipPath');
    clipPathElement.setAttribute('id', clipPathId);
    
    // Create path for the clip
    const pathElement = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    pathElement.setAttribute('d', pathData);
    
    // Assemble and add to DOM
    clipPathElement.appendChild(pathElement);
    defs.appendChild(clipPathElement);
    
    return clipPathElement;
  } catch (err) {
    console.error('Error creating SVG clip path:', err);
    return null;
  }
};

/**
 * Applies a clip path to an HTML element
 */
export const applyClipPathToElement = (
  element: HTMLElement,
  clipPathId: string
): void => {
  if (!element) return;
  
  try {
    element.style.clipPath = `url(#${clipPathId})`;
    element.style.webkitClipPath = `url(#${clipPathId})`;
  } catch (err) {
    console.error('Error applying clip path to element:', err);
  }
};
