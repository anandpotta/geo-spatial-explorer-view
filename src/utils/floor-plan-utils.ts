
import { toast } from 'sonner';
import { getCurrentUser } from '@/services/auth-service';

// Define the FloorPlan interface as a type that can be exported
export interface FloorPlan {
  data: string;
  isPdf: boolean;
  fileName: string;
  userId?: string;
  timestamp?: string;
}

// Export the type as FloorPlanData for backward compatibility
export type FloorPlanData = FloorPlan;

/**
 * Compress image data to reduce storage size
 */
function compressImageData(dataUrl: string, maxSize: number = 1024 * 1024): Promise<string> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Calculate new dimensions to keep aspect ratio
      let { width, height } = img;
      const maxDimension = 1200; // Max width or height
      
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = (height * maxDimension) / width;
          width = maxDimension;
        } else {
          width = (width * maxDimension) / height;
          height = maxDimension;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        
        // Start with good quality and reduce if needed
        let quality = 0.8;
        let compressedData = canvas.toDataURL('image/jpeg', quality);
        
        // Reduce quality until size is acceptable
        while (compressedData.length > maxSize && quality > 0.1) {
          quality -= 0.1;
          compressedData = canvas.toDataURL('image/jpeg', quality);
        }
        
        resolve(compressedData);
      } else {
        resolve(dataUrl);
      }
    };
    
    img.src = dataUrl;
  });
}

/**
 * Get current storage usage
 */
function getStorageUsage(): number {
  let totalSize = 0;
  for (let key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      totalSize += localStorage[key].length + key.length;
    }
  }
  return totalSize;
}

/**
 * Clean up old floor plans to make space
 */
function cleanupOldFloorPlans(): void {
  try {
    const floorPlansJson = localStorage.getItem('floorPlans');
    if (!floorPlansJson) return;
    
    const floorPlans = JSON.parse(floorPlansJson);
    const currentUser = getCurrentUser();
    const userId = currentUser?.id || 'anonymous';
    
    // Get user's floor plans and sort by timestamp
    const userPlans = Object.entries(floorPlans)
      .filter(([_, plan]) => (plan as FloorPlan).userId === userId)
      .sort(([_, a], [__, b]) => {
        const timeA = new Date((a as FloorPlan).timestamp || 0).getTime();
        const timeB = new Date((b as FloorPlan).timestamp || 0).getTime();
        return timeA - timeB; // Oldest first
      });
    
    // Remove oldest plans if we have more than 10
    if (userPlans.length > 10) {
      const toRemove = userPlans.slice(0, userPlans.length - 10);
      toRemove.forEach(([id]) => {
        delete floorPlans[id];
      });
      
      localStorage.setItem('floorPlans', JSON.stringify(floorPlans));
      console.log(`Cleaned up ${toRemove.length} old floor plans`);
    }
  } catch (error) {
    console.error('Error cleaning up old floor plans:', error);
  }
}

/**
 * Save a floor plan for a specific drawing
 */
export async function saveFloorPlan(
  drawingId: string, 
  floorPlan: FloorPlan
): Promise<boolean> {
  const currentUser = getCurrentUser();
  const userId = currentUser?.id || 'anonymous';
  
  console.log(`🔄 saveFloorPlan: Saving floor plan for drawing ${drawingId} with user ${userId}`);
  
  try {
    let processedData = floorPlan.data;
    
    // Compress image data if it's an image (not PDF)
    if (!floorPlan.isPdf && floorPlan.data.startsWith('data:image/')) {
      console.log('Compressing image data...');
      processedData = await compressImageData(floorPlan.data);
      console.log(`Image compressed from ${floorPlan.data.length} to ${processedData.length} characters`);
    }
    
    // Add user ID and timestamp to the floor plan data
    const floorPlanWithUser = {
      ...floorPlan,
      data: processedData,
      userId: userId,
      timestamp: new Date().toISOString()
    };
    
    // Check storage usage before saving
    const currentUsage = getStorageUsage();
    const estimatedNewSize = JSON.stringify(floorPlanWithUser).length;
    const maxStorage = 4 * 1024 * 1024; // 4MB limit to be safe
    
    if (currentUsage + estimatedNewSize > maxStorage) {
      console.log('Storage limit approaching, cleaning up old floor plans...');
      cleanupOldFloorPlans();
      
      // Check again after cleanup
      const newUsage = getStorageUsage();
      if (newUsage + estimatedNewSize > maxStorage) {
        toast.error('Storage limit reached. Please delete some old floor plans or use smaller images.');
        return false;
      }
    }
    
    // Get existing floor plans
    const floorPlansJson = localStorage.getItem('floorPlans');
    const floorPlans = floorPlansJson ? JSON.parse(floorPlansJson) : {};
    
    // Add or update this floor plan
    floorPlans[drawingId] = floorPlanWithUser;
    
    // Save back to localStorage
    localStorage.setItem('floorPlans', JSON.stringify(floorPlans));
    
    console.log(`✅ saveFloorPlan: Successfully saved floor plan for ${drawingId} with user ${userId}`);
    
    // Show success message if this is a new upload
    if (!floorPlansJson || !JSON.parse(floorPlansJson)[drawingId]) {
      toast.success('Floor plan saved successfully');
    }
    
    // Dispatch event to trigger UI updates
    window.dispatchEvent(new CustomEvent('floorPlanUpdated', {
      detail: { drawingId, userId }
    }));
    
    return true;
  } catch (error) {
    console.error('Error saving floor plan:', error);
    
    // Check if error is related to storage quota
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      toast.error('Storage limit exceeded. Try uploading a smaller file or delete old floor plans.');
    } else {
      toast.error('Failed to save floor plan');
    }
    
    return false;
  }
}

/**
 * Get a floor plan by drawing ID
 */
export async function getFloorPlanById(drawingId: string): Promise<FloorPlan | null> {
  const currentUser = getCurrentUser();
  const userId = currentUser?.id || 'anonymous';
  
  console.log(`🔍 getFloorPlanById: Looking for floor plan for drawing ${drawingId} with user ${userId}`);
  
  try {
    const floorPlansJson = localStorage.getItem('floorPlans');
    if (!floorPlansJson) {
      console.log(`❌ getFloorPlanById: No floorPlans found in localStorage`);
      return null;
    }
    
    const floorPlans = JSON.parse(floorPlansJson);
    const floorPlan = floorPlans[drawingId];
    
    console.log(`🔍 getFloorPlanById: Floor plan data for ${drawingId}:`, {
      exists: !!floorPlan,
      userId: floorPlan?.userId,
      currentUserId: userId,
      hasData: !!floorPlan?.data,
      dataLength: floorPlan?.data?.length || 0
    });
    
    // Return if it belongs to the current user (including anonymous)
    if (floorPlan && floorPlan.userId === userId) {
      console.log(`✅ getFloorPlanById: Found floor plan for ${drawingId} with user ${userId}`);
      return floorPlan;
    }
    
    console.log(`❌ getFloorPlanById: No matching floor plan found for ${drawingId} with user ${userId}`);
    return null;
  } catch (error) {
    console.error('Error retrieving floor plan:', error);
    return null;
  }
}

/**
 * Delete a floor plan by drawing ID
 */
export function deleteFloorPlan(drawingId: string): boolean {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    toast.error('Please log in to manage floor plans');
    return false;
  }
  
  try {
    const floorPlansJson = localStorage.getItem('floorPlans');
    if (!floorPlansJson) return false;
    
    const floorPlans = JSON.parse(floorPlansJson);
    
    // Check if the floor plan exists and belongs to the current user
    if (floorPlans[drawingId] && floorPlans[drawingId].userId === currentUser.id) {
      delete floorPlans[drawingId];
      localStorage.setItem('floorPlans', JSON.stringify(floorPlans));
      
      // Dispatch event to trigger UI updates
      window.dispatchEvent(new CustomEvent('floorPlanUpdated', {
        detail: { drawingId, deleted: true, userId: currentUser.id }
      }));
      
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error deleting floor plan:', error);
    return false;
  }
}

/**
 * Get all floor plans for the current user
 */
export function getUserFloorPlans(): Record<string, FloorPlan> {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    return {};
  }
  
  try {
    const floorPlansJson = localStorage.getItem('floorPlans');
    if (!floorPlansJson) return {};
    
    const allFloorPlans = JSON.parse(floorPlansJson);
    const userFloorPlans: Record<string, FloorPlan> = {};
    
    // Filter to only include this user's floor plans
    Object.entries(allFloorPlans).forEach(([id, plan]) => {
      if ((plan as FloorPlan).userId === currentUser.id) {
        userFloorPlans[id] = plan as FloorPlan;
      }
    });
    
    return userFloorPlans;
  } catch (error) {
    console.error('Error getting user floor plans:', error);
    return {};
  }
}

/**
 * Clear all floor plans for the current user
 */
export function clearUserFloorPlans(): boolean {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    return false;
  }
  
  try {
    const floorPlansJson = localStorage.getItem('floorPlans');
    if (!floorPlansJson) return true;
    
    const allFloorPlans = JSON.parse(floorPlansJson);
    const nonUserPlans: Record<string, FloorPlan> = {};
    
    // Keep only non-user floor plans
    Object.entries(allFloorPlans).forEach(([id, plan]) => {
      if ((plan as FloorPlan).userId !== currentUser.id) {
        nonUserPlans[id] = plan as FloorPlan;
      }
    });
    
    localStorage.setItem('floorPlans', JSON.stringify(nonUserPlans));
    return true;
  } catch (error) {
    console.error('Error clearing user floor plans:', error);
    return false;
  }
}

/**
 * Check if a drawing has a floor plan
 */
export async function hasFloorPlan(drawingId: string): Promise<boolean> {
  const currentUser = getCurrentUser();
  if (!currentUser) return false;
  
  try {
    const floorPlan = await getFloorPlanById(drawingId);
    return !!floorPlan;
  } catch (error) {
    console.error('Error checking floor plan status:', error);
    return false;
  }
}

/**
 * Get all drawing IDs that have floor plans for the current user
 */
export async function getDrawingIdsWithFloorPlans(): Promise<string[]> {
  const currentUser = getCurrentUser();
  if (!currentUser) return [];
  
  try {
    const userFloorPlans = getUserFloorPlans();
    return Object.keys(userFloorPlans);
  } catch (error) {
    console.error('Error getting drawing IDs with floor plans:', error);
    return [];
  }
}
