
import { getSavedMarkers, deleteMarker } from '@/utils/marker-utils';
import { toast } from 'sonner';

interface ClearAllHandlerProps {
  featureGroup: L.FeatureGroup;
  onClearAll?: () => void;
}

export function handleClearAll({ featureGroup, onClearAll }: ClearAllHandlerProps) {
  if (featureGroup) {
    featureGroup.clearLayers();
    
    const markers = getSavedMarkers();
    markers.forEach(marker => {
      deleteMarker(marker.id);
    });
    
    localStorage.removeItem('savedMarkers');
    localStorage.removeItem('savedDrawings');
    
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new Event('markersUpdated'));
    
    if (onClearAll) {
      onClearAll();
    }
    
    toast.success('All drawings and markers cleared');
  }
}
