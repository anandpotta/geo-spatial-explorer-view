
/**
 * Gets the URL for a floor plan image associated with a drawing ID
 */
export const getFloorPlanImageUrl = (drawingId: string): string | null => {
  try {
    // Check local storage for the floor plan data
    const floorPlans = JSON.parse(localStorage.getItem('floorPlans') || '{}');
    
    if (floorPlans[drawingId]) {
      return floorPlans[drawingId];
    }
    
    return null;
  } catch (err) {
    console.error('Error getting floor plan URL:', err);
    return null;
  }
};

/**
 * Saves a floor plan image URL for a drawing ID
 */
export const saveFloorPlanImageUrl = (drawingId: string, imageUrl: string): void => {
  try {
    // Get existing floor plans
    const floorPlans = JSON.parse(localStorage.getItem('floorPlans') || '{}');
    
    // Add or update the floor plan for this drawing
    floorPlans[drawingId] = imageUrl;
    
    // Save back to localStorage
    localStorage.setItem('floorPlans', JSON.stringify(floorPlans));
  } catch (err) {
    console.error('Error saving floor plan URL:', err);
  }
};

/**
 * Removes a floor plan image URL for a drawing ID
 */
export const removeFloorPlanImageUrl = (drawingId: string): void => {
  try {
    // Get existing floor plans
    const floorPlans = JSON.parse(localStorage.getItem('floorPlans') || '{}');
    
    // Remove the floor plan for this drawing if it exists
    if (floorPlans[drawingId]) {
      delete floorPlans[drawingId];
      
      // Save back to localStorage
      localStorage.setItem('floorPlans', JSON.stringify(floorPlans));
    }
  } catch (err) {
    console.error('Error removing floor plan URL:', err);
  }
};
