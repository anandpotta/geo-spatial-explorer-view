
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
      
      // Trigger the leaflet draw deleted event to ensure all handlers are notified
      console.log('Triggering draw:deleted event');
      map.fire('draw:deleted');
      // Trigger editStop to ensure the edit toolbar is updated
      map.fire('draw:editstop');
      
      // Add a slight delay and fire resize to ensure all UI elements update
      setTimeout(() => {
        map.invalidateSize();
        // Force the edit toolbar to reset
        if (map.editTools) {
          map.editTools.stopDrawing();
        }
      }, 100);
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
    
    // Get all keys that should be removed (related to map data)
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key !== 'geospatial_auth_state' && key !== 'geospatial_users' &&
          (key.includes('drawing') || key.includes('map') || 
           key.includes('path') || key.includes('marker') || 
           key.includes('floor') || key.includes('svg'))) {
        keysToRemove.push(key);
      }
    }
    
    // Remove all identified keys
    console.log(`Removing ${keysToRemove.length} localStorage items related to map data`);
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    // Explicitly clear common drawing-related storage
    localStorage.removeItem('savedDrawings');
    localStorage.removeItem('savedMarkers');
    localStorage.removeItem('floorPlans');
    localStorage.removeItem('svgPaths');
    
    // Restore authentication data
    if (authState) {
      localStorage.setItem('geospatial_auth_state', authState);
    }
    if (users) {
      localStorage.setItem('geospatial_users', users);
    }
    
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
    
    toast.success('All map data cleared');
  }
}
