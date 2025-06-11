
import { useState, useEffect } from 'react';
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

  // Load existing markers and drawings
  useEffect(() => {
    console.log('Loading data');
    
    const savedMarkers = getSavedMarkers();
    setMarkers(savedMarkers);
    
    const savedDrawings = getSavedDrawings();
    setDrawings(savedDrawings);
    
    // Listen for marker updates
    const handleMarkersUpdated = () => {
      setMarkers(getSavedMarkers());
    };

    // Listen for drawing updates
    const handleDrawingsUpdated = () => {
      setDrawings(getSavedDrawings());
    };
    
    // Listen for floor plan updates
    const handleFloorPlanUpdated = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail && customEvent.detail.drawingId) {
        console.log(`Floor plan updated for drawing ${customEvent.detail.drawingId}, triggering refresh`);
        // Trigger a refresh of the drawings
        handleDrawingsUpdated();
      }
    };
    
    window.addEventListener('markersUpdated', handleMarkersUpdated);
    window.addEventListener('drawingsUpdated', handleDrawingsUpdated);
    window.addEventListener('storage', handleMarkersUpdated);
    window.addEventListener('storage', handleDrawingsUpdated);
    window.addEventListener('floorPlanUpdated', handleFloorPlanUpdated);
    
    return () => {
      window.removeEventListener('markersUpdated', handleMarkersUpdated);
      window.removeEventListener('drawingsUpdated', handleDrawingsUpdated);
      window.removeEventListener('storage', handleMarkersUpdated);
      window.removeEventListener('storage', handleDrawingsUpdated);
      window.removeEventListener('floorPlanUpdated', handleFloorPlanUpdated);
    };
  }, []);

  // Set up global position update handler for draggable markers
  useEffect(() => {
    window.tempMarkerPositionUpdate = setTempMarker;
    
    return () => {
      delete window.tempMarkerPositionUpdate;
    };
  }, []);

  const handleSaveMarker = (finalName?: string) => {
    if (!tempMarker) return;
    
    // Use the passed finalName or fallback to markerName state
    const nameToUse = finalName || markerName.trim();
    if (!nameToUse) return;
    
    console.log('useMapState: handleSaveMarker called with name:', nameToUse);
    
    const newMarker: LocationMarker = {
      id: uuidv4(),
      name: nameToUse,
      position: tempMarker,
      type: markerType,
      createdAt: new Date(),
      associatedDrawing: currentDrawing ? currentDrawing.id : undefined,
      userId: 'anonymous' // Use default user ID since authentication is disabled
    };
    
    console.log('useMapState: Saving marker with final name:', newMarker.name);
    
    // Save the marker first
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
          name: nameToUse,
          associatedMarkerId: newMarker.id
        },
        userId: 'anonymous' // Use default user ID since authentication is disabled
      };
      
      // Save or update the drawing but don't clear it from the map
      saveDrawing(safeDrawing);
    }
    
    // Update the markers state with the new marker IMMEDIATELY
    const updatedMarkers = getSavedMarkers();
    console.log('useMapState: Updated markers after save:', updatedMarkers.map(m => ({ id: m.id, name: m.name })));
    setMarkers(updatedMarkers);
    
    // Clear temp marker and reset form after markers are updated
    setTimeout(() => {
      setTempMarker(null);
      setMarkerName('');
    }, 50);
    
    toast.success("Location saved successfully");
    
    // Force multiple update events to ensure all components refresh
    window.dispatchEvent(new Event('drawingsUpdated'));
    window.dispatchEvent(new Event('markersUpdated'));
    
    setTimeout(() => {
      window.dispatchEvent(new Event('markersUpdated'));
    }, 100);
  };

  const handleDeleteMarker = (id: string) => {
    deleteMarker(id);
    // Update the markers state
    setMarkers(markers.filter(marker => marker.id !== id));
    toast.success("Location removed");
  };

  const handleRenameMarker = (id: string, newName: string) => {
    renameMarker(id, newName);
    // Update the markers state
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
