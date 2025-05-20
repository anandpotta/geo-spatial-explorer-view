
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
      // Clear overlay pane SVG elements
      const overlayPane = mapContainer.querySelector('.leaflet-overlay-pane');
      if (overlayPane) {
        const svgElements = overlayPane.querySelectorAll('svg');
        svgElements.forEach(svg => {
          const paths = svg.querySelectorAll('path');
          paths.forEach(path => {
            path.remove();
          });
        });
        
        console.log('Cleared all SVG paths from overlay pane');
      }
      
      // Clear marker icons from marker pane
      const markerPane = mapContainer.querySelector('.leaflet-marker-pane');
      if (markerPane) {
        const markerIcons = markerPane.querySelectorAll('.leaflet-marker-icon');
        markerIcons.forEach(icon => {
          icon.remove();
        });
        
        console.log('Cleared all marker icons from marker pane');
        
        // Also clear marker shadows if they exist
        const markerShadows = mapContainer.querySelector('.leaflet-shadow-pane')?.querySelectorAll('.leaflet-marker-shadow');
        if (markerShadows) {
          markerShadows.forEach(shadow => {
            shadow.remove();
          });
          console.log('Cleared all marker shadows from shadow pane');
        }
      }
    }
    
    // Force SVG paths and markers to be removed by triggering all relevant events
    window.dispatchEvent(new Event('clearAllSvgPaths'));
    window.dispatchEvent(new Event('clearAllDrawings'));
    window.dispatchEvent(new Event('clearAllMarkers'));
    
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
