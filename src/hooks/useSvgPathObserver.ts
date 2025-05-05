
import { useEffect } from 'react';
import { RefObject } from 'react';

/**
 * Hook to observe SVG paths for changes and maintain visibility
 * @param map The Leaflet map instance
 * @param restorePathVisibility Function to restore path visibility
 * @returns Cleanup function
 */
export function useSvgPathObserver(
  map: L.Map | null | undefined,
  restorePathVisibility: () => void
) {
  useEffect(() => {
    if (!map) return;
    
    // Set up a MutationObserver to watch for SVG changes and preserve paths
    const observer = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        if (mutation.type === 'childList' && mutation.target.nodeName === 'svg') {
          // Use type assertion to correctly type the SVG element
          const svgElement = mutation.target as SVGElement;
          const paths = svgElement.querySelectorAll('path.leaflet-interactive');
          paths.forEach(path => {
            if (!path.classList.contains('visible-path-stroke')) {
              path.classList.add('visible-path-stroke');
            }
          });
        }
      });
    });
    
    // Set up event listeners for map interactions that might affect paths
    const handleMapInteraction = () => {
      // Use requestAnimationFrame for better performance
      requestAnimationFrame(() => {
        restorePathVisibility();
      });
    };
    
    // Listen for events that might cause path visibility issues
    map.on('zoomend moveend dragend', handleMapInteraction);
    
    // Observe SVG elements in the overlay pane
    const overlayPane = map.getContainer().querySelector('.leaflet-overlay-pane');
    if (overlayPane) {
      observer.observe(overlayPane, { 
        childList: true, 
        subtree: true,
        attributes: true,
        attributeFilter: ['d', 'class', 'style']
      });
    }
    
    // Also check after a short delay to catch any paths that might appear after initial drawing
    const checkPathsInterval = setInterval(() => {
      restorePathVisibility();
    }, 1000);
    
    // Cleanup function
    return () => {
      observer.disconnect();
      map.off('zoomend moveend dragend', handleMapInteraction);
      clearInterval(checkPathsInterval);
    };
  }, [map, restorePathVisibility]);
}
