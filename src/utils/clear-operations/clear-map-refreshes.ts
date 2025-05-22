
import { forceMapRefresh } from './map-refresh';
import { clearSvgPaths } from './clear-svg-paths';
import { clearAllMarkers } from './clear-markers';
import { clearAllDrawings } from './clear-drawings';
import { preserveAuthData } from './preserve-auth-data';

/**
 * Utility function that performs a complete map clear operation
 * @param options Options to control what gets cleared
 */
export function clearAllMapData(options: {
  clearMarkers?: boolean;
  clearSvgPaths?: boolean;
  clearDrawings?: boolean;
  refreshMap?: boolean;
  preserveAuth?: boolean;
} = {}) {
  // Set default options
  const {
    clearMarkers = true,
    clearSvgPaths = true,
    clearDrawings = true,
    refreshMap = true,
    preserveAuth = true
  } = options;
  
  // Get restore function for auth data if needed
  const restoreAuthFn = preserveAuth ? preserveAuthData() : null;
  
  // Clear components based on options
  let cleared = false;
  
  if (clearMarkers) {
    clearAllMarkers();
    cleared = true;
  }
  
  if (clearSvgPaths) {
    clearSvgPaths();
    cleared = true;
  }
  
  if (clearDrawings) {
    clearAllDrawings();
    cleared = true;
  }
  
  // Restore auth data if preserved and restore function is available
  if (restoreAuthFn && typeof restoreAuthFn === 'function') {
    restoreAuthFn();
  }
  
  // Force refresh if requested
  if (refreshMap) {
    forceMapRefresh();
  }
  
  return cleared;
}

/**
 * Clear all map data with a complete reset
 * A convenience function that performs a full clear
 */
export function resetMap() {
  return clearAllMapData({
    clearMarkers: true,
    clearSvgPaths: true,
    clearDrawings: true,
    refreshMap: true,
    preserveAuth: true
  });
}
