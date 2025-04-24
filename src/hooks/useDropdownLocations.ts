
import { useState, useEffect, useRef } from 'react';
import { LocationMarker, getSavedMarkers } from '@/utils/geo-utils';

export const useDropdownLocations = () => {
  const [markers, setMarkers] = useState<LocationMarker[]>([]);
  const [pinnedMarkers, setPinnedMarkers] = useState<LocationMarker[]>([]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [markerToDelete, setMarkerToDelete] = useState<LocationMarker | null>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  // Load markers on initial mount only
  useEffect(() => {
    const loadMarkers = () => {
      const savedMarkers = getSavedMarkers();
      setMarkers(savedMarkers);
      
      // Filter pinned markers
      const pinned = savedMarkers.filter(marker => marker.pinned);
      setPinnedMarkers(pinned);
    };
    
    loadMarkers();
    
    // Set up event listeners for marker changes
    const handleStorage = () => {
      loadMarkers();
    };
    
    const handleMarkersUpdated = () => {
      loadMarkers();
    };
    
    window.addEventListener('storage', handleStorage);
    window.addEventListener('markersUpdated', handleMarkersUpdated);
    
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('markersUpdated', handleMarkersUpdated);
    };
  }, []); // Empty dependency array ensures this only runs once on mount

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
