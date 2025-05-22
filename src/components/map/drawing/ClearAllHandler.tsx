
import { getSavedMarkers, deleteMarker } from '@/utils/marker-utils';
import { toast } from 'sonner';
import { clearAllMapSvgElements } from '@/utils/svg-path-utils';

interface ClearAllHandlerProps {
  featureGroup: L.FeatureGroup;
  onClearAll?: () => void;
}

export function handleClearAll({ featureGroup, onClearAll }: ClearAllHandlerProps) {
  console.log('Executing clear all handler with thorough cleanup');
  
  if (featureGroup) {
    try {
      // Get the map instance from the featureGroup before clearing
      const map = (featureGroup as any)._map;

      // Clear all visible layers from the feature group
      featureGroup.clearLayers();
      
      if (map) {
        // Force SVG paths to be removed directly from the DOM
        clearAllMapSvgElements(map);
        
        // Force removal of any remaining markers
        try {
          // Clear marker pane
          const markerPane = map._panes?.markerPane;
          if (markerPane) {
            console.log('Clearing marker pane elements');
            while (markerPane.firstChild) {
              markerPane.removeChild(markerPane.firstChild);
            }
          }
          
          // Clear overlay pane which may contain SVG elements
          const overlayPane = map._panes?.overlayPane;
          if (overlayPane) {
            console.log('Clearing overlay pane elements');
            while (overlayPane.firstChild) {
              overlayPane.removeChild(overlayPane.firstChild);
            }
          }
          
          // Clear all other map panes that might contain drawn elements
          const mapPanes = map._panes;
          if (mapPanes) {
            Object.keys(mapPanes).forEach(paneKey => {
              const pane = mapPanes[paneKey];
              if (pane && 
                  paneKey !== 'tilePane' && 
                  paneKey !== 'shadowPane' && 
                  paneKey !== 'mapPane') {
                console.log(`Clearing ${paneKey} elements`);
                // Remove SVG elements but preserve the pane itself
                Array.from(pane.children).forEach(child => {
                  pane.removeChild(child);
                });
              }
            });
          }
          
          // Clear all SVG elements from path root
          if (map._pathRoot) {
            console.log('Clearing path root elements');
            while (map._pathRoot.firstChild) {
              map._pathRoot.removeChild(map._pathRoot.firstChild);
            }
          }
          
          // Clear all layers directly from the map
          if (map._layers) {
            Object.keys(map._layers).forEach(layerId => {
              try {
                const layer = map._layers[layerId];
                if (layer && 
                    layer !== map && 
                    layer !== featureGroup && 
                    !layer._url // Don't remove tile layers
                   ) {
                  map.removeLayer(layer);
                }
              } catch (e) {
                console.warn(`Failed to remove layer ${layerId}:`, e);
              }
            });
          }
        } catch (err) {
          console.error('Error clearing map panes:', err);
        }
        
        // Force complete refresh of the map DOM
        setTimeout(() => {
          try {
            // Redraw and invalidate the map
            map.invalidateSize({ pan: false });
            map._resetView(map.getCenter(), map.getZoom(), true);
            console.log('Map view reset and invalidated');
          } catch (e) {
            console.error('Error refreshing map view:', e);
          }
        }, 50);
      } else {
        // Fallback if map instance not available
        console.warn('Map instance not available for direct DOM cleanup');
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
      window.dispatchEvent(new Event('svgPathsCleared'));
      
      // Force a complete refresh of the map
      window.dispatchEvent(new Event('mapRefresh'));
      
      if (onClearAll) {
        onClearAll();
      }
      
      // Force update of the edit toolbar if it exists
      if (map && map.fire) {
        try {
          map.fire('draw:editstart');
          map.fire('draw:editstop');
          console.log('Fired edit events to refresh toolbar state');
        } catch (e) {
          console.error('Error refreshing edit toolbar:', e);
        }
      }
      
      toast.success('All map data cleared while preserving user accounts');
    } catch (error) {
      console.error('Error in clear all operation:', error);
      toast.error('Error clearing map data. Please try refreshing the page.');
    }
  }
}
