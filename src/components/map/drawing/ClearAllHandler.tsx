
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
    
    // Preserve authentication data
    const authState = localStorage.getItem('geospatial_auth_state');
    const users = localStorage.getItem('geospatial_users');
    
    // Clear everything else from localStorage
    localStorage.clear();
    
    // Restore authentication data
    if (authState) {
      localStorage.setItem('geospatial_auth_state', authState);
    }
    if (users) {
      localStorage.setItem('geospatial_users', users);
    }
    
    // Dispatch storage and related events to notify components
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new Event('markersUpdated'));
    window.dispatchEvent(new CustomEvent('floorPlanUpdated', { detail: { cleared: true } }));
    
    if (onClearAll) {
      onClearAll();
    }
    
    toast.success('All data cleared while preserving user accounts');
  }
}
