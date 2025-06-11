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
      const updatedMarkers = getSavedMarkers();
      setMarkers(updatedMarkers);
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

  const handleSaveMarker = (nameOverride?: string) => {
    if (!tempMarker) {
      console.log('No temp marker to save');
      return;
    }
    
    // Use the provided name override or fall back to markerName state
    const finalName = (nameOverride || markerName).trim() || 'Unnamed Location';
    console.log('Saving marker with final name:', finalName, 'from nameOverride:', nameOverride, 'markerName state:', markerName);
    
    const newMarker: LocationMarker = {
      id: uuidv4(),
      name: finalName,
      position: tempMarker,
      type: markerType,
      createdAt: new Date(),
      associatedDrawing: currentDrawing ? currentDrawing.id : undefined,
      userId: 'anonymous' // Default user since we removed auth
    };
    
    // Clear the temporary marker BEFORE saving to prevent duplicate rendering
    setTempMarker(null);
    
    // Save the marker
    saveMarker(newMarker);
    console.log('Marker saved:', newMarker);
    
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
          name: finalName,
          associatedMarkerId: newMarker.id
        },
        userId: 'anonymous'
      };
      
      // Save or update the drawing but don't clear it from the map
      saveDrawing(safeDrawing);
    }
    
    // Clear and reset UI state
    setMarkerName('');
    
    // Update the markers state immediately with the fresh data from storage
    const updatedMarkers = getSavedMarkers();
    setMarkers(updatedMarkers);
    
    toast.success("Location saved successfully");
    
    // Ensure drawings remain visible by dispatching a custom event
    window.dispatchEvent(new Event('drawingsUpdated'));
    
    // Dispatch a specific event to trigger marker updates with the new marker
    window.dispatchEvent(new CustomEvent('markersUpdated', { 
      detail: { newMarker, action: 'saved' } 
    }));
    
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
    // Update the markers state immediately
    const updatedMarkers = getSavedMarkers();
    setMarkers(updatedMarkers);
    toast.success("Location removed");
  };

  const handleRenameMarker = (id: string, newName: string) => {
    console.log('Renaming marker:', id, 'to:', newName);
    renameMarker(id, newName);
    // Update the markers state immediately
    const updatedMarkers = getSavedMarkers();
    setMarkers(updatedMarkers);
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
