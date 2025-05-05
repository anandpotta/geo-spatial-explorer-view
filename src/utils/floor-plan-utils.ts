
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

// IndexedDB configuration
const DB_NAME = 'floorPlansDB';
const DB_VERSION = 1;
const STORE_NAME = 'floorPlans';

// Get IndexedDB instance with fallback for older browsers
const indexedDB = window.indexedDB || (window as any).mozIndexedDB || 
                 (window as any).webkitIndexedDB || (window as any).msIndexedDB;

// Helper to resize image data to fit within storage limits
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
      // Start with 0.5 scale (more aggressive than before)
      let scale = 0.5;
      
      // Adjust scale if image is very large
      if (width > 1500 || height > 1500) {
        scale = 0.3;
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
      const resizedData = canvas.toDataURL('image/jpeg', 0.6);
      
      // If still too large, reduce quality further
      if (resizedData.length > maxSizeKB * 1024) {
        resolve(canvas.toDataURL('image/jpeg', 0.4));
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

// Initialize IndexedDB
const initIndexedDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (!indexedDB) {
      reject(new Error('IndexedDB is not supported in this browser'));
      return;
    }
    
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = (event) => {
      console.error('Error opening IndexedDB:', event);
      reject(new Error('Error opening IndexedDB'));
    };
    
    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      resolve(db);
    };
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'key' });
      }
    };
  });
};

// Save floor plan to IndexedDB
const saveToIndexedDB = async (key: string, floorPlanData: FloorPlanData): Promise<boolean> => {
  try {
    const db = await initIndexedDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      const request = store.put({ key, data: floorPlanData });
      
      request.onsuccess = () => {
        resolve(true);
      };
      
      request.onerror = (event) => {
        console.error('Error saving to IndexedDB:', event);
        reject(new Error('Error saving to IndexedDB'));
      };
    });
  } catch (err) {
    console.error('IndexedDB save error:', err);
    return false;
  }
};

// Get floor plan from IndexedDB
const getFromIndexedDB = async (key: string): Promise<FloorPlanData | null> => {
  try {
    const db = await initIndexedDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      
      const request = store.get(key);
      
      request.onsuccess = (event) => {
        const result = (event.target as IDBRequest).result;
        if (result) {
          resolve(result.data);
        } else {
          resolve(null);
        }
      };
      
      request.onerror = (event) => {
        console.error('Error reading from IndexedDB:', event);
        reject(new Error('Error reading from IndexedDB'));
      };
    });
  } catch (err) {
    console.error('IndexedDB get error:', err);
    return null;
  }
};

// Delete floor plan from IndexedDB
const deleteFromIndexedDB = async (key: string): Promise<boolean> => {
  try {
    const db = await initIndexedDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      const request = store.delete(key);
      
      request.onsuccess = () => {
        resolve(true);
      };
      
      request.onerror = (event) => {
        console.error('Error deleting from IndexedDB:', event);
        reject(new Error('Error deleting from IndexedDB'));
      };
    });
  } catch (err) {
    console.error('IndexedDB delete error:', err);
    return false;
  }
};

// Store a floor plan image for a drawing
export async function saveFloorPlan(drawingId: string, imageData: string, isPdf: boolean = false, fileName: string = ''): Promise<boolean> {
  try {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      console.error('Cannot store floor plan: No user is logged in');
      return false;
    }
    
    // User-specific key for drawing
    const userDrawingKey = `${currentUser.id}-${drawingId}`;
    
    // Resize image data to prevent storage quota issues
    const resizedImageData = !isPdf ? await resizeImageData(imageData, 150) : imageData;
    
    // Create the floor plan data object
    const floorPlanData: FloorPlanData = {
      imageData: resizedImageData,
      drawingId,
      userId: currentUser.id,
      isPdf,
      fileName,
      timestamp: Date.now()
    };
    
    try {
      // First try to get existing floor plans from localStorage
      const floorPlansJson = localStorage.getItem(FLOOR_PLAN_STORAGE_KEY);
      let floorPlans = floorPlansJson ? JSON.parse(floorPlansJson) : {};
      
      // Add or update the floor plan for this drawing
      floorPlans[userDrawingKey] = floorPlanData;
      
      // Try to save to localStorage first
      try {
        localStorage.setItem(FLOOR_PLAN_STORAGE_KEY, JSON.stringify(floorPlans));
        
        // Dispatch an event to notify components that a floor plan has been updated
        window.dispatchEvent(new CustomEvent('floorPlanUpdated', {
          detail: { drawingId }
        }));
        return true;
      } catch (storageError) {
        console.error('Storage quota exceeded, falling back to IndexedDB', storageError);
        
        // If localStorage fails, try with even more aggressive compression before IndexedDB
        if (!isPdf) {
          const highlyCompressedImage = await resizeImageData(imageData, 80);
          floorPlanData.imageData = highlyCompressedImage;
          
          try {
            floorPlans[userDrawingKey] = floorPlanData;
            localStorage.setItem(FLOOR_PLAN_STORAGE_KEY, JSON.stringify(floorPlans));
            window.dispatchEvent(new CustomEvent('floorPlanUpdated', {
              detail: { drawingId }
            }));
            toast.success('Floor plan saved with reduced quality due to size constraints');
            return true;
          } catch (e) {
            // If localStorage still fails, use IndexedDB as fallback
            console.log('Still exceeded localStorage quota, using IndexedDB fallback');
          }
        }
        
        // Save to IndexedDB as a fallback
        const savedToIndexedDB = await saveToIndexedDB(userDrawingKey, floorPlanData);
        if (savedToIndexedDB) {
          // Save a reference to this drawing ID in localStorage to know it exists in IndexedDB
          try {
            let indexedDBRefs = JSON.parse(localStorage.getItem('floorPlansInIndexedDB') || '[]');
            if (!indexedDBRefs.includes(userDrawingKey)) {
              indexedDBRefs.push(userDrawingKey);
              localStorage.setItem('floorPlansInIndexedDB', JSON.stringify(indexedDBRefs));
            }
          } catch (e) {
            // If even this small data can't be saved, we have serious storage issues
            console.error('Could not save IndexedDB reference');
          }
          
          window.dispatchEvent(new CustomEvent('floorPlanUpdated', {
            detail: { drawingId }
          }));
          
          toast.success('Floor plan saved successfully');
          return true;
        } else {
          toast.error('Failed to save floor plan - storage limit reached');
          return false;
        }
      }
    } catch (err) {
      console.error('Error saving floor plan:', err);
      return false;
    }
  } catch (err) {
    console.error('Error in saveFloorPlan:', err);
    return false;
  }
}

// Get a floor plan image for a drawing
export async function getFloorPlanById(drawingId: string): Promise<{ data: string; isPdf: boolean; fileName: string } | null> {
  try {
    const currentUser = getCurrentUser();
    if (!currentUser) return null;
    
    // Use the user-specific key
    const userDrawingKey = `${currentUser.id}-${drawingId}`;
    
    // First check localStorage
    const floorPlansJson = localStorage.getItem(FLOOR_PLAN_STORAGE_KEY);
    if (floorPlansJson) {
      const floorPlans = JSON.parse(floorPlansJson);
      const floorPlan = floorPlans[userDrawingKey];
      
      if (floorPlan) {
        return {
          data: floorPlan.imageData,
          isPdf: floorPlan.isPdf || false,
          fileName: floorPlan.fileName || ''
        };
      }
    }
    
    // If not in localStorage, check if we have a reference to it in IndexedDB
    const indexedDBRefs = JSON.parse(localStorage.getItem('floorPlansInIndexedDB') || '[]');
    if (indexedDBRefs.includes(userDrawingKey)) {
      // Try to get from IndexedDB
      const floorPlanFromDB = await getFromIndexedDB(userDrawingKey);
      if (floorPlanFromDB) {
        return {
          data: floorPlanFromDB.imageData,
          isPdf: floorPlanFromDB.isPdf || false,
          fileName: floorPlanFromDB.fileName || ''
        };
      }
    }
    
    return null;
  } catch (err) {
    console.error('Error getting floor plan:', err);
    return null;
  }
}

// Delete a floor plan for a drawing
export async function deleteFloorPlan(drawingId: string): Promise<void> {
  try {
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    
    // Use the user-specific key
    const userDrawingKey = `${currentUser.id}-${drawingId}`;
    
    // Check localStorage first
    const floorPlansJson = localStorage.getItem(FLOOR_PLAN_STORAGE_KEY);
    if (floorPlansJson) {
      const floorPlans = JSON.parse(floorPlansJson);
      
      // Remove this floor plan if it exists
      if (floorPlans[userDrawingKey]) {
        delete floorPlans[userDrawingKey];
        localStorage.setItem(FLOOR_PLAN_STORAGE_KEY, JSON.stringify(floorPlans));
      }
    }
    
    // Also check IndexedDB
    try {
      await deleteFromIndexedDB(userDrawingKey);
      
      // Remove from the reference list
      const indexedDBRefs = JSON.parse(localStorage.getItem('floorPlansInIndexedDB') || '[]');
      const updatedRefs = indexedDBRefs.filter((key: string) => key !== userDrawingKey);
      localStorage.setItem('floorPlansInIndexedDB', JSON.stringify(updatedRefs));
    } catch (err) {
      console.error('Error deleting from IndexedDB:', err);
    }
    
    // Dispatch an event to notify components
    window.dispatchEvent(new CustomEvent('floorPlanUpdated'));
  } catch (err) {
    console.error('Error deleting floor plan:', err);
  }
}

// Check if a floor plan exists for a drawing
export async function hasFloorPlan(drawingId: string): Promise<boolean> {
  return (await getFloorPlanById(drawingId)) !== null;
}

// Get all drawing IDs that have floor plans
export async function getDrawingIdsWithFloorPlans(): Promise<string[]> {
  try {
    const currentUser = getCurrentUser();
    if (!currentUser) return [];
    
    const drawingIds: string[] = [];
    
    // Check localStorage
    const floorPlansJson = localStorage.getItem(FLOOR_PLAN_STORAGE_KEY);
    if (floorPlansJson) {
      const floorPlans = JSON.parse(floorPlansJson);
      
      // Filter keys to get only those for the current user and extract the drawing ID
      Object.keys(floorPlans)
        .filter(key => key.startsWith(`${currentUser.id}-`))
        .forEach(key => {
          const drawingId = key.split('-')[1];
          if (drawingId && !drawingIds.includes(drawingId)) {
            drawingIds.push(drawingId);
          }
        });
    }
    
    // Check IndexedDB references
    const indexedDBRefs = JSON.parse(localStorage.getItem('floorPlansInIndexedDB') || '[]');
    indexedDBRefs
      .filter((key: string) => key.startsWith(`${currentUser.id}-`))
      .forEach((key: string) => {
        const drawingId = key.split('-')[1];
        if (drawingId && !drawingIds.includes(drawingId)) {
          drawingIds.push(drawingId);
        }
      });
    
    return drawingIds;
  } catch (err) {
    console.error('Error getting drawing IDs with floor plans:', err);
    return [];
  }
}

// For backward compatibility
export { saveFloorPlan as storeFloorPlan };
