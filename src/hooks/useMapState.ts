
import { useState, useEffect, useCallback } from 'react';
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
      setMarkers([]);
      setDrawings([]);
      return;
    }
    
    const savedMarkers = getSavedMarkers();
    setMarkers(savedMarkers);
    
    const savedDrawings = getSavedDrawings();
    setDrawings(savedDrawings);
    
    // Listen only to the custom markersSaved event with heavy throttling
    let updateTimeout: NodeJS.Timeout;
    
    const handleMarkersSaved = (event: Event) => {
      if (event instanceof CustomEvent && 
          event.detail?.source === 'storage' && 
          !isProcessingMarker) {
        
        // Clear any existing timeout
        if (updateTimeout) {
          clearTimeout(updateTimeout);
        }
        
        // Heavy debounce - only update every 3 seconds max
        updateTimeout = setTimeout(() => {
          try {
            const updatedMarkers = getSavedMarkers();
            setMarkers(updatedMarkers);
          } catch (error) {
            console.error('Error updating markers:', error);
          }
        }, 3000);
      }
    };
    
    window.addEventListener('markersSaved', handleMarkersSaved);
    
    return () => {
      window.removeEventListener('markersSaved', handleMarkersSaved);
      if (updateTimeout) {
        clearTimeout(updateTimeout);
      }
    };
    
  }, [isAuthenticated, currentUser, isProcessingMarker]);

  // Set up global position update handler for draggable markers
  useEffect(() => {
    window.tempMarkerPositionUpdate = setTempMarker;
    
    return () => {
      delete window.tempMarkerPositionUpdate;
    };
  }, []);

  const handleSaveMarker = useCallback(() => {
    if (!isAuthenticated || !currentUser) {
      toast.error('Please log in to save locations');
      return;
    }
    
    if (!tempMarker || !markerName.trim() || isProcessingMarker) return;
    
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
    
    setTempMarker(null);
    setMarkerName('');
    
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
      
    } catch (error) {
      console.error('Error saving marker:', error);
      toast.error('Failed to save location');
    } finally {
      setTimeout(() => setIsProcessingMarker(false), 2000);
    }
  }, [isAuthenticated, currentUser, tempMarker, markerName, isProcessingMarker, markerType, currentDrawing]);

  const handleDeleteMarker = useCallback((id: string) => {
    if (!isAuthenticated || isProcessingMarker) {
      toast.error('Please log in to manage locations');
      return;
    }
    
    setIsProcessingMarker(true);
    
    try {
      deleteMarker(id);
      toast.success("Location removed");
    } catch (error) {
      console.error('Error deleting marker:', error);
      toast.error('Failed to remove location');
    } finally {
      setTimeout(() => setIsProcessingMarker(false), 2000);
    }
  }, [isAuthenticated, isProcessingMarker]);

  const handleRenameMarker = useCallback((id: string, newName: string) => {
    if (!isAuthenticated || isProcessingMarker) {
      toast.error('Please log in to manage locations');
      return;
    }
    
    setIsProcessingMarker(true);
    
    try {
      renameMarker(id, newName);
    } catch (error) {
      console.error('Error renaming marker:', error);
      toast.error('Failed to rename location');
    } finally {
      setTimeout(() => setIsProcessingMarker(false), 2000);
    }
  }, [isAuthenticated, isProcessingMarker]);

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
    handleRenameMarker,
    handleRegionClick,
    isProcessingMarker
  };
}

declare global {
  interface Window {
    tempMarkerPositionUpdate?: (pos: [number, number]) => void;
  }
}
