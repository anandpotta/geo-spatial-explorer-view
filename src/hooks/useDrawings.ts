
import { useState, useEffect, useRef } from 'react';
import { DrawingData, getSavedDrawings } from '@/utils/drawing-utils';

export function useDrawings() {
  const [savedDrawings, setSavedDrawings] = useState<DrawingData[]>([]);
  const initialLoadDone = useRef(false);
  
  // Load drawings initially and whenever storage changes
  useEffect(() => {
    const loadDrawings = () => {
      console.log('Loading drawings in useDrawings hook');
      const drawings = getSavedDrawings();
      setSavedDrawings(drawings);
      initialLoadDone.current = true;
    };
    
    // Initial load
    loadDrawings();
    
    // Subscribe to storage events
    const handleStorageChange = () => {
      console.log('Storage changed, reloading drawings');
      loadDrawings();
    };
    
    const handleClearAllEvent = () => {
      console.log('Clear all event detected in useDrawings, resetting drawings state');
      setSavedDrawings([]);
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
