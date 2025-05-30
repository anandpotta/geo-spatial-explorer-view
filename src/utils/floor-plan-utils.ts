import { toast } from 'sonner';
import { getCurrentUser } from '@/services/auth-service';

// Define the FloorPlan interface as a type that can be exported
export interface FloorPlan {
  data: string;
  isPdf: boolean;
  fileName: string;
  userId?: string;
  timestamp?: string;
  zoom?: number;
  rotation?: number;
}

// Export the type as FloorPlanData for backward compatibility
export type FloorPlanData = FloorPlan;

/**
 * Save a floor plan for a specific drawing
 */
export function saveFloorPlan(
  drawingId: string, 
  floorPlan: FloorPlan
): boolean {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    toast.error('Please log in to save floor plans');
    return false;
  }
  
  try {
    // Add user ID and timestamp to the floor plan data
    const floorPlanWithUser = {
      ...floorPlan,
      userId: currentUser.id,
      timestamp: new Date().toISOString()
    };
    
    // Get existing floor plans
    const floorPlansJson = localStorage.getItem('floorPlans');
    const floorPlans = floorPlansJson ? JSON.parse(floorPlansJson) : {};
    
    // Add or update this floor plan
    floorPlans[drawingId] = floorPlanWithUser;
    
    // Save back to localStorage
    localStorage.setItem('floorPlans', JSON.stringify(floorPlans));
    
    // Show success message if this is a new upload
    if (!floorPlansJson || !JSON.parse(floorPlansJson)[drawingId]) {
      toast.success('Floor plan saved successfully');
    }
    
    // Dispatch event to trigger UI updates
    window.dispatchEvent(new CustomEvent('floorPlanUpdated', {
      detail: { drawingId, userId: currentUser.id }
    }));
    
    return true;
  } catch (error) {
    console.error('Error saving floor plan:', error);
    
    // Check if error is related to storage quota
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      toast.error('Storage limit exceeded. Try uploading a smaller file.');
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
  if (!currentUser) {
    return null;
  }
  
  try {
    const floorPlansJson = localStorage.getItem('floorPlans');
    if (!floorPlansJson) return null;
    
    const floorPlans = JSON.parse(floorPlansJson);
    const floorPlan = floorPlans[drawingId];
    
    // Only return if it belongs to the current user
    if (floorPlan && floorPlan.userId === currentUser.id) {
      return floorPlan;
    }
    
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
