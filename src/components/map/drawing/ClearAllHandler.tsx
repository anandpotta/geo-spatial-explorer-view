
import { getSavedMarkers, deleteMarker } from '@/utils/marker-utils';
import { toast } from 'sonner';

interface ClearAllHandlerProps {
  featureGroup: L.FeatureGroup;
  onClearAll?: () => void;
}

export function handleClearAll({ featureGroup, onClearAll }: ClearAllHandlerProps) {
  if (featureGroup) {
    featureGroup.clearLayers();
    
    // Clear all markers from storage
    const markers = getSavedMarkers();
    markers.forEach(marker => {
      deleteMarker(marker.id);
    });
    
    // Remove specific items but preserve user authentication data
    localStorage.removeItem('savedMarkers');
    localStorage.removeItem('savedDrawings');
    localStorage.removeItem('floorPlans');
    
    // Preserve the authentication state
    const authState = localStorage.getItem('geospatial_auth_state');
    const users = localStorage.getItem('geospatial_users');
    
    // Clear everything else
    localStorage.clear();
    
    // Restore authentication data
    if (authState) {
      localStorage.setItem('geospatial_auth_state', authState);
    }
    if (users) {
      localStorage.setItem('geospatial_users', users);
    }
    
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new Event('markersUpdated'));
    window.dispatchEvent(new CustomEvent('floorPlanUpdated', { detail: { cleared: true } }));
    
    if (onClearAll) {
      onClearAll();
    }
    
    toast.success('All data cleared while preserving user accounts');
  }
}
