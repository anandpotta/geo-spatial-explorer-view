
import { Location } from '@/utils/geo-utils';
import { useMapPosition } from './map/useMapPosition';
import { useMapMarkers } from './map/useMapMarkers';
import { useMapDrawings } from './map/useMapDrawings';
import { useFloorPlanState } from './map/useFloorPlanState';
import { useEffect } from 'react';

export function useMapState(selectedLocation?: Location) {
  const mapPosition = useMapPosition(selectedLocation);
  const mapMarkers = useMapMarkers();
  const mapDrawings = useMapDrawings();
  const floorPlanState = useFloorPlanState();

  // Set up global temp marker handler - ensure this is always called
  useEffect(() => {
    window.tempMarkerPositionUpdate = mapMarkers.setTempMarker;
    
    return () => {
      delete window.tempMarkerPositionUpdate;
    };
  }, [mapMarkers.setTempMarker]);

  // Enhanced save marker handler that includes current drawing
  const handleSaveMarker = () => {
    mapMarkers.handleSaveMarker(mapDrawings.currentDrawing);
  };

  return {
    // Position state
    position: mapPosition.position,
    setPosition: mapPosition.setPosition,
    zoom: mapPosition.zoom,
    setZoom: mapPosition.setZoom,
    
    // Marker state
    markers: mapMarkers.markers,
    setMarkers: mapMarkers.setMarkers,
    tempMarker: mapMarkers.tempMarker,
    setTempMarker: mapMarkers.setTempMarker,
    markerName: mapMarkers.markerName,
    setMarkerName: mapMarkers.setMarkerName,
    markerType: mapMarkers.markerType,
    setMarkerType: mapMarkers.setMarkerType,
    isProcessingMarker: mapMarkers.isProcessingMarker,
    
    // Drawing state
    drawings: mapDrawings.drawings,
    setDrawings: mapDrawings.setDrawings,
    currentDrawing: mapDrawings.currentDrawing,
    setCurrentDrawing: mapDrawings.setCurrentDrawing,
    activeTool: mapDrawings.activeTool,
    setActiveTool: mapDrawings.setActiveTool,
    
    // Floor plan state
    showFloorPlan: floorPlanState.showFloorPlan,
    setShowFloorPlan: floorPlanState.setShowFloorPlan,
    selectedDrawing: floorPlanState.selectedDrawing,
    setSelectedDrawing: floorPlanState.setSelectedDrawing,
    
    // Action handlers
    handleSaveMarker,
    handleDeleteMarker: mapMarkers.handleDeleteMarker,
    handleRenameMarker: mapMarkers.handleRenameMarker,
    handleRegionClick: floorPlanState.handleRegionClick
  };
}

declare global {
  interface Window {
    tempMarkerPositionUpdate?: (pos: [number, number]) => void;
  }
}
