
/**
 * Utility functions for finding SVG paths in the DOM
 */

/**
 * Find an SVG path element by its associated drawing ID
 */
export const findSvgPathByDrawingId = (drawingId: string): SVGPathElement | null => {
  if (!drawingId) return null;
  
  try {
    // First try to find by data attribute
    const pathWithAttr = document.querySelector(`path[data-drawing-id="${drawingId}"]`) as SVGPathElement;
    if (pathWithAttr) return pathWithAttr;
    
    // Then search all leaflet interactive paths
    const allPaths = document.querySelectorAll('path.leaflet-interactive') as NodeListOf<SVGPathElement>;
    
    // Loop through and check for a matching layer
    for (const path of Array.from(allPaths)) {
      // Check for matching layer IDs
      const layers = document.querySelectorAll('.leaflet-overlay-pane .leaflet-interactive');
      for (const layer of Array.from(layers)) {
        if ((layer as any)._leaflet_id && (layer as any)._path === path) {
          // Check if this layer has our drawing ID
          const layerDrawingId = (layer as any).drawingId || 
                               (layer as any).options?.drawingId ||
                               path.getAttribute('data-drawing-id');
          
          if (layerDrawingId === drawingId) {
            // Store the ID on the path element for future lookups
            path.setAttribute('data-drawing-id', drawingId);
            return path;
          }
        }
      }
    }
    
    // As a last resort, try to find by containing element with the ID
    const containerWithId = document.querySelector(`[id*="${drawingId}"]`);
    if (containerWithId) {
      const pathInContainer = containerWithId.querySelector('path') as SVGPathElement;
      if (pathInContainer) return pathInContainer;
    }
    
    return null;
  } catch (err) {
    console.error('Error finding SVG path by drawing ID:', err);
    return null;
  }
};
