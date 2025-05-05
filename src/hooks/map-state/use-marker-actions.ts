
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
    
    // Important: First clear all state variables BEFORE saving to storage
    // This ensures the temp marker is gone before the saved marker appears
    const markerToSave = {...newMarker}; // Create a copy to use after state clearing
    const drawingToSave = currentDrawing ? {...currentDrawing} : null;
    
    // Clear all temp state immediately
    setTempMarker(null);
    setMarkerName('');
    setCurrentDrawing(null);
    
    // Use requestAnimationFrame to ensure DOM updates have processed
    // before attempting to save the marker to storage
    requestAnimationFrame(() => {
      // After the UI has updated (removing temp marker), save the actual marker
      saveMarker(markerToSave);
      
      if (drawingToSave) {
        // Create a safe copy of currentDrawing without circular references
        const safeDrawing: DrawingData = {
          ...drawingToSave,
          // Remove any potential circular references from geoJSON
          geoJSON: drawingToSave.geoJSON ? JSON.parse(JSON.stringify({
            type: drawingToSave.geoJSON.type,
            geometry: drawingToSave.geoJSON.geometry,
            properties: drawingToSave.geoJSON.properties
          })) : undefined,
          properties: {
            ...drawingToSave.properties,
            name: markerName,
            // Use the drawing type if available, or fallback to 'region'
            // Don't try to set properties.type directly if it's not in the interface
            ...(drawingToSave.properties?.type ? { type: drawingToSave.properties.type } : { type: 'region' }),
            associatedMarkerId: markerToSave.id
          }
        };
        
        saveDrawing(safeDrawing);
      }
      
      toast.success("Location saved successfully");
    });
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
