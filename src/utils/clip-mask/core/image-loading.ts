
/**
 * Utilities for loading and preparing images for clip masks
 */
import { toast } from 'sonner';
import { getCurrentUser } from '@/services/auth-service';

// Track images that are currently loading
export const loadingImages = new Map<string, boolean>();

// Track which drawings have been displayed with toasts to avoid duplicates
export const toastShown = new Set<string>();

// Cache for stored image URLs to reduce localStorage access
const imageUrlCache = new Map<string, string>();

/**
 * Store an image URL for a specific drawing ID
 * Now with user ID association for proper data isolation
 */
export const storeImageUrl = (drawingId: string, imageUrl: string, fileName: string): void => {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    console.error('Cannot store image URL: No user is logged in');
    return;
  }

  try {
    // Create a user-specific storage key
    const storageKey = `floorPlanImages_${currentUser.id}`;
    
    // Get existing image URLs for this user
    const existingJson = localStorage.getItem(storageKey);
    const existingUrls = existingJson ? JSON.parse(existingJson) : {};
    
    // Add the new image URL
    existingUrls[drawingId] = {
      url: imageUrl,
      fileName: fileName,
      timestamp: new Date().toISOString(),
      userId: currentUser.id
    };
    
    // Save back to localStorage
    localStorage.setItem(storageKey, JSON.stringify(existingUrls));
    
    // Also update the cache
    imageUrlCache.set(`${currentUser.id}_${drawingId}`, imageUrl);
    
    console.log(`Stored image URL for drawing ${drawingId} for user ${currentUser.id}`);
  } catch (err) {
    console.error('Error storing image URL:', err);
  }
};

/**
 * Comprehensive function to retrieve a floor plan image URL from all possible sources
 * Now with user-specific retrieval
 */
export const retrieveFloorPlanImageUrl = (drawingId: string): string | null => {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    console.log('Cannot retrieve image URL: No user is logged in');
    return null;
  }
  
  // First check the in-memory cache for best performance
  const cacheKey = `${currentUser.id}_${drawingId}`;
  if (imageUrlCache.has(cacheKey)) {
    console.log(`Using cached image URL for ${drawingId}`);
    return imageUrlCache.get(cacheKey) || null;
  }
  
  try {
    // Get the user-specific storage key
    const storageKey = `floorPlanImages_${currentUser.id}`;
    
    // Try to get from localStorage
    const storedJson = localStorage.getItem(storageKey);
    if (storedJson) {
      const storedUrls = JSON.parse(storedJson);
      if (storedUrls[drawingId] && storedUrls[drawingId].url) {
        const imageUrl = storedUrls[drawingId].url;
        // Update cache
        imageUrlCache.set(cacheKey, imageUrl);
        console.log(`Found image URL in localStorage for drawing ${drawingId} and user ${currentUser.id}`);
        return imageUrl;
      }
    }
    
    // Check in floorPlans storage as fallback
    const floorPlansJson = localStorage.getItem('floorPlans');
    if (floorPlansJson) {
      const floorPlans = JSON.parse(floorPlansJson);
      if (floorPlans[drawingId] && 
          floorPlans[drawingId].userId === currentUser.id && 
          floorPlans[drawingId].data) {
        const imageUrl = floorPlans[drawingId].data;
        // Update cache
        imageUrlCache.set(cacheKey, imageUrl);
        console.log(`Found image URL in floorPlans for drawing ${drawingId} and user ${currentUser.id}`);
        return imageUrl;
      }
    }
    
    console.log(`No floor plan image URL found for ${drawingId} for user ${currentUser.id} in any storage location`);
    return null;
  } catch (e) {
    console.error('Error retrieving floor plan image URL:', e);
    return null;
  }
};

/**
 * Clear the cache when user changes or explicitly requested
 */
export const clearImageUrlCache = (): void => {
  imageUrlCache.clear();
  console.log('Image URL cache cleared');
};

// Listen for user changes and view changes
if (typeof window !== 'undefined') {
  window.addEventListener('userChanged', () => {
    clearImageUrlCache();
  });
  
  window.addEventListener('userLoggedOut', () => {
    clearImageUrlCache();
    loadingImages.clear();
    toastShown.clear();
  });
  
  window.addEventListener('storage', () => {
    clearImageUrlCache();
  });
  
  window.addEventListener('clearImageCache', () => {
    clearImageUrlCache();
  });
  
  window.addEventListener('mapViewChanged', () => {
    clearImageUrlCache();
  });
}
