
import { useCallback, useState } from 'react';
import { LocationMarker } from '@/utils/geo-utils';
import { toast } from 'sonner';

interface UseUserMarkerActionsProps {
  marker: LocationMarker;
  onDelete: (id: string) => void;
}

export const useUserMarkerActions = ({ marker, onDelete }: UseUserMarkerActionsProps) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDragEnd = useCallback((e: L.LeafletEvent) => {
    if (isDeleting) return;
    
    try {
      const updatedMarker = e.target;
      const newPosition = updatedMarker.getLatLng();
      
      // Update marker position in local storage
      const savedMarkers = JSON.parse(localStorage.getItem('savedMarkers') || '[]');
      const updatedMarkers = savedMarkers.map((m: LocationMarker) => {
        if (m.id === marker.id) {
          return {
            ...m,
            position: [newPosition.lat, newPosition.lng] as [number, number]
          };
        }
        return m;
      });
      
      localStorage.setItem('savedMarkers', JSON.stringify(updatedMarkers));
      window.dispatchEvent(new CustomEvent('markersUpdated'));
      
    } catch (error) {
      console.error('Error updating marker position:', error);
    }
  }, [marker.id, isDeleting]);

  const handleRename = useCallback((newName: string) => {
    if (newName.trim() && newName !== marker.name) {
      // Update marker name in localStorage
      const savedMarkers = JSON.parse(localStorage.getItem('savedMarkers') || '[]');
      const updatedMarkers = savedMarkers.map((m: LocationMarker) => 
        m.id === marker.id ? { ...m, name: newName.trim() } : m
      );
      localStorage.setItem('savedMarkers', JSON.stringify(updatedMarkers));
      window.dispatchEvent(new CustomEvent('markersUpdated'));
      toast.success('Location renamed successfully');
    }
  }, [marker.id, marker.name]);

  const handlePinToggle = useCallback((currentPinState: boolean) => {
    const updatedPinnedState = !currentPinState;
    
    // Update the marker in localStorage
    const markers = JSON.parse(localStorage.getItem('savedMarkers') || '[]');
    const updatedMarkers = markers.map((m: LocationMarker) => 
      m.id === marker.id ? { ...m, isPinned: updatedPinnedState } : m
    );
    localStorage.setItem('savedMarkers', JSON.stringify(updatedMarkers));
    window.dispatchEvent(new CustomEvent('markersUpdated'));
    
    toast.success(updatedPinnedState ? 'Location pinned' : 'Location unpinned');
    return updatedPinnedState;
  }, [marker.id]);

  const handleDelete = useCallback(() => {
    if (isDeleting) return;
    
    setIsDeleting(true);
    onDelete(marker.id);
    toast.success('Location deleted');
  }, [onDelete, marker.id, isDeleting]);

  return {
    handleDragEnd,
    handleRename,
    handlePinToggle,
    handleDelete,
    isDeleting
  };
};
