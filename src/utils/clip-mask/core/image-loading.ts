
/**
 * Utilities for loading and preparing images for clip masks
 */
import { toast } from 'sonner';

// Track images that are currently loading
export const loadingImages = new Map<string, boolean>();

// Track which drawings have been displayed with toasts to avoid duplicates
export const toastShown = new Set<string>();

// Cache for stored image URLs to reduce localStorage access
const imageUrlCache = new Map<string, string>();

/**
 * Gets the stored image URL for a drawing from localStorage
 * Uses a cache to prevent excessive localStorage reads
 */
export const getStoredImageUrl = (drawingId: string): string | null => {
  // First check the cache
  if (imageUrlCache.has(drawingId)) {
    console.log(`Using cached image URL for ${drawingId}`);
    return imageUrlCache.get(drawingId) || null;
  }
  
  try {
    // Check multiple storage keys that might contain the image URL
    const keys = [
      `floorplan-${drawingId}`,
      `image-${drawingId}`,
      `clip-mask-${drawingId}`
    ];
    
    for (const key of keys) {
      const storedData = localStorage.getItem(key);
      if (storedData) {
        try {
          const floorPlanData = JSON.parse(storedData);
          if (floorPlanData && floorPlanData.imageUrl) {
            // Store in cache for future use
            imageUrlCache.set(drawingId, floorPlanData.imageUrl);
            return floorPlanData.imageUrl;
          }
        } catch (e) {
          console.warn(`Error parsing stored data for key ${key}:`, e);
        }
      }
    }
    
    // If we reach here, no valid image URL was found
    return null;
  } catch (err) {
    console.error('Error retrieving stored image URL:', err);
    return null;
  }
};

/**
 * Stores an image URL for a drawing in localStorage and updates the cache
 */
export const storeImageUrl = (drawingId: string, imageUrl: string, fileName?: string): void => {
  try {
    const floorPlanKey = `floorplan-${drawingId}`;
    const floorPlanData = { 
      imageUrl, 
      timestamp: Date.now(),
      fileName: fileName || 'uploaded-image'
    };
    
    // Store in localStorage
    localStorage.setItem(floorPlanKey, JSON.stringify(floorPlanData));
    
    // Update cache
    imageUrlCache.set(drawingId, imageUrl);
    
    console.log(`Stored image URL in localStorage with key: ${floorPlanKey}`);
  } catch (err) {
    console.error('Error storing image URL:', err);
  }
};

/**
 * Reset the toast tracking when the page reloads
 */
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    toastShown.clear();
    loadingImages.clear();
  });
  
  // Also listen for storage events to update our cache
  window.addEventListener('storage', (event) => {
    if (event.key && event.key.startsWith('floorplan-')) {
      const drawingId = event.key.replace('floorplan-', '');
      
      // Clear cache for this drawing to force a fresh load
      imageUrlCache.delete(drawingId);
      
      // Also clear loading state if it exists
      loadingImages.delete(drawingId);
      
      console.log(`Cache cleared for ${drawingId} due to storage event`);
    }
  });
}
