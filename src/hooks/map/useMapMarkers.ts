
import { useState, useEffect, useCallback, useRef } from 'react';
import { LocationMarker } from '@/utils/geo-utils';
import { saveMarker, deleteMarker, getSavedMarkers, renameMarker } from '@/utils/marker-utils';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

export function useMapMarkers() {
  const { currentUser, isAuthenticated } = useAuth();
  const [markers, setMarkers] = useState<LocationMarker[]>([]);
  const [tempMarker, setTempMarker] = useState<[number, number] | null>(null);
  const [markerName, setMarkerName] = useState('');
  const [markerType, setMarkerType] = useState<'pin' | 'area' | 'building'>('building');
  const [isProcessingMarker, setIsProcessingMarker] = useState(false);
  
  const currentUserIdRef = useRef<string | null>(null);
  const isAuthenticatedRef = useRef(false);
  const loadTimeoutRef = useRef<NodeJS.Timeout>();
  const lastLoadTime = useRef(0);

  // Update refs without triggering re-renders
  currentUserIdRef.current = currentUser?.id || null;
  isAuthenticatedRef.current = isAuthenticated;

  const loadMarkers = useCallback(() => {
    const now = Date.now();
    if (now - lastLoadTime.current < 2000) return;
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
  }, []);

  const handleSaveMarker = useCallback((currentDrawing: any) => {
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
      toast.success("Location saved successfully");
    } catch (error) {
      console.error('Error saving marker:', error);
      toast.error('Failed to save location');
    } finally {
      setTimeout(() => setIsProcessingMarker(false), 2000);
    }
  }, [tempMarker, markerName, isProcessingMarker, markerType]);

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

  // Load initial data and set up event listeners
  useEffect(() => {
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
    }
    
    loadTimeoutRef.current = setTimeout(() => {
      loadMarkers();
    }, 1000);

    return () => {
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
      }
    };
  }, [isAuthenticated, currentUser?.id, loadMarkers]);

  // Storage event handler
  useEffect(() => {
    const handleStorageUpdate = () => {
      if (isProcessingMarker || !isAuthenticatedRef.current) return;
      
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
      }
      
      loadTimeoutRef.current = setTimeout(() => {
        loadMarkers();
      }, 2000);
    };

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
  }, [isProcessingMarker, loadMarkers]);

  return {
    markers,
    setMarkers,
    tempMarker,
    setTempMarker,
    markerName,
    setMarkerName,
    markerType,
    setMarkerType,
    isProcessingMarker,
    handleSaveMarker,
    handleDeleteMarker,
    handleRenameMarker
  };
}
