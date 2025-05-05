
/**
 * Utilities for handling image URLs in clip masks
 */

/**
 * Resolves image URL from various inputs
 * Returns a valid string URL or null if it can't be resolved
 */
export const resolveImageUrl = (
  imageUrl: string | object | null | undefined, 
  drawingId: string
): string | null => {
  // Handle different image URL types
  let imageUrlString: string | null = null;
  
  // First check if we have a valid direct URL
  if (typeof imageUrl === 'string') {
    if (imageUrl === drawingId || 
        (!imageUrl.startsWith('blob:') && !imageUrl.startsWith('data:') && !imageUrl.startsWith('http'))) {
      console.log(`Looking up stored image URL for drawing ID: ${drawingId}`);
      const storedUrl = getStoredImageUrl(drawingId);
      if (storedUrl) {
        imageUrlString = storedUrl;
        console.log(`Found stored image URL: ${imageUrlString}`);
      } else {
        console.error(`No stored image URL found for drawing ID: ${drawingId}`);
        return getDefaultImageUrl(drawingId);
      }
    } else {
      imageUrlString = imageUrl;
    }
  } else if (typeof imageUrl === 'object' && imageUrl !== null) {
    console.warn('Object passed as imageUrl, trying to convert to string:', imageUrl);
    try {
      imageUrlString = JSON.stringify(imageUrl);
    } catch (err) {
      console.error('Failed to convert imageUrl object to string:', err);
      return getDefaultImageUrl(drawingId);
    }
  } else {
    // If no valid imageUrl, try to get the stored URL from localStorage
    console.log(`No valid imageUrl provided, trying to get stored URL for ${drawingId}`);
    const storedUrl = getStoredImageUrl(drawingId);
    if (storedUrl) {
      imageUrlString = storedUrl;
      console.log(`Using stored image URL: ${imageUrlString}`);
    } else {
      // Check all possible storage locations for this drawing's image
      const fallbackUrl = getFallbackImageUrl(drawingId);
      if (fallbackUrl) {
        console.log(`Found fallback image URL for ${drawingId}: ${fallbackUrl}`);
        return fallbackUrl;
      }
      
      console.error(`No valid imageUrl and no stored URL found for ${drawingId}`);
      return getDefaultImageUrl(drawingId);
    }
  }
  
  return imageUrlString;
};

/**
 * Gets a fallback image URL by checking multiple storage locations
 */
export const getFallbackImageUrl = (drawingId: string): string | null => {
  // Try different storage keys that might contain the image
  const possibleKeys = [
    `floorplan-${drawingId}`,
    `image-${drawingId}`,
    `clip-mask-${drawingId}`
  ];
  
  for (const key of possibleKeys) {
    try {
      const data = localStorage.getItem(key);
      if (data) {
        const parsed = JSON.parse(data);
        if (parsed && parsed.imageUrl) {
          return parsed.imageUrl;
        }
      }
    } catch (e) {
      console.warn(`Error checking storage key ${key}:`, e);
    }
  }
  
  return null;
};

/**
 * Returns a default placeholder image URL when no real image is available
 */
export const getDefaultImageUrl = (drawingId: string): string | null => {
  // Create a data URL for a placeholder pattern
  // This ensures we always have something to display rather than an error
  return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
    <pattern id="pattern" patternUnits="userSpaceOnUse" width="10" height="10">
      <rect width="5" height="5" fill="%233b82f6" fill-opacity="0.5" />
      <rect x="5" y="5" width="5" height="5" fill="%233b82f6" fill-opacity="0.5" />
    </pattern>
    <rect width="100" height="100" fill="url(%23pattern)" />
    <text x="10" y="50" font-family="sans-serif" font-size="10" fill="%23000">ID: ${drawingId.substring(0, 8)}</text>
  </svg>`;
};

// Import from image-loading.ts
import { getStoredImageUrl } from './image-loading';
