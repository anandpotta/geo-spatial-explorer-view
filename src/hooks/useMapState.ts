
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
  const prevMarkersRef = useRef<LocationMarker[]>([]);
  const lastEventTimeRef = useRef<number>(0);

  // Load existing markers on mount
  useEffect(() => {
    const savedMarkers = getSavedMarkers();
    setMarkers(savedMarkers);
    prevMarkersRef.current = savedMarkers;
    
    // Listen for marker updates
    const handleMarkersUpdated = (event: Event) => {
      const customEvent = event as CustomEvent;
      const timestamp = customEvent.detail?.timestamp || Date.now();
      
      // Prevent duplicate processing of the same event
      if (timestamp <= lastEventTimeRef.current) {
        console.log("Skipping duplicate markers updated event");
        return;
      }
      
      lastEventTimeRef.current = timestamp;
      
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
      
      // Only update state if the marker set has actually changed
      const currentIds = new Set(prevMarkersRef.current.map(m => m.id));
      const newIds = new Set(uniqueMarkers.map(m => m.id));
      
      const hasChanges = 
        uniqueMarkers.length !== prevMarkersRef.current.length || 
        [...newIds].some(id => !currentIds.has(id));
      
      if (hasChanges) {
        console.log(`Updating markers state with ${uniqueMarkers.length} unique markers`);
        setMarkers(uniqueMarkers);
        prevMarkersRef.current = uniqueMarkers;
      }
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
