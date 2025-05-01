
/**
 * Manages caching for clip mask operations
 */

// Track application attempts to avoid repeated failures
export const applicationAttempts = new Map<string, number>();
// Track successful applications to avoid reapplying
export const successfulApplications = new Map<string, boolean>();
// Track the last time we tried to apply a mask to a drawing
export const lastApplicationTime = new Map<string, number>();
// Cache to store which paths already have masks applied
export const clipMaskCache = new Map<string, boolean>();
// Track element identifiers to detect if the actual element has changed
export const elementIdentifiers = new Map<string, string>();

/**
 * Clear caches to force fresh processing
 */
export const clearCaches = () => {
  clipMaskCache.clear();
  elementIdentifiers.clear();
};

// Reset clip mask cache when window visibility changes
if (typeof window !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      // Clear caches when tab becomes visible again
      clearCaches();
    }
  });
}
