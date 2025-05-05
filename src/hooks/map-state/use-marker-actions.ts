
import { useCallback } from 'react';
import { LocationMarker } from '@/utils/markers/types';
import { DrawingData, saveDrawing } from '@/utils/drawing-utils';
import { saveMarker, deleteMarker } from '@/utils/markers/storage';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';

export function useMarkerActions(
  tempMarker: [number, number] | null,
  markerName: string, 
  markerType: 'pin' | 'area' | 'building',
  currentDrawing: DrawingData | null,
  setTempMarker: (marker: [number, number] | null) => void,
  setMarkerName: (name: string) => void,
  setCurrentDrawing: (drawing: DrawingData | null) => void
) {
  const handleSaveMarker = useCallback(() => {
    if (!tempMarker || !markerName.trim()) return;
    
    // Generate a unique ID with a timestamp prefix to ensure uniqueness
    const timestamp = Date.now().toString(36);
    const uniqueId = `${timestamp}-${uuidv4()}`;
    
    const newMarker: LocationMarker = {
      id: uniqueId,
      name: markerName,
      position: tempMarker,
      type: markerType,
      createdAt: new Date(),
      associatedDrawing: currentDrawing ? currentDrawing.id : undefined
    };
    
    console.log(`Saving new marker with ID: ${uniqueId}`);
    
    // Save the marker to localStorage
    saveMarker(newMarker);
    
    if (currentDrawing) {
      // Create a safe copy of currentDrawing without circular references
      const safeDrawing: DrawingData = {
        ...currentDrawing,
        // Remove any potential circular references from geoJSON
        geoJSON: currentDrawing.geoJSON ? JSON.parse(JSON.stringify({
          type: currentDrawing.geoJSON.type,
          geometry: currentDrawing.geoJSON.geometry,
          properties: currentDrawing.geoJSON.properties
        })) : undefined,
        properties: {
          ...currentDrawing.properties,
          name: markerName,
          associatedMarkerId: newMarker.id
        }
      };
      
      saveDrawing(safeDrawing);
    }
    
    // Clear the temporary marker to allow placing a new one
    setTempMarker(null);
    setMarkerName('');
    setCurrentDrawing(null);
    
    // Important: DON'T update the markers state directly here
    // Let the markersUpdated event handler handle state updates
    // This prevents duplicate entries in the state
    console.log("Marker saved, waiting for markersUpdated event");
    
    toast.success("Location saved successfully");
  }, [tempMarker, markerName, markerType, currentDrawing, setTempMarker, setMarkerName, setCurrentDrawing]);

  const handleDeleteMarker = useCallback((id: string) => {
    deleteMarker(id);
    // Let the event handler update the state properly
    toast.success("Location removed");
  }, []);

  return {
    handleSaveMarker,
    handleDeleteMarker
  };
}
