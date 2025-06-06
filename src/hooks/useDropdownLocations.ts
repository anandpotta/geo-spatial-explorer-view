
import { useState, useEffect, useRef } from 'react';
import { LocationMarker, getSavedMarkers } from '@/utils/marker-utils';

export const useDropdownLocations = () => {
  const [markers, setMarkers] = useState<LocationMarker[]>([]);
  const [pinnedMarkers, setPinnedMarkers] = useState<LocationMarker[]>([]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [markerToDelete, setMarkerToDelete] = useState<LocationMarker | null>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const isLoadingRef = useRef(false);
  
  const loadMarkers = () => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;
    
    console.log("Loading markers for dropdown");
    const savedMarkers = getSavedMarkers();
    setMarkers(savedMarkers);
    const pinned = savedMarkers.filter(marker => marker.isPinned === true);
    setPinnedMarkers(pinned);
    
    setTimeout(() => {
      isLoadingRef.current = false;
    }, 100);
  };

  useEffect(() => {
    loadMarkers();
    
    const handleMarkersUpdated = () => {
      if (isLoadingRef.current) return;
      console.log("Markers updated event detected in dropdown");
      loadMarkers();
    };
    
    // Only listen to markersUpdated, not storage events to avoid loops
    window.addEventListener('markersUpdated', handleMarkersUpdated);
    
    return () => {
      window.removeEventListener('markersUpdated', handleMarkersUpdated);
    };
  }, []);

  const cleanupMarkerReferences = () => {
    const staleDialogs = document.querySelectorAll('[role="dialog"][aria-hidden="true"]');
    staleDialogs.forEach(dialog => {
      if (dialog.parentNode) {
        try {
          dialog.setAttribute('data-state', 'closed');
        } catch (e) {
          console.error("Error cleaning up dialog:", e);
        }
      }
    });
    
    document.body.style.pointerEvents = '';
    document.body.removeAttribute('aria-hidden');
  };

  return {
    markers,
    pinnedMarkers,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    markerToDelete,
    setMarkerToDelete,
    returnFocusRef,
    cleanupMarkerReferences
  };
};
