
import L from 'leaflet';

/**
 * Safely checks if a map instance is valid and ready for use
 */
export function isMapValid(map: any): map is L.Map {
  if (!map) return false;
  
  // Check if map instance exists and has required methods
  if (typeof map.getContainer !== 'function') return false;
  if (typeof map.invalidateSize !== 'function') return false;
  
  try {
    // Check if the container element exists in the DOM
    const container = map.getContainer();
    if (!container || !document.body.contains(container)) {
      return false;
    }
    
    // Check if the map has been destroyed
    if ((map as any)._isDestroyed === true) {
      return false;
    }
    
    // For maximum safety, check that map has core Leaflet methods
    return typeof map.setView === 'function' && 
           typeof map.addLayer === 'function' && 
           typeof map.getZoom === 'function';
  } catch (err) {
    console.warn('Error checking map validity:', err);
    return false;
  }
}

/**
 * Gets the map instance from a layer
 */
export function getMapFromLayer(layer: L.Layer | null): L.Map | null {
  if (!layer) return null;
  
  try {
    // Check if layer has a _map property
    if ((layer as any)._map) {
      return (layer as any)._map;
    }
    
    // For feature groups, check the first layer
    if (layer instanceof L.FeatureGroup && layer.getLayers().length > 0) {
      const firstLayer = layer.getLayers()[0];
      if ((firstLayer as any)._map) {
        return (firstLayer as any)._map;
      }
    }
    
    return null;
  } catch (err) {
    console.error("Error getting map from layer:", err);
    return null;
  }
}

/**
 * Checks if the map pane is initialized and ready for operations
 */
export function isMapPaneReady(map: L.Map | null): boolean {
  if (!map) return false;
  
  try {
    // Check if map is valid first
    if (!isMapValid(map)) return false;
    
    // Check if map pane exists
    const mapPane = map.getPane('mapPane');
    if (!mapPane) return false;
    
    // Check if _leaflet_pos exists to prevent specific errors
    if (!(mapPane as any)._leaflet_pos) {
      // Force create _leaflet_pos if missing to prevent errors
      (mapPane as any)._leaflet_pos = { x: 0, y: 0 };
      console.log('Created missing _leaflet_pos for mapPane');
      return true; // Return true since we've fixed the issue
    }
    
    return true;
  } catch (err) {
    console.warn('Error checking map pane readiness:', err);
    return false;
  }
}

/**
 * Safe operation wrapper to protect against Leaflet errors
 */
export function safeMapOperation<T>(map: L.Map | null, operation: (map: L.Map) => T, fallback: T): T {
  if (!map || !isMapValid(map)) return fallback;
  
  try {
    return operation(map);
  } catch (err) {
    console.warn(`Map operation failed: ${err.message}`);
    return fallback;
  }
}

/**
 * Safely invalidates the map size with proper type checking
 */
export function safeInvalidateSize(map: any): void {
  if (!map) return;
  
  try {
    // First check if it's a valid map object
    if (isMapValid(map)) {
      // Ensure map pane exists and has _leaflet_pos
      const mapPane = map.getPane('mapPane');
      if (mapPane && !(mapPane as any)._leaflet_pos) {
        console.log('Creating missing _leaflet_pos before invalidateSize');
        (mapPane as any)._leaflet_pos = { x: 0, y: 0 };
      }
      
      // Check for panes object
      if ((map as any)._panes && (map as any)._panes.mapPane && !(map as any)._panes.mapPane._leaflet_pos) {
        console.log('Creating missing _leaflet_pos on _panes.mapPane');
        (map as any)._panes.mapPane._leaflet_pos = { x: 0, y: 0 };
      }
      
      map.invalidateSize(true);
      
      // Force tile refresh by triggering a moveend event
      setTimeout(() => {
        if (isMapValid(map)) {
          map.fire('moveend');
        }
      }, 200);
    } else if (typeof map.invalidateSize === 'function') {
      // Fallback if it has the method but didn't pass full validation
      map.invalidateSize(true);
    } else {
      console.warn('Map object doesn\'t have invalidateSize method');
    }
  } catch (err) {
    console.warn('Error invalidating map size:', err);
  }
}

/**
 * Ensures map tiles are properly loaded and displayed
 */
export function forceMapTileRefresh(map: L.Map | null): void {
  if (!map || !isMapValid(map)) return;
  
  try {
    // First invalidate size
    safeInvalidateSize(map);
    
    // Make sure mapPane has _leaflet_pos
    const mapPane = map.getPane('mapPane');
    if (mapPane && !(mapPane as any)._leaflet_pos) {
      console.log('Creating _leaflet_pos during tile refresh');
      (mapPane as any)._leaflet_pos = { x: 0, y: 0 };
    }
    
    // Get all tile layers
    map.eachLayer(layer => {
      if (layer instanceof L.TileLayer) {
        // Redraw the tile layer
        layer.redraw();
        
        // If available and needed, use _resetView to force complete refresh
        if ((map as any)._resetView) {
          const center = map.getCenter();
          const zoom = map.getZoom();
          (map as any)._resetView(center, zoom, true);
        }
      }
    });
    
    // Trigger move events to ensure tiles update
    setTimeout(() => {
      if (isMapValid(map)) {
        map.fire('move');
        map.fire('moveend');
      }
    }, 100);
  } catch (err) {
    console.warn('Error during tile refresh:', err);
  }
}
