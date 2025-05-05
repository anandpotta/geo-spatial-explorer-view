
/**
 * Utilities for managing floor plans
 */

export interface FloorPlanData {
  data: string;
  isPdf: boolean;
  fileName: string;
  uploadDate: number;
}

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

/**
 * Saves a complete floor plan data object
 */
export const saveFloorPlan = (
  drawingId: string, 
  dataUrl: string, 
  isPdf: boolean = false,
  fileName: string = ''
): void => {
  try {
    // Get existing floor plans (as objects with metadata)
    const floorPlansStorage = localStorage.getItem('floorPlansData');
    const floorPlans = floorPlansStorage ? JSON.parse(floorPlansStorage) : {};
    
    // Add or update the floor plan data
    floorPlans[drawingId] = {
      data: dataUrl,
      isPdf,
      fileName,
      uploadDate: Date.now()
    };
    
    // Also update the simple URL storage for backward compatibility
    saveFloorPlanImageUrl(drawingId, dataUrl);
    
    // Save back to localStorage
    localStorage.setItem('floorPlansData', JSON.stringify(floorPlans));
  } catch (err) {
    console.error('Error saving floor plan data:', err);
  }
};

/**
 * Gets floor plan data for a drawing ID
 */
export const getFloorPlanById = (drawingId: string): FloorPlanData | null => {
  try {
    // First check the newer format
    const floorPlansStorage = localStorage.getItem('floorPlansData');
    if (floorPlansStorage) {
      const floorPlans = JSON.parse(floorPlansStorage);
      if (floorPlans[drawingId]) {
        return floorPlans[drawingId];
      }
    }
    
    // Fall back to the older format if needed
    const imageUrl = getFloorPlanImageUrl(drawingId);
    if (imageUrl) {
      // Fix: Check that imageUrl is a string before using includes
      const isPdf = typeof imageUrl === 'string' && imageUrl.includes('application/pdf');
      return {
        data: imageUrl,
        isPdf: isPdf,
        fileName: '',
        uploadDate: 0
      };
    }
    
    return null;
  } catch (err) {
    console.error('Error getting floor plan by ID:', err);
    return null;
  }
};

/**
 * Gets all saved floor plans
 */
export const getSavedFloorPlans = (): Record<string, FloorPlanData> => {
  try {
    // First try the newer format
    const floorPlansStorage = localStorage.getItem('floorPlansData');
    if (floorPlansStorage) {
      return JSON.parse(floorPlansStorage);
    }
    
    // Fall back to the older format if needed
    const oldFormatStorage = localStorage.getItem('floorPlans');
    if (oldFormatStorage) {
      const oldFloorPlans = JSON.parse(oldFormatStorage);
      const converted: Record<string, FloorPlanData> = {};
      
      // Convert old format to new format
      Object.entries(oldFloorPlans).forEach(([id, url]) => {
        // Fix: Check that url is a string before using includes
        const isPdf = typeof url === 'string' && url.includes('application/pdf');
        converted[id] = {
          data: url as string,
          isPdf: isPdf,
          fileName: '',
          uploadDate: 0
        };
      });
      
      return converted;
    }
    
    return {};
  } catch (err) {
    console.error('Error getting saved floor plans:', err);
    return {};
  }
};

/**
 * Gets IDs of drawings that have associated floor plans
 */
export const getDrawingIdsWithFloorPlans = (): string[] => {
  try {
    // First check newer format
    const floorPlansStorage = localStorage.getItem('floorPlansData');
    if (floorPlansStorage) {
      return Object.keys(JSON.parse(floorPlansStorage));
    }
    
    // Fall back to older format
    const oldFormatStorage = localStorage.getItem('floorPlans');
    if (oldFormatStorage) {
      return Object.keys(JSON.parse(oldFormatStorage));
    }
    
    return [];
  } catch (err) {
    console.error('Error getting drawing IDs with floor plans:', err);
    return [];
  }
};
