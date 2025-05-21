
/**
 * Forces a refresh of the map
 */
export function forceMapRefresh() {
  // Dispatch storage and related events to notify components
  window.dispatchEvent(new Event('storage'));
  window.dispatchEvent(new Event('mapRefresh'));
  
  // Force a complete refresh of the map to ensure all elements are cleared
  setTimeout(() => {
    window.dispatchEvent(new Event('resize'));
  }, 100);
}
