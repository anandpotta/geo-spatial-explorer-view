
import { useState, useEffect } from 'react';
import { Location, LocationMarker } from '@/utils/geo-utils';
import { DrawingData, saveDrawing, getSavedDrawings } from '@/utils/drawing-utils';
import { saveMarker, deleteMarker, getSavedMarkers, renameMarker } from '@/utils/marker-utils';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

export function useMapState(selectedLocation?: Location) {
  const { currentUser, isAuthenticated } = useAuth();
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
  const [isProcessingMarker, setIsProcessingMarker] = useState(false);

  // Load existing markers and drawings when user changes or auth state changes
  useEffect(() => {
    if (!isAuthenticated || !currentUser) {
      // Clear data when user logs out
      setMarkers([]);
      setDrawings([]);
      return;
    }
    
    console.log(`Loading data for user: ${currentUser.id}`);
    
    const savedMarkers = getSavedMarkers();
    setMarkers(savedMarkers);
    
    const savedDrawings = getSavedDrawings();
    setDrawings(savedDrawings);
    
    // Set up event listener for markers updates - but prevent loops
    let isHandlingEvent = false;
    
    const handleMarkersUpdated = () => {
      if (isHandlingEvent || isProcessingMarker) return;
      
      isHandlingEvent = true;
      console.log('Markers updated - refreshing markers list');
      
      setTimeout(() => {
        const updatedMarkers = getSavedMarkers();
        setMarkers(updatedMarkers);
        isHandlingEvent = false;
      }, 50);
    };
    
    // Only listen to markersUpdated to prevent circular events
    window.addEventListener('markersUpdated', handleMarkersUpdated);
    
    return () => {
      window.removeEventListener('markersUpdated', handleMarkersUpdated);
    };
    
  }, [isAuthenticated, currentUser]);

  // Set up global position update handler for draggable markers
  useEffect(() => {
    window.tempMarkerPositionUpdate = setTempMarker;
    
    return () => {
      delete window.tempMarkerPositionUpdate;
    };
  }, []);

  const handleSaveMarker = () => {
    if (!isAuthenticated || !currentUser) {
      toast.error('Please log in to save locations');
      return;
    }
    
    if (!tempMarker || !markerName.trim() || isProcessingMarker) return;
    
    console.log('Starting marker save process');
    
    // Prevent multiple simultaneous saves
    setIsProcessingMarker(true);
    
    const newMarker: LocationMarker = {
      id: uuidv4(),
      name: markerName,
      position: tempMarker,
      type: markerType,
      createdAt: new Date(),
      associatedDrawing: currentDrawing ? currentDrawing.id : undefined,
      userId: currentUser.id
    };
    
    // Clear the temporary marker IMMEDIATELY to prevent flickering
    setTempMarker(null);
    setMarkerName('');
    
    // Save the marker to storage (this will trigger the event listener above)
    try {
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
          userId: currentUser.id
        };
        
        saveDrawing(safeDrawing);
      }
      
      toast.success("Location saved successfully");
      console.log('Marker saved successfully');
      
    } catch (error) {
      console.error('Error saving marker:', error);
      toast.error('Failed to save location');
    } finally {
      setTimeout(() => setIsProcessingMarker(false), 300);
    }
  };

  const handleDeleteMarker = (id: string) => {
    if (!isAuthenticated || isProcessingMarker) {
      toast.error('Please log in to manage locations');
      return;
    }
    
    console.log(`Starting marker deletion for ID: ${id}`);
    setIsProcessingMarker(true);
    
    try {
      deleteMarker(id);
      toast.success("Location removed");
      console.log('Marker deleted successfully');
    } catch (error) {
      console.error('Error deleting marker:', error);
      toast.error('Failed to remove location');
    } finally {
      setTimeout(() => setIsProcessingMarker(false), 300);
    }
  };

  const handleRenameMarker = (id: string, newName: string) => {
    if (!isAuthenticated || isProcessingMarker) {
      toast.error('Please log in to manage locations');
      return;
    }
    
    console.log(`Starting marker rename for ID: ${id} to: ${newName}`);
    setIsProcessingMarker(true);
    
    try {
      renameMarker(id, newName);
      console.log('Marker renamed successfully');
    } catch (error) {
      console.error('Error renaming marker:', error);
      toast.error('Failed to rename location');
    } finally {
      setTimeout(() => setIsProcessingMarker(false), 300);
    }
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
    handleRegionClick,
    isProcessingMarker
  };
}

// Extend the Window interface to include our custom property
declare global {
  interface Window {
    tempMarkerPositionUpdate?: (pos: [number, number]) => void;
  }
}
