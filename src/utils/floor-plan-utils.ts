
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
  
  // Dispatch an image-uploaded event to trigger layer updates
  window.dispatchEvent(new CustomEvent('image-uploaded', {
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
 * Delete a floor plan from local storage
 */
export function deleteFloorPlan(drawingId: string): void {
  if (!drawingId) return;
  
  const savedFloorPlans = getSavedFloorPlans();
  if (savedFloorPlans[drawingId]) {
    delete savedFloorPlans[drawingId];
    localStorage.setItem('floorPlans', JSON.stringify(savedFloorPlans));
    
    // Dispatch events to notify components about the floor plan update
    window.dispatchEvent(new CustomEvent('floorPlanUpdated', {
      detail: { drawingId }
    }));
    
    window.dispatchEvent(new CustomEvent('image-uploaded', {
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

/**
 * Check if a drawing has a floor plan
 */
export function hasFloorPlan(drawingId: string): boolean {
  return getFloorPlanById(drawingId) !== null;
}

/**
 * Create SVG clip path for a floor plan
 */
export function createClipPathForDrawing(pathData: string, drawingId: string): string {
  return `
    <clipPath id="clip-path-${drawingId}">
      <path d="${pathData}" />
    </clipPath>
  `;
}
