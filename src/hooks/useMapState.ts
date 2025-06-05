
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
  
  // Stable refs to prevent re-renders
  const currentUserIdRef = useRef<string | null>(null);
  const isAuthenticatedRef = useRef(false);
  const loadTimeoutRef = useRef<NodeJS.Timeout>();
  const lastLoadTime = useRef(0);

  // Update refs without triggering re-renders
  currentUserIdRef.current = currentUser?.id || null;
  isAuthenticatedRef.current = isAuthenticated;

  // Stable load functions with heavy debouncing
  const loadMarkers = useCallback(() => {
    const now = Date.now();
    if (now - lastLoadTime.current < 2000) return; // Prevent frequent calls
    lastLoadTime.current = now;
    
    if (!isAuthenticatedRef.current || !currentUserIdRef.current) {
      setMarkers([]);
      return;
    }
    
    try {
      const savedMarkers = getSavedMarkers();
      setMarkers(savedMarkers);
    } catch (error) {
      console.error('Error loading markers:', error);
    }
  }, []); // No dependencies to keep stable

  const loadDrawings = useCallback(() => {
    if (!isAuthenticatedRef.current || !currentUserIdRef.current) {
      setDrawings([]);
      return;
    }
    
    try {
      const savedDrawings = getSavedDrawings();
      setDrawings(savedDrawings);
    } catch (error) {
      console.error('Error loading drawings:', error);
    }
  }, []); // No dependencies to keep stable

  // Load initial data only on auth state changes with heavy debouncing
  useEffect(() => {
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
    }
    
    loadTimeoutRef.current = setTimeout(() => {
      loadMarkers();
      loadDrawings();
    }, 1000); // Increased debounce

    return () => {
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
      }
    };
  }, [isAuthenticated, currentUser?.id]); // Only depend on auth state

  // Minimal storage event handler
  const handleStorageUpdate = useCallback(() => {
    if (isProcessingMarker || !isAuthenticatedRef.current) return;
    
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
    }
    
    loadTimeoutRef.current = setTimeout(() => {
      loadMarkers();
    }, 2000); // Very long debounce
  }, [isProcessingMarker, loadMarkers]);

  // Minimal event listeners
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

  // Set up global position update handler
  useEffect(() => {
    window.tempMarkerPositionUpdate = setTempMarker;
    
    return () => {
      delete window.tempMarkerPositionUpdate;
    };
  }, []);

  // Stable handlers with minimal dependencies
  const handleSaveMarker = useCallback(() => {
    if (!isAuthenticatedRef.current || !currentUserIdRef.current) {
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
      userId: currentUserIdRef.current
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
          userId: currentUserIdRef.current
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
  }, [tempMarker, markerName, isProcessingMarker, markerType, currentDrawing]); // Only essential dependencies

  const handleDeleteMarker = useCallback((id: string) => {
    if (!isAuthenticatedRef.current || isProcessingMarker) {
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
  }, [isProcessingMarker]);

  const handleRenameMarker = useCallback((id: string, newName: string) => {
    if (!isAuthenticatedRef.current || isProcessingMarker) {
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
  }, [isProcessingMarker]);

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
