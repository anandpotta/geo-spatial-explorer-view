
import { useCallback, useEffect } from 'react';
import { Location } from '@/utils/geo-utils';
import { useMarkerState } from './map/useMarkerState';
import { useDrawingState } from './map/useDrawingState';
import { useMapPosition } from './map/useMapPosition';

export function useMapState(selectedLocation?: Location) {
  const markerState = useMarkerState();
  const drawingState = useDrawingState();
  const mapPosition = useMapPosition(selectedLocation);

  // Handle marker updates from localStorage or other instances
  useEffect(() => {
    const handleMarkersUpdated = () => {
      // Only fetch markers if we're not in the middle of editing
      if (!markerState.tempMarker) {
        const savedMarkers = localStorage.getItem('savedMarkers');
        if (savedMarkers) {
          try {
            const markers = JSON.parse(savedMarkers);
            // Update markers array while preserving state immutability
            markerState.setMarkers([...markers.map((marker: any) => ({
              ...marker,
              createdAt: new Date(marker.createdAt)
            }))]);
          } catch (error) {
            console.error('Failed to parse saved markers', error);
          }
        }
      }
    };
    
    // Listen for marker updates
    window.addEventListener('markersUpdated', handleMarkersUpdated);
    window.addEventListener('storage', handleMarkersUpdated);
    
    // Initial load
    handleMarkersUpdated();
    
    return () => {
      window.removeEventListener('markersUpdated', handleMarkersUpdated);
      window.removeEventListener('storage', handleMarkersUpdated);
    };
  }, [markerState]);

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
    window.dispatchEvent(new CustomEvent('markersUpdated'));
    window.dispatchEvent(new Event('storage'));
  }, [markerState, mapPosition, drawingState]);

  return {
    ...markerState,
    ...drawingState,
    ...mapPosition,
    handleClearAll
  };
}
