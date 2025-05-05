
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
  
  // If imageUrl is just the drawing ID, try to get the stored URL from localStorage
  if (typeof imageUrl === 'string') {
    if (imageUrl === drawingId || 
        (!imageUrl.startsWith('blob:') && !imageUrl.startsWith('data:'))) {
      console.log(`Looking up stored image URL for drawing ID: ${drawingId}`);
      const storedUrl = getStoredImageUrl(drawingId);
      if (storedUrl) {
        imageUrlString = storedUrl;
        console.log(`Found stored image URL: ${imageUrlString}`);
      } else {
        console.error(`No stored image URL found for drawing ID: ${drawingId}`);
        return null;
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
      return null;
    }
  } else {
    // If no valid imageUrl, try to get the stored URL from localStorage
    console.log(`No valid imageUrl provided, trying to get stored URL for ${drawingId}`);
    const storedUrl = getStoredImageUrl(drawingId);
    if (storedUrl) {
      imageUrlString = storedUrl;
      console.log(`Using stored image URL: ${imageUrlString}`);
    } else {
      console.error(`No valid imageUrl and no stored URL found for ${drawingId}`);
      return null;
    }
  }
  
  return imageUrlString;
};

// Import from image-loading.ts
import { getStoredImageUrl } from './image-loading';
