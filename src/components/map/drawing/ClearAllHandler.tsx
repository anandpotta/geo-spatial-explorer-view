
import { getSavedMarkers, deleteMarker } from '@/utils/marker-utils';
import { toast } from 'sonner';
import { clearAllMapSvgElements } from '@/utils/svg-path-utils';

interface ClearAllHandlerProps {
  featureGroup: L.FeatureGroup;
  onClearAll?: () => void;
}

export function handleClearAll({ featureGroup, onClearAll }: ClearAllHandlerProps) {
  console.log('Executing clear all handler');
  
  if (featureGroup) {
    // Clear all visible layers from the map
    featureGroup.clearLayers();
    
    // Get the map instance from the featureGroup
    const map = (featureGroup as any)._map;
    if (map) {
      // Force SVG paths to be removed directly from the DOM
      clearAllMapSvgElements(map);
      
      // Force removal of any remaining markers
      try {
        const markerPane = map._panes.markerPane;
        if (markerPane) {
          while (markerPane.firstChild) {
            markerPane.removeChild(markerPane.firstChild);
          }
        }
      } catch (err) {
        console.error('Error clearing marker pane:', err);
      }
    } else {
      // Fallback if map instance not available
      window.dispatchEvent(new Event('clearAllSvgPaths'));
    }
    
    // Clear all markers from storage
    const markers = getSavedMarkers();
    markers.forEach(marker => {
      deleteMarker(marker.id);
    });
    
    // Preserve authentication data
    const authState = localStorage.getItem('geospatial_auth_state');
    const users = localStorage.getItem('geospatial_users');
    
    // Completely clear localStorage
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
    console.log('Dispatching events for clear all operation');
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new Event('markersUpdated'));
    window.dispatchEvent(new Event('drawingsUpdated'));
    window.dispatchEvent(new CustomEvent('floorPlanUpdated', { detail: { cleared: true } }));
    
    // Force a complete refresh of the map to ensure all elements are cleared
    window.dispatchEvent(new Event('mapRefresh'));
    
    if (onClearAll) {
      onClearAll();
    }
    
    // Force update of the edit toolbar if it exists
    setTimeout(() => {
      if (map && map.fire) {
        try {
          map.fire('draw:editstart');
          map.fire('draw:editstop');
          console.log('Fired edit events to refresh toolbar state');
        } catch (e) {
          console.error('Error refreshing edit toolbar:', e);
        }
      }
    }, 100);
    
    toast.success('All map data cleared while preserving user accounts');
  }
}
