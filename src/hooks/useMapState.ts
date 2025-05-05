
import { useState, useEffect } from 'react';
import { Location, LocationMarker } from '@/utils/geo-utils';
import { DrawingData, saveDrawing } from '@/utils/drawing-utils';
import { saveMarker, deleteMarker, getSavedMarkers } from '@/utils/marker-utils';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';

export function useMapState(selectedLocation?: Location) {
  const [position, setPosition] = useState<[number, number]>(
    selectedLocation ? [selectedLocation.y, selectedLocation.x] : [51.505, -0.09]
  );
  const [zoom, setZoom] = useState(18);
  const [markers, setMarkers] = useState<LocationMarker[]>([]);
  const [drawings, setDrawings] = useState<DrawingData[]>([]);
  const [tempMarker, setTempMarker] = useState<[number, number] | null>(null);
  const [markerName, setMarkerName] = useState('');
  const [markerType, setMarkerType] = useState<'pin' | 'area' | 'building'>('building');
  const [currentDrawing, setCurrentDrawing] = useState<DrawingData | null>(null);
  const [showFloorPlan, setShowFloorPlan] = useState(false);
  const [selectedDrawing, setSelectedDrawing] = useState<DrawingData | null>(null);
  const [activeTool, setActiveTool] = useState<string | null>(null);

  // Load existing markers on mount
  useEffect(() => {
    const savedMarkers = getSavedMarkers();
    setMarkers(savedMarkers);
    
    // Listen for marker updates
    const handleMarkersUpdated = () => {
      // Get updated markers from storage
      const updatedMarkers = getSavedMarkers();
      
      // Deduplicate markers by ID
      const uniqueMarkers = [];
      const seenIds = new Set();
      
      for (const marker of updatedMarkers) {
        if (!seenIds.has(marker.id)) {
          seenIds.add(marker.id);
          uniqueMarkers.push(marker);
        }
      }
      
      setMarkers(uniqueMarkers);
    };
    
    window.addEventListener('markersUpdated', handleMarkersUpdated);
    window.addEventListener('storage', handleMarkersUpdated);
    
    return () => {
      window.removeEventListener('markersUpdated', handleMarkersUpdated);
      window.removeEventListener('storage', handleMarkersUpdated);
    };
  }, []);

  // Set up global position update handler for draggable markers
  useEffect(() => {
    window.tempMarkerPositionUpdate = setTempMarker;
    
    return () => {
      delete window.tempMarkerPositionUpdate;
    };
  }, []);

  const handleSaveMarker = () => {
    if (!tempMarker || !markerName.trim()) return;
    
    const newMarker: LocationMarker = {
      id: uuidv4(),
      name: markerName,
      position: tempMarker,
      type: markerType,
      createdAt: new Date(),
      associatedDrawing: currentDrawing ? currentDrawing.id : undefined
    };
    
    // Save the marker
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
    
    // Update the markers state with the new marker - no need to fetch again as we already have the updated marker
    // Instead of calling getSavedMarkers(), which might reintroduce duplicates
    // Add the new marker directly to state to avoid duplicates
    setMarkers(prevMarkers => {
      // Check if marker with this ID already exists (shouldn't happen with uuidv4 but just in case)
      const exists = prevMarkers.some(m => m.id === newMarker.id);
      if (exists) {
        return prevMarkers; // Don't add duplicate
      }
      return [...prevMarkers, newMarker];
    });
    
    toast.success("Location saved successfully");
  };

  const handleDeleteMarker = (id: string) => {
    deleteMarker(id);
    // Update the markers state
    setMarkers(markers.filter(marker => marker.id !== id));
    toast.success("Location removed");
  };

  const handleRegionClick = (drawing: DrawingData) => {
    setSelectedDrawing(drawing);
    setShowFloorPlan(true);
  };

  return {
    position,
    setPosition,
    zoom,
    setZoom,
    markers,
    setMarkers,
    drawings,
    setDrawings,
    tempMarker,
    setTempMarker,
    markerName,
    setMarkerName,
    markerType,
    setMarkerType,
    currentDrawing,
    setCurrentDrawing,
    showFloorPlan,
    setShowFloorPlan,
    selectedDrawing,
    setSelectedDrawing,
    activeTool,
    setActiveTool,
    handleSaveMarker,
    handleDeleteMarker,
    handleRegionClick
  };
}

// Extend the Window interface to include our custom property
declare global {
  interface Window {
    tempMarkerPositionUpdate?: (pos: [number, number]) => void;
  }
}
