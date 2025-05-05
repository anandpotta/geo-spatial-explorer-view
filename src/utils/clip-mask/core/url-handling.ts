
import { retrieveFloorPlanImageUrl } from './image-loading';
import { getCurrentUser } from '@/services/auth-service';

/**
 * Get a default pattern image URL for a drawing ID
 */
export const getDefaultImageUrl = (id: string): string => {
  // Create a simple SVG pattern as a default background
  return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
    <pattern id="pattern" patternUnits="userSpaceOnUse" width="10" height="10">
      <rect width="5" height="5" fill="%233b82f6" fill-opacity="0.5" />
      <rect x="5" y="5" width="5" height="5" fill="%233b82f6" fill-opacity="0.5" />
    </pattern>
    <rect width="100" height="100" fill="url(%23pattern)" />
    <text x="10" y="50" font-family="sans-serif" font-size="10" fill="%23000">ID: ${id.substring(0, 8)}</text>
  </svg>`;
};

/**
 * Resolve an image URL from various possible inputs
 */
export const resolveImageUrl = (
  imageUrl: string | object | null | undefined, 
  id: string
): string | null => {
  if (!imageUrl) {
    // First try to get a stored URL
    console.log(`No valid imageUrl provided, trying to get stored URL for ${id}`);
    const storedUrl = retrieveFloorPlanImageUrl(id);
    
    if (!storedUrl) {
      console.log(`No valid imageUrl and no stored URL found for ${id}`);
      return null;
    }
    
    return storedUrl;
  }
  
  // If it's already a string, use it directly
  if (typeof imageUrl === 'string') {
    return imageUrl;
  }
  
  // If it's an object, we need to extract the URL
  if (typeof imageUrl === 'object' && imageUrl !== null) {
    // Try various possible object structures
    if ('url' in imageUrl && typeof (imageUrl as any).url === 'string') {
      return (imageUrl as any).url;
    }
    
    if ('src' in imageUrl && typeof (imageUrl as any).src === 'string') {
      return (imageUrl as any).src;
    }
    
    if ('data' in imageUrl && typeof (imageUrl as any).data === 'string') {
      return (imageUrl as any).data;
    }
    
    if ('imageUrl' in imageUrl && typeof (imageUrl as any).imageUrl === 'string') {
      return (imageUrl as any).imageUrl;
    }
  }
  
  console.log(`Could not resolve image URL from`, imageUrl);
  return null;
};
