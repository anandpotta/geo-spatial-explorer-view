
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
    
    // Debounced event handlers to prevent rapid-fire updates
    let markersTimeout: NodeJS.Timeout | null = null;
    let drawingsTimeout: NodeJS.Timeout | null = null;
    
    const handleMarkersUpdated = () => {
      if (!isAuthenticated || !currentUser || isProcessingMarker) return;
      
      if (markersTimeout) clearTimeout(markersTimeout);
      markersTimeout = setTimeout(() => {
        setMarkers(getSavedMarkers());
      }, 100);
    };

    const handleDrawingsUpdated = () => {
      if (!isAuthenticated || !currentUser) return;
      
      if (drawingsTimeout) clearTimeout(drawingsTimeout);
      drawingsTimeout = setTimeout(() => {
        setDrawings(getSavedDrawings());
      }, 100);
    };
    
    // Listen for floor plan updates
    const handleFloorPlanUpdated = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail && customEvent.detail.drawingId) {
        console.log(`Floor plan updated for drawing ${customEvent.detail.drawingId}, triggering refresh`);
        handleDrawingsUpdated();
      }
    };
    
    window.addEventListener('markersUpdated', handleMarkersUpdated);
    window.addEventListener('drawingsUpdated', handleDrawingsUpdated);
    window.addEventListener('storage', handleMarkersUpdated);
    window.addEventListener('storage', handleDrawingsUpdated);
    window.addEventListener('floorPlanUpdated', handleFloorPlanUpdated);
    
    return () => {
      if (markersTimeout) clearTimeout(markersTimeout);
      if (drawingsTimeout) clearTimeout(drawingsTimeout);
      window.removeEventListener('markersUpdated', handleMarkersUpdated);
      window.removeEventListener('drawingsUpdated', handleDrawingsUpdated);
      window.removeEventListener('storage', handleMarkersUpdated);
      window.removeEventListener('storage', handleDrawingsUpdated);
      window.removeEventListener('floorPlanUpdated', handleFloorPlanUpdated);
    };
  }, [isAuthenticated, currentUser, isProcessingMarker]);

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
    
    // Update UI state immediately to prevent flickering
    setMarkers(prev => {
      const filtered = prev.filter(m => m.id !== newMarker.id);
      return [...filtered, newMarker];
    });
    
    // Save the marker to storage without triggering immediate UI updates
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
      
      // Clean up DOM elements after a delay
      setTimeout(() => {
        const markerId = `temp-marker-${tempMarker[0]}-${tempMarker[1]}`;
        const tempIcons = document.querySelectorAll(`.leaflet-marker-icon[data-marker-id="${markerId}"], .leaflet-marker-shadow[data-marker-id="${markerId}"]`);
        tempIcons.forEach(icon => {
          if (icon.parentNode) {
            icon.parentNode.removeChild(icon);
          }
        });
        
        setIsProcessingMarker(false);
      }, 200);
      
    } catch (error) {
      console.error('Error saving marker:', error);
      toast.error('Failed to save location');
      setIsProcessingMarker(false);
    }
  };

  const handleDeleteMarker = (id: string) => {
    if (!isAuthenticated || isProcessingMarker) {
      toast.error('Please log in to manage locations');
      return;
    }
    
    setIsProcessingMarker(true);
    
    // Update UI immediately
    setMarkers(prev => prev.filter(marker => marker.id !== id));
    
    try {
      deleteMarker(id);
      toast.success("Location removed");
    } catch (error) {
      console.error('Error deleting marker:', error);
      toast.error('Failed to remove location');
      // Restore marker on error
      setMarkers(getSavedMarkers());
    } finally {
      setTimeout(() => setIsProcessingMarker(false), 200);
    }
  };

  const handleRenameMarker = (id: string, newName: string) => {
    if (!isAuthenticated || isProcessingMarker) {
      toast.error('Please log in to manage locations');
      return;
    }
    
    setIsProcessingMarker(true);
    
    try {
      renameMarker(id, newName);
      // Update UI immediately
      setMarkers(prev => prev.map(marker => 
        marker.id === id ? { ...marker, name: newName } : marker
      ));
    } catch (error) {
      console.error('Error renaming marker:', error);
      toast.error('Failed to rename location');
    } finally {
      setTimeout(() => setIsProcessingMarker(false), 200);
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
