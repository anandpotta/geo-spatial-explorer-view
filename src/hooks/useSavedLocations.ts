
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
    // Prevent event propagation to avoid triggering parent elements
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    
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
      loadMarkers(); // Reload markers immediately after deletion
      setIsDeleteDialogOpen(false);
      setMarkerToDelete(null);
      toast.success("Location removed");
      
      // Reset focus to document.body as a fallback
      document.body.focus();
      
      // Wait for next frame before trying to return focus
      requestAnimationFrame(() => {
        try {
          if (returnFocusRef.current && document.body.contains(returnFocusRef.current)) {
            returnFocusRef.current.focus();
          } else {
            document.body.focus();
          }
        } catch (e) {
          console.error("Error restoring focus:", e);
          document.body.focus();
        } finally {
          returnFocusRef.current = null;
        }
      });
    }
  };

  const cancelDelete = () => {
    setIsDeleteDialogOpen(false);
    setMarkerToDelete(null);
    
    // Reset focus to document.body as a fallback
    document.body.focus();
    
    // Wait for next frame before trying to return focus
    requestAnimationFrame(() => {
      try {
        if (returnFocusRef.current && document.body.contains(returnFocusRef.current)) {
          returnFocusRef.current.focus();
        } else {
          document.body.focus();
        }
      } catch (e) {
        console.error("Error restoring focus:", e);
        document.body.focus();
      } finally {
        returnFocusRef.current = null;
      }
    });
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
