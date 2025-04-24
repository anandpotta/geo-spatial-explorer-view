
import { useState, useEffect } from 'react';
import { LocationMarker, getSavedMarkers, deleteMarker } from '@/utils/geo-utils';
import { toast } from 'sonner';

export const useSavedLocations = () => {
  const [markers, setMarkers] = useState<LocationMarker[]>([]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [markerToDelete, setMarkerToDelete] = useState<LocationMarker | null>(null);

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

  const handleDelete = (id: string) => {
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
    }
  };

  return {
    markers,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    markerToDelete,
    setMarkerToDelete,
    handleDelete,
    confirmDelete
  };
};
