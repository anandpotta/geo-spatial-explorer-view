
import { useMarkerPlacement } from './useMarkerPlacement';
import { useShapeCreation } from './useShapeCreation';

export function useMarkerHandlers(mapState: any) {
  const handleMapClick = useMarkerPlacement(mapState);
  const handleShapeCreated = useShapeCreation(mapState);

  return {
    handleMapClick,
    handleShapeCreated
  };
}

