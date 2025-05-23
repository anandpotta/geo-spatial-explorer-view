
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
      // Store reference to selected location data BEFORE clearing
      const selectedLocation = localStorage.getItem('selectedLocation');
      
      // Get the map instance from the featureGroup
      const map = (featureGroup as any)._map;
      
      // Before clearing, collect all red marker elements and their positions
      const redMarkerElements: Array<{element: HTMLElement, parent: Element}> = [];
      const redMarkerTooltips: Array<{element: HTMLElement, parent: Element}> = [];
      
      if (map) {
        // Collect red markers before clearing
        const redMarkers = document.querySelectorAll('img[src*="marker-icon-2x-red.png"]');
        redMarkers.forEach(marker => {
          if (marker.parentNode) {
            redMarkerElements.push({
              element: marker.cloneNode(true) as HTMLElement,
              parent: marker.parentNode as Element
            });
          }
        });
        
        // Collect selected location tooltips before clearing
        const selectedTooltips = document.querySelectorAll('.selected-location-tooltip');
        selectedTooltips.forEach(tooltip => {
          if (tooltip.parentNode) {
            redMarkerTooltips.push({
              element: tooltip.cloneNode(true) as HTMLElement,
              parent: tooltip.parentNode as Element
            });
          }
        });
      }
      
      // Clear all visible layers from the map
      featureGroup.clearLayers();
      
      if (map) {
        // Force SVG paths to be removed directly from the DOM
        clearAllMapSvgElements(map);
        
        // Clear all drawing-related elements but preserve infrastructure
        try {
          // Clean up marker pane
          const markerPane = map._panes?.markerPane as HTMLElement | undefined;
          if (markerPane) {
            // Remove all marker-related elements
            const allMarkers = markerPane.querySelectorAll('.leaflet-marker-icon, .leaflet-marker-shadow');
            allMarkers.forEach((element: Element) => {
              element.remove();
            });
          }
          
          // Clean up tooltip pane
          const tooltipPane = map._panes?.tooltipPane as HTMLElement | undefined;
          if (tooltipPane) {
            // Remove all tooltips
            const tooltips = tooltipPane.querySelectorAll('.leaflet-tooltip');
            tooltips.forEach((tooltip: Element) => {
              tooltip.remove();
            });
          }
          
          // Clean up overlay pane (SVG elements)
          const overlayPane = map._panes?.overlayPane as HTMLElement | undefined;
          if (overlayPane) {
            // Remove all paths
            Array.from(overlayPane.querySelectorAll('path')).forEach(path => {
              path.remove();
            });
            
            // Clean SVG elements
            Array.from(overlayPane.querySelectorAll('svg')).forEach(svg => {
              svg.innerHTML = '';
              const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
              svg.appendChild(g);
            });
          }
        } catch (err) {
          console.error('Error cleaning up map panes:', err);
        }
        
        // Restore red markers after clearing
        setTimeout(() => {
          redMarkerElements.forEach(({element, parent}) => {
            try {
              parent.appendChild(element);
            } catch (e) {
              console.error('Error restoring red marker:', e);
            }
          });
          
          // Restore red marker tooltips
          redMarkerTooltips.forEach(({element, parent}) => {
            try {
              parent.appendChild(element);
            } catch (e) {
              console.error('Error restoring red marker tooltip:', e);
            }
          });
        }, 50);
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
      
      // Restore authentication data and selected location
      if (authState) {
        localStorage.setItem('geospatial_auth_state', authState);
      }
      if (users) {
        localStorage.setItem('geospatial_users', users);
      }
      if (selectedLocation) {
        localStorage.setItem('selectedLocation', selectedLocation);
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
      
      // Force update of the edit toolbar and final cleanup
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
            
            // Final cleanup attempt for any remaining drawing paths
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
