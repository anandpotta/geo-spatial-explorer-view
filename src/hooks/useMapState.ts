
import { useState, useEffect, useCallback, useRef } from 'react';
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
  
  // Reference to track if component is mounted
  const isMountedRef = useRef(true);

  // Check for stored marker on mount
  useEffect(() => {
    try {
      const storedMarkerPos = localStorage.getItem('tempMarkerPosition');
      const storedMarkerName = localStorage.getItem('tempMarkerName');
      
      if (storedMarkerPos) {
        const position = JSON.parse(storedMarkerPos) as [number, number];
        setTempMarker(position);
        
        // Set global flags
        window.tempMarkerPlaced = true;
        window.userHasInteracted = true;
        
        if (storedMarkerName) {
          setMarkerName(storedMarkerName);
        } else {
          setMarkerName('New Building');
        }
        
        console.log('Restored marker from localStorage:', position);
      }
    } catch (error) {
      console.error('Error restoring marker from localStorage:', error);
    }
    
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Load saved markers on component mount
  useEffect(() => {
    const loadMarkers = () => {
      const savedMarkers = getSavedMarkers();
      if (isMountedRef.current) {
        setMarkers(savedMarkers);
      }
    };
    
    loadMarkers();

    // Listen for marker updates
    const handleMarkersUpdated = () => {
      loadMarkers();
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
    window.tempMarkerPositionUpdate = (pos) => {
      // If position is null, don't clear state immediately
      // This prevents marker from disappearing during map navigation
      if (pos === null) {
        // Double-check if we should actually clear the marker
        if (!window.tempMarkerPlaced) {
          setTimeout(() => {
            if (isMountedRef.current) {
              setTempMarker(null);
            }
          }, 100);
        }
      } else {
        if (isMountedRef.current) {
          setTempMarker(pos);
          
          // Save to localStorage
          try {
            localStorage.setItem('tempMarkerPosition', JSON.stringify(pos));
          } catch (error) {
            console.error('Failed to save marker position to localStorage:', error);
          }
          
          // Reinforce flags to prevent map navigation
          window.tempMarkerPlaced = true;
          window.userHasInteracted = true;
        }
      }
    };
    
    return () => {
      delete window.tempMarkerPositionUpdate;
    };
  }, []);

  const handleSaveMarker = useCallback(() => {
    if (!tempMarker || !markerName.trim()) {
      toast.error('Please provide a name for the marker');
      return;
    }
    
    const newMarker: LocationMarker = {
      id: uuidv4(),
      name: markerName,
      position: tempMarker,
      type: markerType,
      createdAt: new Date(),
      associatedDrawing: currentDrawing ? currentDrawing.id : undefined
    };
    
    saveMarker(newMarker);
    
    if (currentDrawing) {
      // Create a safe copy of currentDrawing without circular references
      const safeDrawing: DrawingData = {
        ...currentDrawing,
        // Remove any potential circular references from geoJSON
        geoJSON: currentDrawing.geoJSON ? JSON.parse(JSON.stringify({
          type: currentDrawing.geoJSON.type,
          geometry: currentDrawing.geoJSON.geometry,
          properties: currentDrawing.geoJSON.properties || {}
        })) : undefined,
        properties: {
          ...currentDrawing.properties,
          name: markerName,
          associatedMarkerId: newMarker.id
        }
      };
      
      saveDrawing(safeDrawing);
    }
    
    // Clear localStorage
    localStorage.removeItem('tempMarkerPosition');
    localStorage.removeItem('tempMarkerName');
    
    // Clear the temporary marker immediately to prevent duplicate markers
    // But keep the flags set to prevent map reloading
    setTempMarker(null);
    setMarkerName('');
    setCurrentDrawing(null);
    
    // Disable any active tool after saving to prevent immediate re-creation of marker
    setActiveTool(null);
    
    toast.success("Location saved successfully");
  }, [tempMarker, markerName, markerType, currentDrawing]);

  const handleDeleteMarker = useCallback((id: string) => {
    deleteMarker(id);
    toast.success("Location removed");
  }, []);

  const handleRegionClick = useCallback((drawing: DrawingData) => {
    setSelectedDrawing(drawing);
    setShowFloorPlan(true);
  }, []);

  // Add the handleClearAll function to clear map state
  const handleClearAll = useCallback(() => {
    // Clear localStorage
    localStorage.removeItem('tempMarkerPosition');
    localStorage.removeItem('tempMarkerName');
    
    setTempMarker(null);
    setMarkerName('');
    setMarkerType('building');
    setCurrentDrawing(null);
    setShowFloorPlan(false);
    setSelectedDrawing(null);
    setActiveTool(null);
    
    // Dispatch events to notify other components about the clearing
    window.dispatchEvent(new Event('markersUpdated'));
    window.dispatchEvent(new Event('storage'));
    
    toast.success('All active elements cleared');
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
    handleRegionClick,
    handleClearAll
  };
}

// Extend the Window interface to include our custom properties
declare global {
  interface Window {
    tempMarkerPositionUpdate?: (pos: [number, number] | null) => void;
    tempMarkerPlaced?: boolean;
    userHasInteracted?: boolean;
  }
}
