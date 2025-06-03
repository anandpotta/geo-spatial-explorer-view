
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
    
    try {
      const savedMarkers = getSavedMarkers();
      setMarkers(savedMarkers);
      const pinned = savedMarkers.filter(marker => marker.isPinned === true);
      setPinnedMarkers(pinned);
    } catch (error) {
      console.error('Error loading markers:', error);
    } finally {
      setTimeout(() => {
        isLoadingRef.current = false;
      }, 100);
    }
  };

  useEffect(() => {
    loadMarkers();
    
    // Only listen to markersUpdated event to prevent circular loops
    // Remove storage listener as it's redundant and causes loops
    const handleMarkersUpdated = () => {
      if (isLoadingRef.current) return;
      
      console.log("Markers updated event detected");
      loadMarkers();
    };
    
    window.addEventListener('markersUpdated', handleMarkersUpdated);
    
    return () => {
      window.removeEventListener('markersUpdated', handleMarkersUpdated);
    };
  }, []);

  // Add this function to help with proper cleanup of elements when a marker is deleted
  const cleanupMarkerReferences = () => {
    // Force cleanup of any stale elements that might be causing issues
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
    
    // Ensure body is not restricted
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
