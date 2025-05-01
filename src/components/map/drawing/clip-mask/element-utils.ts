
/**
 * Utility functions for finding and managing DOM elements for clip masks
 */
import L from 'leaflet';
import { findSvgPathByDrawingId } from '@/utils/svg-clip-mask';

// Generate a unique identifier for an element to track if it's been replaced
export const generateElementIdentifier = (element: SVGPathElement): string => {
  const attributes = Array.from(element.attributes)
    .map(attr => `${attr.name}=${attr.value}`)
    .join(';');
  
  // Include parent info for more reliable identification
  const parentId = element.parentElement?.id || '';
  const pathData = element.getAttribute('d') || '';
  
  return `${parentId}-${attributes}-${pathData.substring(0, 20)}`;
};

/**
 * Try multiple methods to find the path element
 */
export const findPathElement = (drawingId: string, layer: L.Layer): SVGPathElement | null => {
  // First try direct access via Leaflet layer reference
  if (layer && (layer as any)._path) {
    return (layer as any)._path as SVGPathElement;
  }
  
  // Check each sublayer for the path element
  if (typeof (layer as any).eachLayer === 'function') {
    let foundPath: SVGPathElement | null = null;
    (layer as any).eachLayer((subLayer: L.Layer) => {
      if (!foundPath && (subLayer as any)._path) {
        foundPath = (subLayer as any)._path as SVGPathElement;
      }
    });
    if (foundPath) return foundPath;
  }

  // Use our utility function to search in the document
  const pathViaSelector = findSvgPathByDrawingId(drawingId);
  if (pathViaSelector) return pathViaSelector;
  
  // Search in the overlay pane for paths with attributes or classes matching our drawing ID
  try {
    // Try to find the map container
    const map = (layer as any)._map;
    if (map) {
      const container = map.getContainer();
      const overlayPane = container?.querySelector('.leaflet-overlay-pane');
      if (overlayPane) {
        // Try to find the specific path by its attributes
        const pathById = overlayPane.querySelector(`#drawing-path-${drawingId}`);
        if (pathById) return pathById as SVGPathElement;
        
        const pathByAttr = overlayPane.querySelector(`path[data-drawing-id="${drawingId}"]`);
        if (pathByAttr) return pathByAttr as SVGPathElement;
        
        // If we have exactly one path and this is a retry, it might be the one we're looking for
        const allPaths = overlayPane.querySelectorAll('path.leaflet-interactive');
        if (allPaths.length === 1) {
          return allPaths[0] as SVGPathElement;
        }
      }
    }
  } catch (err) {
    console.error('Error finding path element:', err);
  }
  
  return null;
};
