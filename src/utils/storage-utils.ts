
/**
 * Utility functions for managing localStorage
 */

export function clearAllLocalStorage(): void {
  try {
    // Clear all localStorage data
    localStorage.clear();
    
    // Dispatch events to notify components about the changes
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new Event('markersUpdated'));
    window.dispatchEvent(new Event('drawingsUpdated'));
    window.dispatchEvent(new Event('floorPlanUpdated'));
    
    console.log('✅ All localStorage data cleared successfully');
  } catch (error) {
    console.error('❌ Error clearing localStorage:', error);
  }
}

export function getStorageUsage(): { used: number; quota: number; percentage: number } {
  try {
    // Calculate approximate storage usage
    let totalSize = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        totalSize += localStorage[key].length + key.length;
      }
    }
    
    // Most browsers have a 5-10MB limit for localStorage
    const estimatedQuota = 5 * 1024 * 1024; // 5MB
    const percentage = (totalSize / estimatedQuota) * 100;
    
    return {
      used: totalSize,
      quota: estimatedQuota,
      percentage: Math.min(percentage, 100)
    };
  } catch (error) {
    console.error('Error calculating storage usage:', error);
    return { used: 0, quota: 0, percentage: 0 };
  }
}

export function clearSpecificStorageKeys(keys: string[]): void {
  try {
    keys.forEach(key => {
      localStorage.removeItem(key);
      console.log(`Removed localStorage key: ${key}`);
    });
    
    // Dispatch events to notify components
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new Event('markersUpdated'));
    window.dispatchEvent(new Event('drawingsUpdated'));
    window.dispatchEvent(new Event('floorPlanUpdated'));
    
    console.log('✅ Specified localStorage keys cleared successfully');
  } catch (error) {
    console.error('❌ Error clearing specific localStorage keys:', error);
  }
}

// Call this function immediately to clear localStorage
clearAllLocalStorage();
