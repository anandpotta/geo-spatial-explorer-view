
// A simple utility for managing floor plans

interface FloorPlan {
  data: string;  // Base64 data
  fileName: string;
  isPdf: boolean;
  pathData?: string; // SVG path data for clipping
}

interface FloorPlanStorage {
  [drawingId: string]: FloorPlan;
}

/**
 * Save a floor plan for a specific drawing
 */
export function saveFloorPlan(
  drawingId: string, 
  data: string, 
  isPdf: boolean, 
  fileName: string,
  pathData?: string
): void {
  try {
    const floorPlans: FloorPlanStorage = JSON.parse(localStorage.getItem('floorPlans') || '{}');
    floorPlans[drawingId] = {
      data,
      fileName,
      isPdf,
      pathData
    };
    localStorage.setItem('floorPlans', JSON.stringify(floorPlans));
  } catch (error) {
    console.error('Error saving floor plan:', error);
  }
}

/**
 * Get a floor plan for a specific drawing
 */
export function getFloorPlanById(drawingId: string): FloorPlan | null {
  try {
    const floorPlans: FloorPlanStorage = JSON.parse(localStorage.getItem('floorPlans') || '{}');
    return floorPlans[drawingId] || null;
  } catch (error) {
    console.error('Error getting floor plan:', error);
    return null;
  }
}

/**
 * Delete a floor plan for a specific drawing
 */
export function deleteFloorPlan(drawingId: string): void {
  try {
    const floorPlans: FloorPlanStorage = JSON.parse(localStorage.getItem('floorPlans') || '{}');
    if (floorPlans[drawingId]) {
      delete floorPlans[drawingId];
      localStorage.setItem('floorPlans', JSON.stringify(floorPlans));
    }
  } catch (error) {
    console.error('Error deleting floor plan:', error);
  }
}

/**
 * Get all drawing IDs that have floor plans
 */
export function getDrawingIdsWithFloorPlans(): string[] {
  try {
    const floorPlans: FloorPlanStorage = JSON.parse(localStorage.getItem('floorPlans') || '{}');
    return Object.keys(floorPlans);
  } catch (error) {
    console.error('Error getting drawing IDs with floor plans:', error);
    return [];
  }
}
