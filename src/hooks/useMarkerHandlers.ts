
import { useMarkerPlacement } from './useMarkerPlacement';
import { useShapeCreation } from './useShapeCreation';
import { useMemo } from 'react';

export function useMarkerHandlers(mapState: any) {
  // Use useMemo to prevent recreating handlers on every render
  const handleMapClick = useMemo(() => {
    return useMarkerPlacement(mapState);
  }, [mapState]);
  
  const handleShapeCreated = useMemo(() => {
    return useShapeCreation(mapState);
  }, [mapState]);

  return {
    handleMapClick,
    handleShapeCreated
  };
}
