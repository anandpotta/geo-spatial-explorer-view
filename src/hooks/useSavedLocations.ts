
import { useState, useEffect, useRef } from 'react';
import { LocationMarker, getSavedMarkers, deleteMarker } from '@/utils/geo-utils';
import { toast } from 'sonner';

export const useSavedLocations = () => {
  const [markers, setMarkers] = useState<LocationMarker[]>([]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [markerToDelete, setMarkerToDelete] = useState<LocationMarker | null>(null);
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [markerToRename, setMarkerToRename] = useState<LocationMarker | null>(null);
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

  const handleRename = (id: string, event?: React.MouseEvent) => {
    // Prevent event propagation to avoid triggering parent elements
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    
    // Store the element that triggered the rename for focus return
    if (event?.currentTarget) {
      returnFocusRef.current = event.currentTarget as HTMLElement;
    }
    
    const marker = markers.find(m => m.id === id);
    if (marker) {
      setMarkerToRename(marker);
      setIsRenameDialogOpen(true);
    }
  };

  const confirmDelete = () => {
    if (markerToDelete) {
      deleteMarker(markerToDelete.id);
      loadMarkers(); // Reload markers immediately after deletion
      setIsDeleteDialogOpen(false);
      setMarkerToDelete(null);
      toast.success("Location removed");
      
      restoreFocus();
    }
  };

  const confirmRename = (id: string, newName: string) => {
    const savedMarkers = getSavedMarkers();
    const updatedMarkers = savedMarkers.map((marker) => {
      if (marker.id === id) {
        return { ...marker, name: newName };
      }
      return marker;
    });
    
    localStorage.setItem('savedMarkers', JSON.stringify(updatedMarkers));
    
    // Notify components about storage changes
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new Event('markersUpdated'));
    
    loadMarkers(); // Reload markers immediately after renaming
    setIsRenameDialogOpen(false);
    setMarkerToRename(null);
    toast.success("Location renamed");
    
    restoreFocus();
  };

  const cancelDelete = () => {
    setIsDeleteDialogOpen(false);
    setMarkerToDelete(null);
    restoreFocus();
  };

  const cancelRename = () => {
    setIsRenameDialogOpen(false);
    setMarkerToRename(null);
    restoreFocus();
  };

  const restoreFocus = () => {
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
    isRenameDialogOpen,
    setIsRenameDialogOpen,
    markerToRename,
    setMarkerToRename,
    handleDelete,
    handleRename,
    confirmDelete,
    confirmRename,
    cancelDelete,
    cancelRename
  };
};
