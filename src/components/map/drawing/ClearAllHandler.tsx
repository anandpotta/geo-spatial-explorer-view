
import { getSavedMarkers, deleteMarker } from '@/utils/marker-utils';
import { toast } from 'sonner';
import { clearAllMapSvgElements } from '@/utils/svg-path-utils';

interface ClearAllHandlerProps {
  featureGroup: L.FeatureGroup;
  onClearAll?: () => void;
}

export function handleClearAll({ featureGroup, onClearAll }: ClearAllHandlerProps) {
  if (featureGroup) {
    console.log('Clearing all layers from feature group');
    // Clear all visible layers from the map
    featureGroup.clearLayers();
    
    // Get the map instance from the featureGroup
    const map = (featureGroup as any)._map;
    if (map) {
      console.log('Force clearing SVG paths from DOM');
      // Force SVG paths to be removed directly from the DOM
      clearAllMapSvgElements(map);
    } else {
      // Fallback if map instance not available
      console.log('No map instance found, using event to clear paths');
      window.dispatchEvent(new Event('clearAllSvgPaths'));
    }
    
    // Clear all markers from storage
    const markers = getSavedMarkers();
    console.log(`Deleting ${markers.length} saved markers`);
    markers.forEach(marker => {
      deleteMarker(marker.id);
    });
    
    // Preserve authentication data
    const authState = localStorage.getItem('geospatial_auth_state');
    const users = localStorage.getItem('geospatial_users');
    
    // Completely clear localStorage
    console.log('Clearing localStorage');
    localStorage.clear();
    
    // Restore authentication data
    if (authState) {
      localStorage.setItem('geospatial_auth_state', authState);
    }
    if (users) {
      localStorage.setItem('geospatial_users', users);
    }
    
    // Forcefully clear specific storages that might be causing issues
    localStorage.removeItem('savedDrawings');
    localStorage.removeItem('savedMarkers');
    localStorage.removeItem('floorPlans');
    localStorage.removeItem('svgPaths');
    
    // Dispatch storage and related events to notify components
    console.log('Dispatching notification events');
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new Event('markersUpdated'));
    window.dispatchEvent(new Event('drawingsUpdated'));
    window.dispatchEvent(new CustomEvent('floorPlanUpdated', { detail: { cleared: true } }));
    window.dispatchEvent(new Event('clearAllSvgPaths'));
    
    // Force a complete refresh of the map to ensure all elements are cleared
    window.dispatchEvent(new Event('mapRefresh'));
    
    if (onClearAll) {
      console.log('Calling onClearAll callback');
      onClearAll();
    }
    
    toast.success('All map data cleared while preserving user accounts');
  }
}
