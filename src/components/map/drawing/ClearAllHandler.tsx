
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
    try {
      // Clear all visible layers from the map except selected location markers
      featureGroup.clearLayers();
      
      // Get the map instance from the featureGroup
      const map = (featureGroup as any)._map;
      if (map) {
        // Force SVG paths to be removed directly from the DOM
        clearAllMapSvgElements(map);
        
        // Force removal of any remaining markers except red location markers
        try {
          // Clean up marker pane but preserve red markers
          const markerPane = map._panes?.markerPane as HTMLElement | undefined;
          if (markerPane) {
            // Remove only non-red markers (preserve selected location markers)
            const markers = markerPane.querySelectorAll('.leaflet-marker-icon');
            markers.forEach((marker: Element) => {
              const imgElement = marker as HTMLImageElement;
              // Check if this is NOT a red marker (selected location marker)
              if (!imgElement.src?.includes('marker-icon-2x-red.png')) {
                marker.parentNode?.removeChild(marker);
              }
            });
            
            // Also clean up shadows for non-red markers
            const shadows = markerPane.querySelectorAll('.leaflet-marker-shadow');
            shadows.forEach((shadow: Element, index: number) => {
              const correspondingMarker = markers[index] as HTMLImageElement;
              if (correspondingMarker && !correspondingMarker.src?.includes('marker-icon-2x-red.png')) {
                shadow.parentNode?.removeChild(shadow);
              }
            });
          }
          
          // Also clear the overlay pane which may contain SVG elements
          const overlayPane = map._panes?.overlayPane as HTMLElement | undefined;
          if (overlayPane) {
            // First try removing paths directly
            Array.from(overlayPane.querySelectorAll('path')).forEach(path => {
              path.remove();
            });
            
            // Then try emptying the SVG elements
            Array.from(overlayPane.querySelectorAll('svg')).forEach(svg => {
              // Empty the SVG content
              svg.innerHTML = '';
              
              // Add back an empty group element
              const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
              svg.appendChild(g);
            });
          }
        } catch (err) {
          console.error('Error cleaning up map panes:', err);
        }
      } else {
        // Fallback if map instance not available
        window.dispatchEvent(new Event('clearAllSvgPaths'));
      }
      
      // Clear all user-created markers from storage (but not selected location markers)
      const markers = getSavedMarkers();
      markers.forEach(marker => {
        deleteMarker(marker.id);
      });
      
      // Preserve authentication data and selected location data
      const authState = localStorage.getItem('geospatial_auth_state');
      const users = localStorage.getItem('geospatial_users');
      
      // Clear only drawing-related storage, preserve location selection
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
            // Trigger draw events to reset the toolbar state
            map.fire('draw:editstart');
            map.fire('draw:editstop');
            console.log('Fired edit events to refresh toolbar state');
            
            // Force a map invalidation and redraw
            map.invalidateSize(true);
            const center = map.getCenter();
            const zoom = map.getZoom();
            map._resetView(center, zoom, true);
            
            // Final cleanup attempt for any remaining paths (but preserve red markers)
            document.querySelectorAll('.leaflet-overlay-pane path').forEach(path => {
              try {
                path.remove();
              } catch (e) {
                console.error('Error removing path:', e);
              }
            });
          } catch (e) {
            console.error('Error refreshing edit toolbar:', e);
          }
        }
      }, 100);
      
      toast.success('All drawings cleared while preserving selected locations');
    } catch (error) {
      console.error('Error in clear all operation:', error);
      toast.error('Error clearing map data. Please try refreshing the page.');
    }
  }
}
