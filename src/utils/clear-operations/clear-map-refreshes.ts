
import { preserveAuthData } from './preserve-auth-data';
import { clearSvgPaths } from './clear-svg-paths';
import { clearAllMarkers, refreshMarkers } from './clear-markers';
import { clearAllDrawings, resetDrawingTools } from './clear-drawings';
import { forceMapRefresh } from './map-refresh';

/**
 * Provides a centralized method to clear map data while preserving essential state
 * @param featureGroup Optional Leaflet feature group to clear
 * @returns boolean indicating success
 */
export function clearMapData(featureGroup?: L.FeatureGroup): boolean {
  try {
    console.log('Starting comprehensive map data clear operation');
    
    // Step 1: Clear any visible feature layers if provided
    if (featureGroup) {
      console.log('Clearing feature group layers');
      featureGroup.clearLayers();
    }
    
    // Step 2: Clear SVG paths
    clearSvgPaths();
    
    // Step 3: Clear markers
    clearAllMarkers();
    
    // Step 4: Preserve authentication data before clearing localStorage
    const restoreAuthFn = preserveAuthData();
    
    // Step 5: Clear everything from localStorage
    console.log('Clearing localStorage');
    localStorage.clear();
    
    // Step 6: Restore authentication data
    if (typeof restoreAuthFn === 'function') {
      restoreAuthFn();
    }
    
    // Step 7: Clear drawings
    clearAllDrawings();
    
    // Step 8: Force map refresh
    forceMapRefresh();
    
    // Step 9: Reset drawing tools
    resetDrawingTools();
    
    // Step 10: Refresh markers
    refreshMarkers();
    
    console.log('Map data clear operation completed successfully');
    return true;
  } catch (error) {
    console.error('Error in map data clear operation:', error);
    return false;
  }
}
