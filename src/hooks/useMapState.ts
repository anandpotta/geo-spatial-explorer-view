
import { Location } from '@/utils/geo-utils';
import { useBaseMapState } from './map/useBaseMapState';
import { useMarkerState } from './map/useMarkerState';
import { useDrawingState } from './map/useDrawingState';
import { useToolState } from './map/useToolState';

export function useMapState(selectedLocation?: Location) {
  // Use our smaller, composable hooks
  const { position, setPosition, zoom, setZoom, currentUser, isAuthenticated } = useBaseMapState(selectedLocation);
  const { markers, setMarkers, tempMarker, setTempMarker, markerName, 
    setMarkerName, markerType, setMarkerType, handleSaveMarker: baseSaveMarker, handleDeleteMarker } = useMarkerState(isAuthenticated, currentUser);
  const { drawings, setDrawings, currentDrawing, setCurrentDrawing, 
    showFloorPlan, setShowFloorPlan, selectedDrawing, setSelectedDrawing, 
    handleRegionClick, saveDrawingWithMarker } = useDrawingState(isAuthenticated, currentUser);
  const { activeTool, setActiveTool } = useToolState();

  // Combine handleSaveMarker to work with drawings
  const handleSaveMarker = () => {
    if (!isAuthenticated || !currentUser) {
      return;
    }
    
    // Save the marker first
    const newMarker = baseSaveMarker(currentDrawing);
    
    // If we have a current drawing, update it with the marker ID
    if (currentDrawing && newMarker) {
      saveDrawingWithMarker(currentDrawing, newMarker.id);
    }
  };

  return {
    // From useBaseMapState
    position,
    setPosition,
    zoom,
    setZoom,
    
    // From useMarkerState
    markers,
    setMarkers,
    tempMarker,
    setTempMarker,
    markerName,
    setMarkerName,
    markerType,
    setMarkerType,
    handleSaveMarker,
    handleDeleteMarker,
    
    // From useDrawingState
    drawings,
    setDrawings,
    currentDrawing,
    setCurrentDrawing,
    showFloorPlan,
    setShowFloorPlan,
    selectedDrawing, 
    setSelectedDrawing,
    handleRegionClick,
    
    // From useToolState
    activeTool,
    setActiveTool,
  };
}

// Extend the Window interface to include our custom property
declare global {
  interface Window {
    tempMarkerPositionUpdate?: (pos: [number, number]) => void;
  }
}
