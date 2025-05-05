
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
    
    // Check for and fix path visibility issues every few seconds
    const checkInterval = setInterval(() => {
      if (drawToolsRef.current && drawToolsRef.current.getPathElements) {
        const paths = drawToolsRef.current.getPathElements();
        let fixedPaths = false;
        
        paths.forEach((path: SVGPathElement) => {
          // Fix styling if needed
          if (!path.classList.contains('visible-path-stroke')) {
            path.classList.add('visible-path-stroke');
            fixedPaths = true;
          }
          
          // Ensure stroke is visible
          if (path.getAttribute('stroke-opacity') === '0') {
            path.setAttribute('stroke-opacity', '1');
            fixedPaths = true;
          }
        });
        
        if (fixedPaths) {
          console.log('Fixed visibility for SVG paths');
        }
      }
    }, 2000);
    
    return () => {
      clearInterval(checkInterval);
    };
  }, [isInitialized, featureGroupRef, drawToolsRef]);
}
