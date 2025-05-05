
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
    
    // Clear the temporary marker first to prevent React from trying to render
    // both the temp marker and the saved marker simultaneously
    setTempMarker(null);
    setMarkerName('');
    setCurrentDrawing(null);
    
    // After clearing temp marker state, save the marker to localStorage
    // This should trigger only one update event
    setTimeout(() => {
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
            // Use the drawing type if available, or fallback to 'region'
            // Don't try to set properties.type directly if it's not in the interface
            ...(currentDrawing.properties?.type ? { type: currentDrawing.properties.type } : { type: 'region' }),
            associatedMarkerId: newMarker.id
          }
        };
        
        saveDrawing(safeDrawing);
      }
      
      toast.success("Location saved successfully");
      console.log("Marker saved, waiting for markersUpdated event");
    }, 0);
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
