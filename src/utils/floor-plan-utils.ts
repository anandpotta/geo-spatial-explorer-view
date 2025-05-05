import { getCurrentUser } from '@/services/auth-service';
import { toast } from 'sonner';

export interface FloorPlanData {
  data: string;
  name: string;
  type: string;
  uploaded: string;
  userId: string;
  isPdf: boolean;
  fileName: string;
}

// Constants for storage limits
const MAX_FILE_SIZE_MB = 4;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const MAX_TOTAL_STORAGE_MB = 4.5; // Set a limit slightly below the 5MB localStorage limit

/**
 * Checks if a drawing has an associated floor plan
 */
export async function hasFloorPlan(drawingId: string): Promise<boolean> {
  const currentUser = getCurrentUser();
  if (!currentUser) return false;
  
  const floorPlansJson = localStorage.getItem('floorPlans');
  if (!floorPlansJson) return false;
  
  try {
    const floorPlans = JSON.parse(floorPlansJson);
    const floorPlan = floorPlans[drawingId];
    
    // Check if the floor plan belongs to the current user
    return floorPlan && floorPlan.userId === currentUser.id;
  } catch (e) {
    console.error('Error checking for floor plan:', e);
    return false;
  }
}

/**
 * Gets floor plan data for a specific drawing
 */
export async function getFloorPlanById(drawingId: string): Promise<FloorPlanData | null> {
  const currentUser = getCurrentUser();
  if (!currentUser) return null;
  
  const floorPlansJson = localStorage.getItem('floorPlans');
  if (!floorPlansJson) return null;
  
  try {
    const floorPlans = JSON.parse(floorPlansJson);
    const floorPlan = floorPlans[drawingId];
    
    // Only return the floor plan if it belongs to the current user
    if (floorPlan && floorPlan.userId === currentUser.id) {
      return floorPlan;
    }
    return null;
  } catch (e) {
    console.error('Error getting floor plan:', e);
    return null;
  }
}

/**
 * Gets all drawing IDs that have floor plans associated with them
 */
export async function getDrawingIdsWithFloorPlans(): Promise<string[]> {
  const currentUser = getCurrentUser();
  if (!currentUser) return [];
  
  const floorPlansJson = localStorage.getItem('floorPlans');
  if (!floorPlansJson) return [];
  
  try {
    const floorPlans = JSON.parse(floorPlansJson);
    // Filter floor plans to only include ones that belong to the current user
    const drawingIds = Object.entries(floorPlans)
      .filter(([_, floorPlan]) => (floorPlan as any).userId === currentUser.id)
      .map(([drawingId]) => drawingId);
    return drawingIds;
  } catch (e) {
    console.error('Error getting drawing IDs with floor plans:', e);
    return [];
  }
}

/**
 * Checks if storage has enough space for a new item
 */
function hasStorageSpace(dataSize: number): boolean {
  try {
    // Estimate current storage usage
    let totalSize = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key);
        if (value) {
          totalSize += value.length;
        }
      }
    }
    
    // Check against our own defined limit, which is below the browser limit
    const availableSpace = MAX_TOTAL_STORAGE_MB * 1024 * 1024 - totalSize;
    
    return dataSize < availableSpace;
  } catch (e) {
    console.error('Error checking storage space:', e);
    return false;
  }
}

/**
 * Get the current storage usage in MB
 */
function getCurrentStorageUsage(): number {
  let totalSize = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      const value = localStorage.getItem(key);
      if (value) {
        totalSize += value.length;
      }
    }
  }
  return totalSize / (1024 * 1024);
}

/**
 * Reduces image quality to decrease file size
 */
function reduceImageQuality(dataUrl: string, quality: number = 0.7): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      ctx.drawImage(img, 0, 0);
      
      // Get reduced quality version
      const format = dataUrl.includes('image/png') ? 'image/png' : 'image/jpeg';
      resolve(canvas.toDataURL(format, quality));
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = dataUrl;
  });
}

/**
 * Force clear all floor plans to make space
 */
function forceStorageCleanup(): boolean {
  try {
    // Clear all floor plans to make space
    localStorage.removeItem('floorPlans');
    
    // Try to save a small test value to ensure we have space
    localStorage.setItem('test', 'test');
    localStorage.removeItem('test');
    
    return true;
  } catch (e) {
    console.error('Error clearing storage space:', e);
    return false;
  }
}

/**
 * Clean up older floor plans to make room for new ones
 */
function clearOldFloorPlans(userId: string, newPlanSize: number): boolean {
  try {
    const floorPlansJson = localStorage.getItem('floorPlans');
    if (!floorPlansJson) return true;
    
    const floorPlans = JSON.parse(floorPlansJson);
    
    // Get floor plans belonging to this user, sorted by upload date (oldest first)
    const userFloorPlans = Object.entries(floorPlans)
      .filter(([_, plan]) => (plan as any).userId === userId)
      .sort((a, b) => {
        const dateA = new Date((a[1] as any).uploaded).getTime();
        const dateB = new Date((b[1] as any).uploaded).getTime();
        return dateA - dateB;
      });
    
    // If we don't have many floor plans, don't delete anything
    if (userFloorPlans.length < 3) return false;
    
    // Remove oldest plans until we free enough space
    let deletedCount = 0;
    let totalDeleted = 0;
    for (const [drawingId, _] of userFloorPlans) {
      // Don't delete too many, keep at least the newest ones
      if (deletedCount >= Math.ceil(userFloorPlans.length / 2)) break;
      
      // Track how many we've deleted
      delete floorPlans[drawingId];
      deletedCount++;
      totalDeleted++;
      
      // Try to save the reduced floor plans
      try {
        localStorage.setItem('floorPlans', JSON.stringify(floorPlans));
        console.log(`Removed ${totalDeleted} old floor plans to make space`);
        return true;
      } catch (e) {
        // If we still can't save, continue deleting more
        console.log('Still not enough space, continuing to remove plans');
      }
    }
    
    // If we've deleted all user floor plans and still no space, try more drastic measures
    if (deletedCount >= userFloorPlans.length) {
      return forceStorageCleanup();
    }
    
    return false;
  } catch (e) {
    console.error('Error clearing old floor plans:', e);
    // Try force cleanup as a last resort
    return forceStorageCleanup();
  }
}

/**
 * Saves floor plan data for a specific drawing with quota handling
 */
export function saveFloorPlan(
  drawingId: string, 
  floorPlanData: {
    data: string;
    isPdf: boolean;
    fileName: string;
  }
): boolean {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    console.error('Cannot save floor plan: No user is logged in');
    toast.error('You must be logged in to save floor plans');
    return false;
  }
  
  try {
    // Calculate size of the data
    const dataSize = floorPlanData.data.length;
    
    // Check if file is too large (over 4MB)
    if (dataSize > MAX_FILE_SIZE_BYTES) {
      toast.error(`File too large (${(dataSize / 1024 / 1024).toFixed(1)}MB). Maximum size is ${MAX_FILE_SIZE_MB}MB`);
      return false;
    }
    
    // Check current storage usage and warn if close to limit
    const currentUsage = getCurrentStorageUsage();
    console.log(`Current storage usage: ${currentUsage.toFixed(2)}MB / ${MAX_TOTAL_STORAGE_MB}MB`);
    
    if (currentUsage > MAX_TOTAL_STORAGE_MB * 0.7) {
      console.warn('Storage usage is high, consider clearing some old floor plans');
    }
    
    const floorPlansJson = localStorage.getItem('floorPlans');
    const floorPlans = floorPlansJson ? JSON.parse(floorPlansJson) : {};
    
    // Add the user ID to the floor plan data
    const newFloorPlan = {
      data: floorPlanData.data,
      name: floorPlanData.fileName,
      type: floorPlanData.isPdf ? 'application/pdf' : 'image/png',
      uploaded: new Date().toISOString(),
      userId: currentUser.id,
      isPdf: floorPlanData.isPdf,
      fileName: floorPlanData.fileName
    };
    
    // Prepare the updated floorPlans object
    const updatedFloorPlans = { ...floorPlans, [drawingId]: newFloorPlan };
    
    // Try to save directly first
    try {
      localStorage.setItem('floorPlans', JSON.stringify(updatedFloorPlans));
      
      // Notify components about the floor plan update
      window.dispatchEvent(new CustomEvent('floorPlanUpdated', { 
        detail: { drawingId, userId: currentUser.id } 
      }));
      
      return true;
    } catch (e) {
      console.warn('Storage quota exceeded, attempting to optimize...');
      
      // Try clearing old floor plans first
      const cleared = clearOldFloorPlans(currentUser.id, dataSize);
      
      if (cleared) {
        // Try saving again after clearing old plans
        try {
          const refreshedPlans = localStorage.getItem('floorPlans');
          const currentPlans = refreshedPlans ? JSON.parse(refreshedPlans) : {};
          currentPlans[drawingId] = newFloorPlan;
          
          localStorage.setItem('floorPlans', JSON.stringify(currentPlans));
          
          toast.success('Old floor plans removed to make space for new one');
          window.dispatchEvent(new CustomEvent('floorPlanUpdated', { 
            detail: { drawingId, userId: currentUser.id } 
          }));
          
          return true;
        } catch (saveErr) {
          console.error('Still not enough storage space after cleanup:', saveErr);
        }
      }
      
      // If image (not PDF), try to reduce quality as fallback
      if (!floorPlanData.isPdf && floorPlanData.data.startsWith('data:image')) {
        try {
          toast.info('Compressing image to fit in storage...');
          
          reduceImageQuality(floorPlanData.data, 0.4)
            .then(reducedData => {
              // Try again with reduced quality
              const compressedPlan = {
                ...newFloorPlan,
                data: reducedData
              };
              
              try {
                // Get fresh version of floorPlans
                const refreshedPlans = localStorage.getItem('floorPlans');
                const currentPlans = refreshedPlans ? JSON.parse(refreshedPlans) : {};
                currentPlans[drawingId] = compressedPlan;
                
                localStorage.setItem('floorPlans', JSON.stringify(currentPlans));
                
                toast.success('Floor plan saved with reduced quality');
                window.dispatchEvent(new CustomEvent('floorPlanUpdated', { 
                  detail: { drawingId, userId: currentUser.id } 
                }));
                
                return true;
              } catch (err) {
                console.error('Still not enough space after compression:', err);
                toast.error('Not enough storage space. Please clear all data and try again.');
                return false;
              }
            })
            .catch(err => {
              console.error('Error reducing image quality:', err);
              toast.error('Could not compress the image');
              return false;
            });
        } catch (compressErr) {
          console.error('Error in compression process:', compressErr);
        }
      } else {
        toast.error('Storage limit reached. Please clear all data and try again.');
        return false;
      }
    }
  } catch (e) {
    console.error('Error saving floor plan:', e);
    toast.error('Failed to save floor plan');
    return false;
  }
  
  return false;
}

/**
 * Deletes a floor plan for a specific drawing
 */
export function deleteFloorPlan(drawingId: string): void {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    console.error('Cannot delete floor plan: No user is logged in');
    return;
  }
  
  try {
    const floorPlansJson = localStorage.getItem('floorPlans');
    if (!floorPlansJson) return;
    
    const floorPlans = JSON.parse(floorPlansJson);
    
    // Check if the floor plan belongs to the current user before deleting
    if (floorPlans[drawingId] && floorPlans[drawingId].userId === currentUser.id) {
      delete floorPlans[drawingId];
      localStorage.setItem('floorPlans', JSON.stringify(floorPlans));
      
      // Also remove from the user-specific storage
      const storageKey = `floorPlanImages_${currentUser.id}`;
      const existingJson = localStorage.getItem(storageKey);
      if (existingJson) {
        const existingUrls = JSON.parse(existingJson);
        if (existingUrls[drawingId]) {
          delete existingUrls[drawingId];
          localStorage.setItem(storageKey, JSON.stringify(existingUrls));
        }
      }
    } else {
      console.warn('Cannot delete floor plan: Floor plan belongs to another user');
    }
  } catch (e) {
    console.error('Error deleting floor plan:', e);
  }
}
