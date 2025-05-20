
/**
 * Forces a refresh of the map
 */
export function forceMapRefresh() {
  // Dispatch storage and related events to notify components
  window.dispatchEvent(new Event('storage'));
  window.dispatchEvent(new Event('mapRefresh'));
  
  // Dispatch custom event specifically for map navigation
  window.dispatchEvent(new CustomEvent('mapNavigationRequest'));
  
  // Force a complete refresh of the map to ensure all elements are cleared
  setTimeout(() => {
    window.dispatchEvent(new Event('resize'));
  }, 100);

  // Force additional resize events for better reliability
  setTimeout(() => {
    window.dispatchEvent(new Event('resize'));
  }, 500);
}

/**
 * Create a utility function for properly handling location navigation
 * that ensures the map is ready before trying to navigate
 */
export function navigateToLocation(map: any, lat: number, lng: number, zoom: number = 15) {
  if (!map) {
    console.warn('Map not available for navigation');
    return false;
  }
  
  try {
    console.log(`Navigating to: ${lat}, ${lng} at zoom level ${zoom}`);
    
    // Ensure the map is properly initialized before navigating
    if (typeof map.invalidateSize === 'function') {
      map.invalidateSize(true);
    }
    
    // Check if map is valid and has necessary methods
    if (!map._loaded) {
      console.warn('Map not fully loaded yet, delaying navigation');
      return false;
    }
    
    // Use flyTo for smoother navigation with animation
    if (typeof map.flyTo === 'function') {
      map.flyTo([lat, lng], zoom, {
        animate: true,
        duration: 1.5
      });
      return true;
    } else if (typeof map.setView === 'function') {
      // Fallback to setView if flyTo is not available
      map.setView([lat, lng], zoom);
      return true;
    }
  } catch (error) {
    console.error('Error navigating to location:', error);
  }
  
  return false;
}
