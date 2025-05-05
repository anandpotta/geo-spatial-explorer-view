
import { getCurrentUser } from '@/services/auth-service';
import { toast } from 'sonner';

// Define the FloorPlanData interface
export interface FloorPlanData {
  imageData: string;
  drawingId: string;
  userId: string;
  isPdf: boolean;
  fileName: string;
  timestamp: number;
}

// Key for storing floor plans in localStorage
const FLOOR_PLAN_STORAGE_KEY = 'floorPlans';

// Helper to resize image data to fit within localStorage limits
const resizeImageData = async (imageData: string, maxSizeKB: number = 200): Promise<string> => {
  // If it's a PDF or already small enough, return as is
  if (imageData.startsWith('data:application/pdf') || imageData.length < maxSizeKB * 1024) {
    return imageData;
  }
  
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      // Create a canvas to resize the image
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      
      // Calculate scaling factor to reduce size
      // Start with 0.7 scale and reduce further if needed
      let scale = 0.7;
      
      // Adjust scale if image is very large
      if (width > 1500 || height > 1500) {
        scale = 0.5;
      }
      
      canvas.width = width * scale;
      canvas.height = height * scale;
      
      // Draw the resized image
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      // Convert to lower quality JPEG for better compression
      const resizedData = canvas.toDataURL('image/jpeg', 0.7);
      
      // If still too large, reduce quality further
      if (resizedData.length > maxSizeKB * 1024) {
        resolve(canvas.toDataURL('image/jpeg', 0.5));
      } else {
        resolve(resizedData);
      }
    };
    
    img.onerror = () => {
      // If resize fails, return original but log warning
      console.warn('Failed to resize image, using original size');
      reject(new Error('Failed to resize image'));
    };
    
    img.src = imageData;
  });
};

// Store a floor plan image for a drawing
export async function saveFloorPlan(drawingId: string, imageData: string, isPdf: boolean = false, fileName: string = ''): Promise<boolean> {
  try {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      console.error('Cannot store floor plan: No user is logged in');
      return false;
    }
    
    // Get existing floor plans or initialize empty object
    const floorPlansJson = localStorage.getItem(FLOOR_PLAN_STORAGE_KEY);
    const floorPlans = floorPlansJson ? JSON.parse(floorPlansJson) : {};

    // User-specific key for drawing
    const userDrawingKey = `${currentUser.id}-${drawingId}`;
    
    // Resize image data to prevent localStorage quota issues
    const resizedImageData = !isPdf ? await resizeImageData(imageData) : imageData;
    
    // Add or update the floor plan for this drawing
    floorPlans[userDrawingKey] = {
      imageData: resizedImageData,
      drawingId,
      userId: currentUser.id,
      isPdf,
      fileName,
      timestamp: Date.now()
    };

    try {
      // Save back to localStorage
      localStorage.setItem(FLOOR_PLAN_STORAGE_KEY, JSON.stringify(floorPlans));
      
      // Dispatch an event to notify components that a floor plan has been updated
      window.dispatchEvent(new CustomEvent('floorPlanUpdated'));
      return true;
    } catch (storageError) {
      console.error('Storage quota exceeded, trying with more aggressive compression', storageError);
      
      // If we hit quota limit, try with more aggressive compression
      if (!isPdf) {
        const highlyCompressedImage = await resizeImageData(imageData, 100);
        floorPlans[userDrawingKey].imageData = highlyCompressedImage;
        
        try {
          localStorage.setItem(FLOOR_PLAN_STORAGE_KEY, JSON.stringify(floorPlans));
          window.dispatchEvent(new CustomEvent('floorPlanUpdated'));
          toast.success('Floor plan saved with reduced quality due to size constraints');
          return true;
        } catch (e) {
          toast.error('Image too large to store locally');
          console.error('Failed to save even with high compression', e);
          return false;
        }
      } else {
        toast.error('PDF too large to store locally');
        return false;
      }
    }
  } catch (err) {
    console.error('Error saving floor plan:', err);
    return false;
  }
}

// Get a floor plan image for a drawing
export function getFloorPlanById(drawingId: string): { data: string; isPdf: boolean; fileName: string } | null {
  const currentUser = getCurrentUser();
  if (!currentUser) return null;
  
  const floorPlansJson = localStorage.getItem(FLOOR_PLAN_STORAGE_KEY);
  if (!floorPlansJson) return null;
  
  const floorPlans = JSON.parse(floorPlansJson);
  
  // Use the user-specific key
  const userDrawingKey = `${currentUser.id}-${drawingId}`;
  const floorPlan = floorPlans[userDrawingKey];
  
  if (!floorPlan) return null;
  
  return {
    data: floorPlan.imageData,
    isPdf: floorPlan.isPdf || false,
    fileName: floorPlan.fileName || ''
  };
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
  return getFloorPlanById(drawingId) !== null;
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

// For backward compatibility
export { saveFloorPlan as storeFloorPlan };

