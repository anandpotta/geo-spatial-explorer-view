
import { useState, useEffect, useRef } from 'react';
import { LocationMarker, getSavedMarkers } from '@/utils/marker-utils';

export const useDropdownLocations = () => {
  const [markers, setMarkers] = useState<LocationMarker[]>([]);
  const [pinnedMarkers, setPinnedMarkers] = useState<LocationMarker[]>([]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [markerToDelete, setMarkerToDelete] = useState<LocationMarker | null>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const isLoadingRef = useRef(false);
  const lastUpdateRef = useRef<number>(0);
  
  const loadMarkers = () => {
    if (isLoadingRef.current) return;
    
    const now = Date.now();
    // Prevent loading more than once every 200ms
    if (now - lastUpdateRef.current < 200) {
      return;
    }
    
    isLoadingRef.current = true;
    lastUpdateRef.current = now;
    
    try {
      const savedMarkers = getSavedMarkers();
      setMarkers(savedMarkers);
      const pinned = savedMarkers.filter(marker => marker.isPinned === true);
      setPinnedMarkers(pinned);
    } catch (error) {
      console.error('Error loading markers:', error);
    } finally {
      // Reset loading flag after a delay to prevent rapid successive calls
      setTimeout(() => {
        isLoadingRef.current = false;
      }, 150);
    }
  };

  useEffect(() => {
    // Initial load
    loadMarkers();
    
    // Create a debounced handler to prevent rapid successive calls
    let debounceTimer: NodeJS.Timeout;
    
    const handleMarkersUpdated = () => {
      if (isLoadingRef.current) return;
      
      // Clear any existing timer
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      
      // Set a new timer to debounce the update
      debounceTimer = setTimeout(() => {
        if (!isLoadingRef.current) {
          loadMarkers();
        }
      }, 100);
    };
    
    // Only listen to markersUpdated event - no storage events to prevent loops
    window.addEventListener('markersUpdated', handleMarkersUpdated);
    
    return () => {
      window.removeEventListener('markersUpdated', handleMarkersUpdated);
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, []);

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
