
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
    
    // IMPORTANT: First clear all state variables BEFORE saving to storage
    // Create copies of needed data for after state clearing
    const markerToSave = {...newMarker};
    const drawingToSave = currentDrawing ? {...currentDrawing} : null;
    
    // Clear all temporary state immediately to remove temp marker from UI
    setTempMarker(null);
    setMarkerName('');
    setCurrentDrawing(null);
    
    // Use setTimeout with a slight delay to ensure DOM updates have processed
    // before attempting to save the marker to storage
    setTimeout(() => {
      // Save the actual marker after the UI has updated and temp marker is gone
      saveMarker(markerToSave);
      
      if (drawingToSave) {
        // Create a safe copy without circular references
        const safeDrawing: DrawingData = {
          ...drawingToSave,
          // Remove potential circular references
          geoJSON: drawingToSave.geoJSON ? JSON.parse(JSON.stringify({
            type: drawingToSave.geoJSON.type,
            geometry: drawingToSave.geoJSON.geometry,
            properties: drawingToSave.geoJSON.properties
          })) : undefined,
          properties: {
            ...drawingToSave.properties,
            name: markerName,
            // Handle type assignment safely
            ...(drawingToSave.properties?.type ? 
              { type: drawingToSave.properties.type } : 
              { type: 'region' }),
            associatedMarkerId: markerToSave.id
          }
        };
        
        saveDrawing(safeDrawing);
      }
      
      toast.success("Location saved successfully");
    }, 50); // Small delay to ensure state updates complete first
  }, [tempMarker, markerName, markerType, currentDrawing, setTempMarker, setMarkerName, setCurrentDrawing]);

  const handleDeleteMarker = useCallback((id: string) => {
    deleteMarker(id);
    toast.success("Location removed");
  }, []);

  return {
    handleSaveMarker,
    handleDeleteMarker
  };
}
