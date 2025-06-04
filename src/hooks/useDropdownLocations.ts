
import { useState, useEffect, useRef, useCallback } from 'react';
import { LocationMarker, getSavedMarkers } from '@/utils/marker-utils';

export const useDropdownLocations = () => {
  const [markers, setMarkers] = useState<LocationMarker[]>([]);
  const [pinnedMarkers, setPinnedMarkers] = useState<LocationMarker[]>([]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [markerToDelete, setMarkerToDelete] = useState<LocationMarker | null>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const hasLoadedRef = useRef(false);
  const lastUpdateRef = useRef<number>(0);
  
  const loadMarkers = useCallback(() => {
    const now = Date.now();
    
    // Prevent rapid successive loads
    if (now - lastUpdateRef.current < 3000) {
      return;
    }
    
    lastUpdateRef.current = now;
    
    try {
      const savedMarkers = getSavedMarkers();
      setMarkers(savedMarkers);
      const pinned = savedMarkers.filter(marker => marker.isPinned === true);
      setPinnedMarkers(pinned);
    } catch (error) {
      console.error('Error loading markers:', error);
    }
  }, []);

  useEffect(() => {
    // Load once on mount
    if (!hasLoadedRef.current) {
      loadMarkers();
      hasLoadedRef.current = true;
    }
    
    // Listen only to the custom markersSaved event with throttling
    let updateTimeout: NodeJS.Timeout;
    
    const handleMarkersSaved = (event: Event) => {
      if (event instanceof CustomEvent && event.detail?.source === 'storage') {
        // Clear any existing timeout
        if (updateTimeout) {
          clearTimeout(updateTimeout);
        }
        
        // Debounce the update
        updateTimeout = setTimeout(() => {
          loadMarkers();
        }, 2000);
      }
    };
    
    window.addEventListener('markersSaved', handleMarkersSaved);
    
    return () => {
      window.removeEventListener('markersSaved', handleMarkersSaved);
      if (updateTimeout) {
        clearTimeout(updateTimeout);
      }
    };
  }, [loadMarkers]);

  const cleanupMarkerReferences = useCallback(() => {
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
  }, []);

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
