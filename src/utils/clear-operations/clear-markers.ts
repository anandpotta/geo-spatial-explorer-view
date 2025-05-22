
let allMarkers: any[] = [];

/**
 * Clears all markers from the map and storage
 */
export function clearAllMarkers(): void {
  // Remove markers from the storage
  localStorage.removeItem('savedMarkers');
  
  // Clear the in-memory markers array
  allMarkers = [];
  
  // Dispatch an event to notify components
  window.dispatchEvent(new Event('markersUpdated'));
  console.log('All markers cleared');
}

/**
 * Refreshes markers after view transition
 */
export function refreshMarkers(): void {
  // Force update of marker components
  window.dispatchEvent(new Event('markersRefreshed'));
  window.dispatchEvent(new Event('storage')); // For components listening to storage events
}
