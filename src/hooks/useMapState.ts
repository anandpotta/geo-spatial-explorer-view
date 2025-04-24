
import { useCallback } from 'react';
import { Location } from '@/utils/geo-utils';
import { useMarkerState } from './map/useMarkerState';
import { useDrawingState } from './map/useDrawingState';
import { useMapPosition } from './map/useMapPosition';

export function useMapState(selectedLocation?: Location) {
  const markerState = useMarkerState();
  const drawingState = useDrawingState();
  const mapPosition = useMapPosition(selectedLocation);

  const handleClearAll = useCallback(() => {
    // Clear localStorage
    localStorage.removeItem('tempMarkerPosition');
    localStorage.removeItem('tempMarkerName');
    
    markerState.setTempMarker(null);
    markerState.setMarkerName('');
    mapPosition.setActiveTool(null);
    drawingState.setCurrentDrawing(null);
    drawingState.setShowFloorPlan(false);
    drawingState.setSelectedDrawing(null);
    
    // Dispatch events to notify other components
    window.dispatchEvent(new Event('markersUpdated'));
    window.dispatchEvent(new Event('storage'));
  }, [markerState, mapPosition, drawingState]);

  return {
    ...markerState,
    ...drawingState,
    ...mapPosition,
    handleClearAll
  };
}
