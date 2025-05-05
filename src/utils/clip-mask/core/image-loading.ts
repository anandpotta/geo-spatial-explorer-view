
/**
 * Utilities for loading and preparing images for clip masks
 */
import { toast } from 'sonner';

// Track images that are currently loading
export const loadingImages = new Map<string, boolean>();

// Track which drawings have been displayed with toasts to avoid duplicates
export const toastShown = new Set<string>();

/**
 * Gets the stored image URL for a drawing from localStorage
 */
export const getStoredImageUrl = (drawingId: string): string | null => {
  try {
    const floorPlanKey = `floorplan-${drawingId}`;
    const storedData = localStorage.getItem(floorPlanKey);
    if (storedData) {
      const floorPlanData = JSON.parse(storedData);
      if (floorPlanData && floorPlanData.imageUrl) {
        return floorPlanData.imageUrl;
      }
    }
    return null;
  } catch (err) {
    console.error('Error retrieving stored image URL:', err);
    return null;
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
}
