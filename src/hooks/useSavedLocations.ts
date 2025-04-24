
import { useState, useEffect, useRef } from 'react';
import { LocationMarker, getSavedMarkers, deleteMarker } from '@/utils/geo-utils';
import { toast } from 'sonner';

export const useSavedLocations = () => {
  const [markers, setMarkers] = useState<LocationMarker[]>([]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [markerToDelete, setMarkerToDelete] = useState<LocationMarker | null>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  const loadMarkers = () => {
    const savedMarkers = getSavedMarkers();
    setMarkers(savedMarkers);
  };

  useEffect(() => {
    loadMarkers();
    
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
  }, []);

  const handleDelete = (id: string, event?: React.MouseEvent) => {
    // Store the element that triggered the deletion for focus return
    if (event?.currentTarget) {
      returnFocusRef.current = event.currentTarget as HTMLElement;
    }
    
    const marker = markers.find(m => m.id === id);
    if (marker) {
      setMarkerToDelete(marker);
      setIsDeleteDialogOpen(true);
    }
  };

  const confirmDelete = () => {
    if (markerToDelete) {
      deleteMarker(markerToDelete.id);
      loadMarkers();
      setIsDeleteDialogOpen(false);
      setMarkerToDelete(null);
      toast.success("Location removed");
      
      // Return focus to a safe element after dialog closes
      setTimeout(() => {
        if (returnFocusRef.current) {
          try {
            returnFocusRef.current.focus();
          } catch (e) {
            // If we can't focus the original element, focus the document body
            document.body.focus();
          }
          returnFocusRef.current = null;
        }
      }, 0);
    }
  };

  const cancelDelete = () => {
    setIsDeleteDialogOpen(false);
    setMarkerToDelete(null);
    
    // Return focus to trigger element
    setTimeout(() => {
      if (returnFocusRef.current) {
        try {
          returnFocusRef.current.focus();
        } catch (e) {
          document.body.focus();
        }
        returnFocusRef.current = null;
      }
    }, 0);
  };

  return {
    markers,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    markerToDelete,
    setMarkerToDelete,
    handleDelete,
    confirmDelete,
    cancelDelete
  };
};
