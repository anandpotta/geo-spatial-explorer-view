
/**
 * Floor plan utilities for handling storage and retrieval of floor plans
 */

export interface FloorPlanData {
  data: string;
  isPdf: boolean;
  fileName: string;
  timestamp: string;
}

/**
 * Save a floor plan to local storage
 */
export function saveFloorPlan(drawingId: string, data: string, isPdf: boolean, fileName: string): void {
  if (!drawingId) return;
  
  const savedFloorPlans = getSavedFloorPlans();
  savedFloorPlans[drawingId] = {
    data,
    isPdf,
    fileName,
    timestamp: new Date().toISOString()
  };
  
  localStorage.setItem('floorPlans', JSON.stringify(savedFloorPlans));
  
  // Dispatch an event to notify components about the floor plan update
  window.dispatchEvent(new CustomEvent('floorPlanUpdated', {
    detail: { drawingId }
  }));
}

/**
 * Get all saved floor plans from local storage
 */
export function getSavedFloorPlans(): Record<string, FloorPlanData> {
  try {
    const floorPlansJson = localStorage.getItem('floorPlans');
    return floorPlansJson ? JSON.parse(floorPlansJson) : {};
  } catch (e) {
    console.error('Failed to parse saved floor plans', e);
    return {};
  }
}

/**
 * Get a specific floor plan by drawing ID
 */
export function getFloorPlanById(drawingId: string): FloorPlanData | null {
  if (!drawingId) return null;
  
  const savedFloorPlans = getSavedFloorPlans();
  return savedFloorPlans[drawingId] || null;
}

/**
 * Get the image URL for a floor plan by drawing ID
 */
export function getFloorPlanImageUrl(drawingId: string): string | null {
  const floorPlan = getFloorPlanById(drawingId);
  return floorPlan ? floorPlan.data : null;
}

/**
 * Delete a floor plan from local storage
 */
export function deleteFloorPlan(drawingId: string): void {
  if (!drawingId) return;
  
  const savedFloorPlans = getSavedFloorPlans();
  if (savedFloorPlans[drawingId]) {
    delete savedFloorPlans[drawingId];
    localStorage.setItem('floorPlans', JSON.stringify(savedFloorPlans));
    
    // Dispatch an event to notify components about the floor plan update
    window.dispatchEvent(new CustomEvent('floorPlanUpdated', {
      detail: { drawingId }
    }));
  }
}

/**
 * Get all drawing IDs that have associated floor plans
 */
export function getDrawingIdsWithFloorPlans(): string[] {
  const savedFloorPlans = getSavedFloorPlans();
  return Object.keys(savedFloorPlans);
}
