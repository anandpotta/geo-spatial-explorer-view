import { useState, useEffect, useRef } from 'react';
import { LocationMarker, getSavedMarkers } from '@/utils/marker-utils';
import { toast } from 'sonner';

export const useDropdownLocations = () => {
  const [markers, setMarkers] = useState<LocationMarker[]>([]);
  const [pinnedMarkers, setPinnedMarkers] = useState<LocationMarker[]>([]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [markerToDelete, setMarkerToDelete] = useState<LocationMarker | null>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  
  const loadMarkers = () => {
    console.log("Loading markers for dropdown");
    const savedMarkers = getSavedMarkers();
    setMarkers(savedMarkers);
    const pinned = savedMarkers.filter(marker => marker.isPinned === true);
    setPinnedMarkers(pinned);
  };

  useEffect(() => {
    loadMarkers();
    
    const handleStorage = () => {
      console.log("Storage event detected");
      loadMarkers();
    };
    
    const handleMarkersUpdated = () => {
      console.log("Markers updated event detected");
      loadMarkers();
    };
    
    window.addEventListener('storage', handleStorage);
    window.addEventListener('markersUpdated', handleMarkersUpdated);
    
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('markersUpdated', handleMarkersUpdated);
    };
  }, []);

  useEffect(() => {
    if (!isDeleteDialogOpen) {
      const timer = setTimeout(() => {
        setMarkerToDelete(null);
      }, 150);
      
      return () => clearTimeout(timer);
    }
  }, [isDeleteDialogOpen]);

  return {
    markers,
    pinnedMarkers,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    markerToDelete,
    setMarkerToDelete,
    returnFocusRef
  };
};
