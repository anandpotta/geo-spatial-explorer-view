
import { useState, useEffect } from 'react';
import { LocationMarker, getSavedMarkers, deleteMarker } from '@/utils/markers/index';
import { toast } from 'sonner';

export const useSavedLocations = () => {
  const [markers, setMarkers] = useState<LocationMarker[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedLocation, setSelectedLocation] = useState<LocationMarker | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [markerToDelete, setMarkerToDelete] = useState<LocationMarker | null>(null);

  useEffect(() => {
    const loadSavedMarkers = () => {
      try {
        const savedMarkers = getSavedMarkers();
        setMarkers(savedMarkers);
      } catch (error) {
        console.error('Error loading saved markers:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSavedMarkers();
    
    // Listen for storage events or custom marker update events
    const handleStorageUpdate = () => {
      loadSavedMarkers();
    };

    window.addEventListener('storage', handleStorageUpdate);
    window.addEventListener('markersUpdated', handleStorageUpdate);
    
    return () => {
      window.removeEventListener('storage', handleStorageUpdate);
      window.removeEventListener('markersUpdated', handleStorageUpdate);
    };
  }, []);

  const handleDelete = (id: string, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
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
      setIsDeleteDialogOpen(false);
      setMarkerToDelete(null);
      toast.success('Location deleted successfully');
    }
  };

  const cancelDelete = () => {
    setIsDeleteDialogOpen(false);
    setMarkerToDelete(null);
  };

  return { 
    markers, 
    loading, 
    selectedLocation, 
    setSelectedLocation,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    markerToDelete,
    handleDelete,
    confirmDelete,
    cancelDelete
  };
};
