
import { getCurrentUser } from '@/services/auth-service';

export interface FloorPlanData {
  data: string;
  name: string;
  type: string;
  uploaded: string;
  userId: string; // Add userId to associate floor plans with specific users
}

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
 * Saves floor plan data for a specific drawing
 */
export function saveFloorPlan(drawingId: string, floorPlanData: Omit<FloorPlanData, 'userId'>): void {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    console.error('Cannot save floor plan: No user is logged in');
    return;
  }
  
  try {
    const floorPlansJson = localStorage.getItem('floorPlans');
    const floorPlans = floorPlansJson ? JSON.parse(floorPlansJson) : {};
    
    // Add the user ID to the floor plan data
    floorPlans[drawingId] = {
      ...floorPlanData,
      userId: currentUser.id
    };
    
    localStorage.setItem('floorPlans', JSON.stringify(floorPlans));
    
    // Notify components about the floor plan update
    window.dispatchEvent(new CustomEvent('floorPlanUpdated', { 
      detail: { drawingId, userId: currentUser.id } 
    }));
  } catch (e) {
    console.error('Error saving floor plan:', e);
  }
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
    } else {
      console.warn('Cannot delete floor plan: Floor plan belongs to another user');
    }
  } catch (e) {
    console.error('Error deleting floor plan:', e);
  }
}
