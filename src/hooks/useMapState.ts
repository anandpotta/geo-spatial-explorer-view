
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

  // Load existing markers and drawings on mount only
  useEffect(() => {
    console.log('Loading initial data');
    
    const savedMarkers = getSavedMarkers();
    setMarkers(savedMarkers);
    
    const savedDrawings = getSavedDrawings();
    setDrawings(savedDrawings);
    
    // Set up event listeners only once
    const handleMarkersUpdated = () => {
      console.log('Markers updated event received');
      setMarkers(getSavedMarkers());
    };

    const handleDrawingsUpdated = () => {
      console.log('Drawings updated event received');
      setDrawings(getSavedDrawings());
    };
    
    const handleFloorPlanUpdated = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail && customEvent.detail.drawingId) {
        console.log(`Floor plan updated for drawing ${customEvent.detail.drawingId}`);
        handleDrawingsUpdated();
      }
    };
    
    window.addEventListener('markersUpdated', handleMarkersUpdated);
    window.addEventListener('drawingsUpdated', handleDrawingsUpdated);
    window.addEventListener('storage', handleMarkersUpdated);
    window.addEventListener('floorPlanUpdated', handleFloorPlanUpdated);
    
    return () => {
      window.removeEventListener('markersUpdated', handleMarkersUpdated);
      window.removeEventListener('drawingsUpdated', handleDrawingsUpdated);
      window.removeEventListener('storage', handleMarkersUpdated);
      window.removeEventListener('floorPlanUpdated', handleFloorPlanUpdated);
    };
  }, []); // Empty dependency array to run only once

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
      userId: 'default-user' // Use default user since auth is removed
    };
    
    // Clear the temporary marker BEFORE saving to prevent duplicate rendering
    setTempMarker(null);
    
    // Save the marker
    saveMarker(newMarker);
    
    if (currentDrawing) {
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
        userId: 'default-user'
      };
      
      saveDrawing(safeDrawing);
    }
    
    // Clear and reset UI state
    setMarkerName('');
    
    // Update the markers state
    setMarkers(getSavedMarkers());
    
    toast.success("Location saved successfully");
    
    // Dispatch update event
    window.dispatchEvent(new Event('drawingsUpdated'));
  };

  const handleDeleteMarker = (id: string) => {
    deleteMarker(id);
    setMarkers(markers.filter(marker => marker.id !== id));
    toast.success("Location removed");
  };

  const handleRenameMarker = (id: string, newName: string) => {
    renameMarker(id, newName);
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
