
/**
 * Clears all drawings from storage
 */
export function clearAllDrawings() {
  try {
    // Clear drawings from storage
    localStorage.removeItem('savedDrawings');
    localStorage.removeItem('floorPlans');
    
    // Dispatch event to notify components
    window.dispatchEvent(new Event('drawingsUpdated'));
    window.dispatchEvent(new CustomEvent('floorPlanUpdated', { detail: { cleared: true } }));
    
    return true;
  } catch (error) {
    console.error('Error clearing drawings:', error);
    return false;
  }
}
