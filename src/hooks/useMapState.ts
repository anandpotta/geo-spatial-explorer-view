
import { useState, useEffect, useCallback, useRef } from 'react';
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
  
  // Use refs to prevent unnecessary re-renders
  const currentUserRef = useRef(currentUser);
  const isAuthenticatedRef = useRef(isAuthenticated);
  const loadTimeoutRef = useRef<NodeJS.Timeout>();

  // Update refs when auth state changes
  useEffect(() => {
    currentUserRef.current = currentUser;
    isAuthenticatedRef.current = isAuthenticated;
  }, [currentUser, isAuthenticated]);

  // Memoized load functions to prevent recreation
  const loadMarkers = useCallback(() => {
    if (!isAuthenticatedRef.current || !currentUserRef.current) {
      setMarkers([]);
      return;
    }
    
    try {
      const savedMarkers = getSavedMarkers();
      setMarkers(savedMarkers);
    } catch (error) {
      console.error('Error loading markers:', error);
    }
  }, []);

  const loadDrawings = useCallback(() => {
    if (!isAuthenticatedRef.current || !currentUserRef.current) {
      setDrawings([]);
      return;
    }
    
    try {
      const savedDrawings = getSavedDrawings();
      setDrawings(savedDrawings);
    } catch (error) {
      console.error('Error loading drawings:', error);
    }
  }, []);

  // Load initial data when auth state changes (with debouncing)
  useEffect(() => {
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
    }
    
    loadTimeoutRef.current = setTimeout(() => {
      loadMarkers();
      loadDrawings();
    }, 100);

    return () => {
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
      }
    };
  }, [isAuthenticated, currentUser, loadMarkers, loadDrawings]);

  // Debounced event handlers to prevent loops
  const handleStorageUpdate = useCallback(() => {
    if (isProcessingMarker || !isAuthenticatedRef.current) return;
    
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
    }
    
    loadTimeoutRef.current = setTimeout(() => {
      loadMarkers();
    }, 1000); // Longer debounce to prevent loops
  }, [isProcessingMarker, loadMarkers]);

  // Listen for storage events with heavy debouncing
  useEffect(() => {
    const handleMarkersSaved = (event: Event) => {
      if (event instanceof CustomEvent && 
          event.detail?.source === 'storage' && 
          !isProcessingMarker) {
        handleStorageUpdate();
      }
    };
    
    window.addEventListener('markersSaved', handleMarkersSaved);
    
    return () => {
      window.removeEventListener('markersSaved', handleMarkersSaved);
    };
  }, [handleStorageUpdate, isProcessingMarker]);

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
