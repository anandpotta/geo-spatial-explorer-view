
import { getSavedMarkers, deleteMarker } from '@/utils/marker-utils';
import { toast } from 'sonner';

interface ClearAllHandlerProps {
  featureGroup: L.FeatureGroup;
  onClearAll?: () => void;
}

export function handleClearAll({ featureGroup, onClearAll }: ClearAllHandlerProps) {
  if (featureGroup) {
    // Clear all visible layers from the map
    featureGroup.clearLayers();
    
    // Explicitly clear SVG elements in the overlay pane
    const mapContainer = (featureGroup as any)._map?.getContainer();
    if (mapContainer) {
      const overlayPane = mapContainer.querySelector('.leaflet-overlay-pane');
      if (overlayPane) {
        // Find all SVG paths and clear them
        const svgElements = overlayPane.querySelectorAll('svg');
        svgElements.forEach(svg => {
          // Remove all path elements
          const paths = svg.querySelectorAll('path');
          paths.forEach(path => {
            path.remove();
          });
        });
        
        console.log('Cleared all SVG paths from overlay pane');
      }
    }
    
    // Force SVG paths to be removed by triggering all relevant events
    window.dispatchEvent(new Event('clearAllSvgPaths'));
    window.dispatchEvent(new Event('clearAllDrawings'));
    
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
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new Event('markersUpdated'));
    window.dispatchEvent(new Event('drawingsUpdated'));
    window.dispatchEvent(new CustomEvent('floorPlanUpdated', { detail: { cleared: true } }));
    
    // Force a complete refresh of the map to ensure all elements are cleared
    window.dispatchEvent(new Event('mapRefresh'));
    
    if (onClearAll) {
      onClearAll();
    }
    
    toast.success('All map data cleared while preserving user accounts');
  }
}
