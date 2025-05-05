import { getCurrentUser } from '@/services/auth-service';

// Key for storing floor plans in localStorage
const FLOOR_PLAN_STORAGE_KEY = 'floorPlans';

// Store a floor plan image for a drawing
export function storeFloorPlan(drawingId: string, imageData: string): void {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    console.error('Cannot store floor plan: No user is logged in');
    return;
  }
  
  // Get existing floor plans or initialize empty object
  const floorPlansJson = localStorage.getItem(FLOOR_PLAN_STORAGE_KEY);
  const floorPlans = floorPlansJson ? JSON.parse(floorPlansJson) : {};

  // Store with user ID prefix to keep floor plans separated by user
  const userDrawingKey = `${currentUser.id}-${drawingId}`;
  
  // Add or update the floor plan for this drawing
  floorPlans[userDrawingKey] = {
    imageData,
    drawingId,
    userId: currentUser.id,
    timestamp: Date.now()
  };

  // Save back to localStorage
  localStorage.setItem(FLOOR_PLAN_STORAGE_KEY, JSON.stringify(floorPlans));
  
  // Dispatch an event to notify components that a floor plan has been updated
  window.dispatchEvent(new CustomEvent('floorPlanUpdated'));
}

// Get a floor plan image for a drawing
export function getFloorPlan(drawingId: string): string | null {
  const currentUser = getCurrentUser();
  if (!currentUser) return null;
  
  const floorPlansJson = localStorage.getItem(FLOOR_PLAN_STORAGE_KEY);
  if (!floorPlansJson) return null;
  
  const floorPlans = JSON.parse(floorPlansJson);
  
  // Use the user-specific key
  const userDrawingKey = `${currentUser.id}-${drawingId}`;
  
  return floorPlans[userDrawingKey]?.imageData || null;
}

// Delete a floor plan for a drawing
export function deleteFloorPlan(drawingId: string): void {
  const currentUser = getCurrentUser();
  if (!currentUser) return;
  
  const floorPlansJson = localStorage.getItem(FLOOR_PLAN_STORAGE_KEY);
  if (!floorPlansJson) return;
  
  const floorPlans = JSON.parse(floorPlansJson);
  
  // Use the user-specific key
  const userDrawingKey = `${currentUser.id}-${drawingId}`;
  
  // Remove this floor plan if it exists
  if (floorPlans[userDrawingKey]) {
    delete floorPlans[userDrawingKey];
    localStorage.setItem(FLOOR_PLAN_STORAGE_KEY, JSON.stringify(floorPlans));
    
    // Dispatch an event to notify components
    window.dispatchEvent(new CustomEvent('floorPlanUpdated'));
  }
}

// Check if a floor plan exists for a drawing
export function hasFloorPlan(drawingId: string): boolean {
  return getFloorPlan(drawingId) !== null;
}

// Get all drawing IDs that have floor plans
export function getDrawingIdsWithFloorPlans(): string[] {
  const currentUser = getCurrentUser();
  if (!currentUser) return [];
  
  const floorPlansJson = localStorage.getItem(FLOOR_PLAN_STORAGE_KEY);
  if (!floorPlansJson) return [];
  
  const floorPlans = JSON.parse(floorPlansJson);
  
  // Filter keys to get only those for the current user and extract the drawing ID
  return Object.keys(floorPlans)
    .filter(key => key.startsWith(`${currentUser.id}-`))
    .map(key => key.split('-')[1]);
}
