
/**
 * Forces a map refresh by dispatching custom events
 * @returns True if the refresh was triggered
 */
export function forceMapRefresh(): boolean {
  try {
    // Dispatch events to notify components about the refresh
    window.dispatchEvent(new Event('mapRefresh'));
    window.dispatchEvent(new Event('mapViewChange'));
    console.log('Map refresh triggered');
    return true;
  } catch (error) {
    console.error('Error triggering map refresh:', error);
    return false;
  }
}
