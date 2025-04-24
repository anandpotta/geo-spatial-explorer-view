
import { useState, useEffect, useRef } from 'react';
import { DrawingData, getSavedDrawings, clearAllDrawings } from '@/utils/drawing-utils';

export function useDrawings() {
  const [savedDrawings, setSavedDrawings] = useState<DrawingData[]>([]);
  const initialLoadDone = useRef(false);
  const clearStateRef = useRef(false);
  
  // Load drawings initially and whenever storage changes
  useEffect(() => {
    const loadDrawings = () => {
      console.log('Loading drawings in useDrawings hook');
      // Only load drawings if we haven't explicitly cleared them
      if (!clearStateRef.current) {
        const drawings = getSavedDrawings();
        setSavedDrawings(drawings);
      }
      initialLoadDone.current = true;
    };
    
    // Initial load
    loadDrawings();
    
    // Subscribe to storage events
    const handleStorageChange = (e: StorageEvent) => {
      console.log('Storage changed, reloading drawings');
      // Check if this was a clear operation
      if (e.key === 'savedDrawings' && e.newValue === '[]') {
        console.log('Drawings were cleared in storage');
        setSavedDrawings([]);
      } else {
        loadDrawings();
      }
    };
    
    const handleClearAllEvent = () => {
      console.log('Clear all event detected in useDrawings, resetting drawings state');
      setSavedDrawings([]);
      clearStateRef.current = true;
      
      // Reset clear state after a delay to allow future drawings
      setTimeout(() => {
        clearStateRef.current = false;
      }, 500);
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('clearAllDrawings', handleClearAllEvent);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('clearAllDrawings', handleClearAllEvent);
    };
  }, []);

  // For debugging
  useEffect(() => {
    if (initialLoadDone.current) {
      console.log('Drawing state updated, drawings count:', savedDrawings.length);
    }
  }, [savedDrawings]);

  return {
    savedDrawings
  };
}

export default useDrawings;
