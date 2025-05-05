
export interface FloorPlanData {
  id: string;
  data: string;
  isPdf: boolean;
  fileName: string;
  clipImage?: string;  // Added for image clipping
  updatedAt: number;
}

export const saveFloorPlan = (
  drawingId: string, 
  data: string, 
  isPdf: boolean = false, 
  fileName: string = '', 
  clipImage?: string
): void => {
  try {
    const savedFloorPlans = getSavedFloorPlans();
    
    // Check if floor plan with same ID exists
    const existingIndex = savedFloorPlans.findIndex(fp => fp.id === drawingId);
    
    const floorPlanData: FloorPlanData = {
      id: drawingId,
      data,
      isPdf,
      fileName,
      updatedAt: Date.now(),
      clipImage  // Add clip image if available
    };
    
    if (existingIndex >= 0) {
      // Update existing floor plan
      savedFloorPlans[existingIndex] = floorPlanData;
    } else {
      // Add new floor plan
      savedFloorPlans.push(floorPlanData);
    }
    
    localStorage.setItem('savedFloorPlans', JSON.stringify(savedFloorPlans));
    
    // Dispatch an event to notify other components
    window.dispatchEvent(new Event('floorPlanUpdated'));
  } catch (error) {
    console.error('Error saving floor plan:', error);
  }
};

export const getFloorPlanById = (drawingId: string): FloorPlanData | null => {
  try {
    const savedFloorPlans = getSavedFloorPlans();
    return savedFloorPlans.find(fp => fp.id === drawingId) || null;
  } catch (error) {
    console.error('Error getting floor plan:', error);
    return null;
  }
};

export const getSavedFloorPlans = (): FloorPlanData[] => {
  try {
    const floorPlansJson = localStorage.getItem('savedFloorPlans');
    
    if (!floorPlansJson) {
      return [];
    }
    
    return JSON.parse(floorPlansJson);
  } catch (error) {
    console.error('Error getting saved floor plans:', error);
    return [];
  }
};

export const deleteFloorPlan = (drawingId: string): void => {
  try {
    const savedFloorPlans = getSavedFloorPlans();
    const filteredFloorPlans = savedFloorPlans.filter(fp => fp.id !== drawingId);
    
    localStorage.setItem('savedFloorPlans', JSON.stringify(filteredFloorPlans));
    
    // Dispatch an event to notify other components
    window.dispatchEvent(new Event('floorPlanUpdated'));
  } catch (error) {
    console.error('Error deleting floor plan:', error);
  }
};

export const getDrawingIdsWithFloorPlans = (): string[] => {
  try {
    const savedFloorPlans = getSavedFloorPlans();
    return savedFloorPlans.map(fp => fp.id);
  } catch (error) {
    console.error('Error getting drawing IDs with floor plans:', error);
    return [];
  }
};
