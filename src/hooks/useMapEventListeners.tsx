
import { useEffect } from 'react';
import { getMapFromLayer } from '@/utils/leaflet-type-utils';

interface UseMapEventListenersProps {
  featureGroupRef: React.MutableRefObject<L.FeatureGroup>;
  drawToolsRef: React.MutableRefObject<any>;
  mountedRef: React.MutableRefObject<boolean>;
  setIsInitialized: (initialized: boolean) => void;
}

export function useMapEventListeners({
  featureGroupRef,
  drawToolsRef,
  mountedRef,
  setIsInitialized
}: UseMapEventListenersProps) {
  useEffect(() => {
    if (featureGroupRef.current) {
      setIsInitialized(true);
    }
    
    // Register map event listeners to help maintain path visibility
    if (featureGroupRef.current) {
      const map = getMapFromLayer(featureGroupRef.current);
      
      if (map) {
        const handleMapEvent = () => {
          // Use requestAnimationFrame to avoid blocking the UI
          requestAnimationFrame(() => {
            if (drawToolsRef.current && drawToolsRef.current.getPathElements) {
              const paths = drawToolsRef.current.getPathElements();
              paths.forEach((path: SVGPathElement) => {
                if (!path.classList.contains('visible-path-stroke')) {
                  path.classList.add('visible-path-stroke');
                }
              });
            }
          });
        };
        
        map.on('zoomend moveend dragend', handleMapEvent);
        
        return () => {
          map.off('zoomend moveend dragend', handleMapEvent);
          mountedRef.current = false;
        };
      }
    }
    
    return () => {
      mountedRef.current = false;
    };
  }, []);
}
