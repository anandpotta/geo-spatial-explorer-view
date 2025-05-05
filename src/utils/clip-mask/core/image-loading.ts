
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
 * Comprehensive function to retrieve a floor plan image URL from all possible sources
 * Consolidates URL retrieval logic in one place for better maintainability
 */
export const retrieveFloorPlanImageUrl = (drawingId: string): string | null => {
  // First check the in-memory cache for best performance
  if (imageUrlCache.has(drawingId)) {
    console.log(`Using cached image URL for ${drawingId}`);
    return imageUrlCache.get(drawingId) || null;
  }
  
  try {
    // Check multiple possible storage keys that might contain the image URL
    const storageKeys = [
      `floorplan-${drawingId}`,
      `image-${drawingId}`,
      `clip-mask-${drawingId}`,
      `floor-plan-${drawingId}`
    ];
    
    // Try each storage key
    for (const key of storageKeys) {
      const storedData = localStorage.getItem(key);
      if (storedData) {
        try {
          const parsedData = JSON.parse(storedData);
          if (parsedData && parsedData.imageUrl) {
            // Found a valid URL, store in cache and return
            const imageUrl = parsedData.imageUrl;
            imageUrlCache.set(drawingId, imageUrl);
            console.log(`Retrieved image URL from ${key}: ${imageUrl}`);
            return imageUrl;
          }
        } catch (e) {
          console.warn(`Error parsing stored data for key ${key}:`, e);
        }
      }
    }
    
    // If we reach here, also check for direct URL storage without JSON structure
    for (const key of storageKeys) {
      const directUrl = localStorage.getItem(`${key}-url`);
      if (directUrl && (directUrl.startsWith('http') || directUrl.startsWith('blob:') || directUrl.startsWith('data:'))) {
        // Found a direct URL
        imageUrlCache.set(drawingId, directUrl);
        console.log(`Retrieved direct image URL from ${key}-url: ${directUrl}`);
        return directUrl;
      }
    }
    
    // Also check sessionStorage as a fallback
    for (const key of storageKeys) {
      const sessionData = sessionStorage.getItem(key);
      if (sessionData) {
        try {
          const parsedData = JSON.parse(sessionData);
          if (parsedData && parsedData.imageUrl) {
            const imageUrl = parsedData.imageUrl;
            imageUrlCache.set(drawingId, imageUrl);
            console.log(`Retrieved image URL from sessionStorage ${key}: ${imageUrl}`);
            return imageUrl;
          }
        } catch (e) {
          console.warn(`Error parsing session data for key ${key}:`, e);
        }
      }
    }
    
    // Now also check the floorPlans object in localStorage which is used by FloorPlanView
    const floorPlansJson = localStorage.getItem('floorPlans');
    if (floorPlansJson) {
      try {
        const floorPlans = JSON.parse(floorPlansJson);
        if (floorPlans && floorPlans[drawingId] && floorPlans[drawingId].data) {
          const imageUrl = floorPlans[drawingId].data;
          imageUrlCache.set(drawingId, imageUrl);
          console.log(`Retrieved floor plan image from floorPlans: ${imageUrl.substring(0, 50)}...`);
          return imageUrl;
        }
      } catch (e) {
        console.warn('Error parsing floorPlans data:', e);
      }
    }
    
    console.log(`No floor plan image URL found for ${drawingId} in any storage location`);
    return null;
  } catch (err) {
    console.error('Error retrieving floor plan image URL:', err);
    return null;
  }
};

/**
 * Gets the stored image URL for a drawing from localStorage
 * Uses a cache to prevent excessive localStorage reads
 */
export const getStoredImageUrl = (drawingId: string): string | null => {
  // Use the new comprehensive function for retrieving the URL
  return retrieveFloorPlanImageUrl(drawingId);
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
    
    // Also store in a direct URL format for easier retrieval
    localStorage.setItem(`${floorPlanKey}-url`, imageUrl);
    
    // Update cache
    imageUrlCache.set(drawingId, imageUrl);
    
    // Also store in the floorPlans object used by FloorPlanView for proper integration
    try {
      const floorPlansJson = localStorage.getItem('floorPlans');
      const floorPlans = floorPlansJson ? JSON.parse(floorPlansJson) : {};
      
      // Add the user ID 
      const userData = localStorage.getItem('userData');
      let userId = 'anonymous';
      if (userData) {
        try {
          const user = JSON.parse(userData);
          if (user && user.id) {
            userId = user.id;
          }
        } catch (e) {
          console.warn('Error parsing user data:', e);
        }
      }
      
      // Create the floor plan entry
      floorPlans[drawingId] = {
        data: imageUrl,
        name: fileName || 'uploaded-image',
        type: imageUrl.startsWith('data:image') ? 'image/png' : 'application/octet-stream',
        uploaded: new Date().toISOString(),
        userId: userId,
        isPdf: false,
        fileName: fileName || 'uploaded-image'
      };
      
      // Store the updated floorPlans
      localStorage.setItem('floorPlans', JSON.stringify(floorPlans));
      
      console.log(`Stored image URL in floorPlans for ${drawingId}`);
      
      // Trigger a floor plan update event
      window.dispatchEvent(new CustomEvent('floorPlanUpdated', { 
        detail: { drawingId, freshlyUploaded: true } 
      }));
    } catch (e) {
      console.warn('Error updating floorPlans object:', e);
    }
    
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
