
import { useState, useEffect, useRef } from 'react';
import { Location, LocationMarker } from '@/utils/geo-utils';
import { DrawingData, saveDrawing, getSavedDrawings } from '@/utils/drawing-utils';
import { saveMarker, deleteMarker, getSavedMarkers, renameMarker } from '@/utils/marker-utils';
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

  // Use refs to prevent infinite loops
  const isLoadingRef = useRef(false);
  const lastUpdateRef = useRef<number>(0);

  // Load existing markers and drawings with debounce
  useEffect(() => {
    const loadData = () => {
      if (isLoadingRef.current) return;
      
      isLoadingRef.current = true;
      console.log('Loading data');
      
      try {
        const savedMarkers = getSavedMarkers();
        const savedDrawings = getSavedDrawings();
        
        setMarkers(savedMarkers);
        setDrawings(savedDrawings);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        isLoadingRef.current = false;
      }
    };

    // Debounced event handlers to prevent loops
    const handleMarkersUpdated = () => {
      const now = Date.now();
      if (now - lastUpdateRef.current < 100) return; // Debounce 100ms
      lastUpdateRef.current = now;
      
      if (!isLoadingRef.current) {
        setMarkers(getSavedMarkers());
      }
    };

    const handleDrawingsUpdated = () => {
      const now = Date.now();
      if (now - lastUpdateRef.current < 100) return; // Debounce 100ms
      lastUpdateRef.current = now;
      
      if (!isLoadingRef.current) {
        setDrawings(getSavedDrawings());
      }
    };
    
    const handleFloorPlanUpdated = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail && customEvent.detail.drawingId) {
        console.log(`Floor plan updated for drawing ${customEvent.detail.drawingId}, triggering refresh`);
        handleDrawingsUpdated();
      }
    };

    // Initial load
    loadData();
    
    // Add event listeners with debounced handlers
    window.addEventListener('markersUpdated', handleMarkersUpdated);
    window.addEventListener('drawingsUpdated', handleDrawingsUpdated);
    window.addEventListener('floorPlanUpdated', handleFloorPlanUpdated);
    
    return () => {
      window.removeEventListener('markersUpdated', handleMarkersUpdated);
      window.removeEventListener('drawingsUpdated', handleDrawingsUpdated);
      window.removeEventListener('floorPlanUpdated', handleFloorPlanUpdated);
    };
  }, []); // Remove dependencies to prevent loops

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
      associatedDrawing: currentDrawing ? currentDrawing.id : undefined,
      userId: 'anonymous'
    };
    
    // Clear the temporary marker BEFORE saving to prevent duplicate rendering
    setTempMarker(null);
    
    // Save the marker
    saveMarker(newMarker);
    
    if (currentDrawing) {
      // Create a safe copy of currentDrawing without circular references
      const safeDrawing: DrawingData = {
        ...currentDrawing,
        geoJSON: currentDrawing.geoJSON ? JSON.parse(JSON.stringify({
          type: currentDrawing.geoJSON.type,
          geometry: currentDrawing.geoJSON.geometry,
          properties: currentDrawing.geoJSON.properties
        })) : undefined,
        properties: {
          ...currentDrawing.properties,
          name: markerName,
          associatedMarkerId: newMarker.id
        },
        userId: 'anonymous'
      };
      
      // Save or update the drawing but don't clear it from the map
      saveDrawing(safeDrawing);
    }
    
    // Clear and reset UI state
    setMarkerName('');
    
    // Update the markers state directly to avoid event loops
    setMarkers(prev => [...prev.filter(m => m.id !== newMarker.id), newMarker]);
    
    toast.success("Location saved successfully");
    
    // Clean up any leftover temporary marker DOM elements after a slight delay
    setTimeout(() => {
      if (tempMarker) {
        const markerId = `temp-marker-${tempMarker[0]}-${tempMarker[1]}`;
        const tempIcons = document.querySelectorAll(`.leaflet-marker-icon[data-marker-id="${markerId}"], .leaflet-marker-shadow[data-marker-id="${markerId}"]`);
        tempIcons.forEach(icon => {
          if (icon.parentNode) {
            icon.parentNode.removeChild(icon);
          }
        });
      }
    }, 100);
  };

  const handleDeleteMarker = (id: string) => {
    deleteMarker(id);
    // Update the markers state directly to avoid event loops
    setMarkers(prev => prev.filter(marker => marker.id !== id));
    toast.success("Location removed");
  };

  const handleRenameMarker = (id: string, newName: string) => {
    renameMarker(id, newName);
    // Update the markers state directly to avoid event loops
    setMarkers(getSavedMarkers());
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
    handleRenameMarker,
    handleRegionClick
  };
}

// Extend the Window interface to include our custom property
declare global {
  interface Window {
    tempMarkerPositionUpdate?: (pos: [number, number]) => void;
  }
}
