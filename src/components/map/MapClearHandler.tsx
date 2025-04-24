
import { useEffect } from 'react';
import { getSavedMarkers, deleteMarker } from '@/utils/marker-utils';
import { getSavedDrawings, clearAllDrawings } from '@/utils/drawing-utils';
import { toast } from 'sonner';

interface MapClearHandlerProps {
  onClearAll?: () => void;
}

const MapClearHandler = ({ onClearAll }: MapClearHandlerProps) => {
  const handleClearAll = () => {
    try {
      console.log("Clearing all layers...");
      
      const markers = getSavedMarkers();
      const drawings = getSavedDrawings();
      
      console.log(`Found ${markers.length} markers and ${drawings.length} drawings to clear`);

      markers.forEach(marker => {
        deleteMarker(marker.id);
      });

      clearAllDrawings();
      
      localStorage.removeItem('savedMarkers');
      localStorage.removeItem('savedDrawings');

      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new Event('markersUpdated'));
      window.dispatchEvent(new CustomEvent('clearAllDrawings'));
      
      if (onClearAll) {
        onClearAll();
      }
      
      toast.success('All layers cleared successfully');
    } catch (error) {
      console.error("Error clearing layers:", error);
      toast.error('Failed to clear layers. Please try again.');
    }
  };

  return null;
};

export default MapClearHandler;
