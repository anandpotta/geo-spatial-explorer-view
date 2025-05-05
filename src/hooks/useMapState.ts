
import { useState, useEffect, useRef, useCallback } from 'react';
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
  const markerStateRef = useRef<{
    markers: LocationMarker[],
    lastEventTime: number
  }>({
    markers: [],
    lastEventTime: 0
  });

  // Load existing markers on mount
  useEffect(() => {
    const savedMarkers = getSavedMarkers();
    // Use a stable reference to avoid duplicate markers
    const uniqueSavedMarkers = deduplicateMarkers(savedMarkers);
    setMarkers(uniqueSavedMarkers);
    markerStateRef.current.markers = uniqueSavedMarkers;
    
    // Listen for marker updates
    const handleMarkersUpdated = (event: Event) => {
      const customEvent = event as CustomEvent;
      const timestamp = customEvent.detail?.timestamp || Date.now();
      
      // Prevent duplicate processing of the same event
      if (timestamp <= markerStateRef.current.lastEventTime) {
        console.log("Skipping duplicate markers updated event");
        return;
      }
      
      markerStateRef.current.lastEventTime = timestamp;
      
      // Get updated markers from storage
      let updatedMarkers = getSavedMarkers();
      
      // Deduplicate markers
      updatedMarkers = deduplicateMarkers(updatedMarkers);
      
      // Only update state if the marker set has actually changed
      const hasChanges = markersHaveChanged(markerStateRef.current.markers, updatedMarkers);
      
      if (hasChanges) {
        console.log(`Updating markers state with ${updatedMarkers.length} unique markers`);
        setMarkers(updatedMarkers);
        markerStateRef.current.markers = updatedMarkers;
      }
    };
    
    const deduplicateMarkers = (markerArray: LocationMarker[]): LocationMarker[] => {
      const uniqueMarkers: LocationMarker[] = [];
      const seenIds = new Set<string>();
      
      for (const marker of markerArray) {
        if (!seenIds.has(marker.id)) {
          seenIds.add(marker.id);
          uniqueMarkers.push(marker);
        }
      }
      
      return uniqueMarkers;
    };
    
    const markersHaveChanged = (
      oldMarkers: LocationMarker[], 
      newMarkers: LocationMarker[]
    ): boolean => {
      if (oldMarkers.length !== newMarkers.length) {
        return true;
      }
      
      const oldIds = new Set(oldMarkers.map(m => m.id));
      const newIds = new Set(newMarkers.map(m => m.id));
      
      // Check if any IDs were added or removed
      if (oldIds.size !== newIds.size) {
        return true;
      }
      
      // Check if any IDs are different
      for (const id of oldIds) {
        if (!newIds.has(id)) {
          return true;
        }
      }
      
      // Check if any positions changed
      for (let i = 0; i < oldMarkers.length; i++) {
        const oldMarker = oldMarkers[i];
        const newMarker = newMarkers.find(m => m.id === oldMarker.id);
        
        if (!newMarker) {
          return true;
        }
        
        if (
          oldMarker.position[0] !== newMarker.position[0] ||
          oldMarker.position[1] !== newMarker.position[1] ||
          oldMarker.name !== newMarker.name
        ) {
          return true;
        }
      }
      
      return false;
    };
    
    window.addEventListener('markersUpdated', handleMarkersUpdated);
    window.addEventListener('storage', handleMarkersUpdated);
    
    return () => {
      window.removeEventListener('markersUpdated', handleMarkersUpdated);
      window.removeEventListener('storage', handleMarkersUpdated);
    };
  }, []); // Empty dependency array - only run on mount

  // Set up global position update handler for draggable markers
  useEffect(() => {
    window.tempMarkerPositionUpdate = setTempMarker;
    
    return () => {
      delete window.tempMarkerPositionUpdate;
    };
  }, []);

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
  }, [tempMarker, markerName, markerType, currentDrawing]);

  const handleDeleteMarker = useCallback((id: string) => {
    deleteMarker(id);
    // Let the event handler update the state properly
    toast.success("Location removed");
  }, []);

  const handleRegionClick = useCallback((drawing: DrawingData) => {
    setSelectedDrawing(drawing);
    setShowFloorPlan(true);
  }, []);

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
