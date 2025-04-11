
import { useRef } from 'react';
import * as Cesium from 'cesium';

interface UseCesiumEntityResult {
  entityRef: React.MutableRefObject<Cesium.Entity | null>;
}

/**
 * Hook for managing Cesium entities
 */
export const useCesiumEntity = (): UseCesiumEntityResult => {
  const entityRef = useRef<Cesium.Entity | null>(null);
  
  return {
    entityRef
  };
};
