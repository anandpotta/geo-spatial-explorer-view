
import { useEffect } from 'react';
import { Location } from '@/utils/geo-utils';
import { useMarkerState } from './map/useMarkerState';
import { useDrawingState } from './map/useDrawingState';
import { useMapPosition } from './map/useMapPosition';
import { saveDrawing } from '@/utils/drawing';

export function useMapState(selectedLocation?: Location) {
  const markerState = useMarkerState();
  const drawingState = useDrawingState();
  const mapPosition = useMapPosition(selectedLocation);

  // Set up global position update handler for draggable markers
  useEffect(() => {
    window.tempMarkerPositionUpdate = markerState.setTempMarker;
    
    return () => {
      delete window.tempMarkerPositionUpdate;
    };
  }, []);

  const handleSaveMarker = () => {
    markerState.handleSaveMarker(drawingState.currentDrawing);
    
    if (drawingState.currentDrawing) {
      const safeDrawing: any = {
        ...drawingState.currentDrawing,
        geoJSON: drawingState.currentDrawing.geoJSON ? JSON.parse(JSON.stringify({
          type: drawingState.currentDrawing.geoJSON.type,
          geometry: drawingState.currentDrawing.geoJSON.geometry,
          properties: drawingState.currentDrawing.geoJSON.properties
        })) : undefined,
        properties: {
          ...drawingState.currentDrawing.properties,
          name: markerState.markerName,
          associatedMarkerId: markerState.markers[markerState.markers.length - 1]?.id
        }
      };
      
      saveDrawing(safeDrawing);
    }
    
    drawingState.setCurrentDrawing(null);
  };

  return {
    ...markerState,
    ...drawingState,
    ...mapPosition,
    handleSaveMarker
  };
}
