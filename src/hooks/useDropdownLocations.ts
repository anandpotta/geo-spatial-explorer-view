
import { useState, useEffect, useRef, useCallback } from 'react';
import { LocationMarker, getSavedMarkers } from '@/utils/marker-utils';

// Global state to prevent multiple concurrent loads
let isGloballyLoading = false;
let lastGlobalLoad = 0;

export const useDropdownLocations = () => {
  const [markers, setMarkers] = useState<LocationMarker[]>([]);
  const [pinnedMarkers, setPinnedMarkers] = useState<LocationMarker[]>([]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [markerToDelete, setMarkerToDelete] = useState<LocationMarker | null>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const isLoadingRef = useRef(false);
  const lastUpdateRef = useRef<number>(0);
  const hasInitialLoadRef = useRef(false);
  
  const loadMarkers = useCallback(() => {
    const now = Date.now();
    
    // Prevent rapid successive loads globally
    if (isGloballyLoading || (now - lastGlobalLoad < 1000)) {
      return;
    }
    
    // Prevent rapid successive loads locally
    if (isLoadingRef.current || (now - lastUpdateRef.current < 1000)) {
      return;
    }
    
    isLoadingRef.current = true;
    isGloballyLoading = true;
    lastUpdateRef.current = now;
    lastGlobalLoad = now;
    
    try {
      const savedMarkers = getSavedMarkers();
      setMarkers(savedMarkers);
      const pinned = savedMarkers.filter(marker => marker.isPinned === true);
      setPinnedMarkers(pinned);
      hasInitialLoadRef.current = true;
    } catch (error) {
      console.error('Error loading markers:', error);
    } finally {
      // Reset loading flags after a longer delay
      setTimeout(() => {
        isLoadingRef.current = false;
        isGloballyLoading = false;
      }, 500);
    }
  }, []);

  useEffect(() => {
    // Only load once on initial mount
    if (!hasInitialLoadRef.current) {
      loadMarkers();
    }
    
    // Remove all event listeners to prevent loops
    // The markers will be updated through the parent component's state management
    
  }, []); // Empty dependency array - only run on mount

  const cleanupMarkerReferences = useCallback(() => {
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
