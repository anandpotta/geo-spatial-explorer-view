
import { useEffect } from 'react';
import { getMapFromLayer } from '@/utils/leaflet-type-utils';

interface UsePathVisibilityEffectProps {
  isInitialized: boolean;
  featureGroupRef: React.MutableRefObject<L.FeatureGroup>;
  drawToolsRef: React.MutableRefObject<any>;
  mountedRef: React.MutableRefObject<boolean>;
}

export function usePathVisibilityEffect({
  isInitialized,
  featureGroupRef,
  drawToolsRef,
  mountedRef
}: UsePathVisibilityEffectProps) {
  // Add an effect to monitor for layer visibility issues and fix them
  useEffect(() => {
    if (!isInitialized || !featureGroupRef.current) return;
    
    // Check for and fix path visibility issues immediately and then periodically
    const checkVisibility = () => {
      if (!mountedRef.current) return;
      
      try {
        // Get all SVG paths in the map
        const map = getMapFromLayer(featureGroupRef.current);
        if (!map) return;
        
        const container = map.getContainer();
        if (!container) return;
        
        // Look for paths in all relevant panes
        const svgElements = container.querySelectorAll('.leaflet-overlay-pane svg, .leaflet-pane svg');
        svgElements.forEach(svg => {
          const paths = svg.querySelectorAll('path.leaflet-interactive');
          paths.forEach(path => {
            // Apply visible class
            if (!path.classList.contains('visible-path-stroke')) {
              path.classList.add('visible-path-stroke');
            }
            
            // Ensure stroke is visible
            if (path.getAttribute('stroke-opacity') === '0' || 
                !path.getAttribute('stroke-opacity')) {
              path.setAttribute('stroke-opacity', '1');
            }
            
            // Set style attributes directly to ensure visibility
            path.setAttribute('stroke', '#33C3F0');
            path.setAttribute('stroke-width', '4px');
            path.setAttribute('fill-opacity', '0.3');
          });
        });
      } catch (err) {
        console.error('Error checking path visibility:', err);
      }
    };
    
    // Run the check immediately
    checkVisibility();
    
    // Run frequently at first, then less often
    const quickIntervals = [100, 300, 500, 1000];
    quickIntervals.forEach(delay => {
      setTimeout(checkVisibility, delay);
    });
    
    // Regular interval checking
    const checkInterval = setInterval(checkVisibility, 1500);
    
    // Additional checks after map events
    const map = getMapFromLayer(featureGroupRef.current);
    if (map) {
      const handleMapEvent = () => {
        setTimeout(checkVisibility, 100);
      };
      
      map.on('zoomend moveend dragend click viewreset', handleMapEvent);
      
      return () => {
        clearInterval(checkInterval);
        map.off('zoomend moveend dragend click viewreset', handleMapEvent);
      };
    }
    
    return () => {
      clearInterval(checkInterval);
    };
  }, [isInitialized, featureGroupRef, drawToolsRef, mountedRef]);
}
