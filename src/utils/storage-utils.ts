
/**
 * Utility functions for managing local storage
 */

/**
 * Clears all map-related data from local storage
 * This includes markers, drawings, floor plans and any associated data
 */
export function clearAllMapData(): void {
  // Clear all map-related data
  localStorage.removeItem('savedMarkers');
  localStorage.removeItem('savedDrawings');
  localStorage.removeItem('floorPlans');
  
  // Dispatch events to notify components about the changes
  window.dispatchEvent(new CustomEvent('markersUpdated', {
    detail: { timestamp: Date.now(), source: 'storage-clear' }
  }));
  
  window.dispatchEvent(new Event('storage'));
  window.dispatchEvent(new CustomEvent('floorPlanUpdated', {
    detail: { cleared: true }
  }));
}

/**
 * Clears only marker data from local storage
 */
export function clearMarkers(): void {
  localStorage.removeItem('savedMarkers');
  window.dispatchEvent(new CustomEvent('markersUpdated', {
    detail: { timestamp: Date.now(), source: 'markers-clear' }
  }));
}

/**
 * Clears only drawing data from local storage
 */
export function clearDrawings(): void {
  localStorage.removeItem('savedDrawings');
  window.dispatchEvent(new Event('storage'));
}

/**
 * Clears only floor plan data from local storage
 */
export function clearFloorPlans(): void {
  localStorage.removeItem('floorPlans');
  window.dispatchEvent(new CustomEvent('floorPlanUpdated', {
    detail: { cleared: true }
  }));
}
