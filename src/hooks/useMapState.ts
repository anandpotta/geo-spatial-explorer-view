
import { useState, useEffect } from 'react';
import { Location, LocationMarker } from '@/utils/geo-utils';
import { DrawingData, saveDrawing, getSavedDrawings, deleteDrawing } from '@/utils/drawing-utils';
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
    
    window.addEventListener('markersUpdated', handleMarkersUpdated);
    window.addEventListener('storage', handleMarkersUpdated);
    window.addEventListener('storage', handleDrawingsUpdated);
    
    return () => {
      window.removeEventListener('markersUpdated', handleMarkersUpdated);
      window.removeEventListener('storage', handleMarkersUpdated);
      window.removeEventListener('storage', handleDrawingsUpdated);
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
      
      // Save or update the drawing but don't clear it from the map
      saveDrawing(safeDrawing);
    }
    
    // Clear the temporary marker to allow placing a new one
    setTempMarker(null);
    setMarkerName('');
    
    // Important: Don't reset currentDrawing here, 
    // this keeps the connection between marker and drawing
    // and prevents the drawing from disappearing
    
    // Update the markers state with the new marker
    setMarkers(getSavedMarkers());
    
    toast.success("Location saved successfully");
    
    // Ensure drawings remain visible by dispatching a custom event
    window.dispatchEvent(new Event('drawingsUpdated'));
  };

  const handleDeleteMarker = (id: string) => {
    deleteMarker(id);
    // Update the markers state
    setMarkers(markers.filter(marker => marker.id !== id));
    toast.success("Location removed");
  };
  
  const handleRemoveShape = (drawingId: string) => {
    deleteDrawing(drawingId);
    
    // Also delete any associated marker
    const associatedMarker = markers.find(m => m.associatedDrawing === drawingId);
    if (associatedMarker) {
      deleteMarker(associatedMarker.id);
      setMarkers(markers.filter(m => m.id !== associatedMarker.id));
    }
    
    // Update the drawings state
    setDrawings(drawings.filter(d => d.id !== drawingId));
    
    toast.success("Shape removed");
    
    // Dispatch events to ensure UI updates
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new Event('markersUpdated'));
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
    handleRemoveShape,
    handleRegionClick
  };
}

// Extend the Window interface to include our custom property
declare global {
  interface Window {
    tempMarkerPositionUpdate?: (pos: [number, number]) => void;
  }
}
