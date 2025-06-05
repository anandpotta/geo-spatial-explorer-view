
import { useState, useEffect, useCallback, useRef } from 'react';
import { getSavedDrawings } from '@/utils/drawing-utils';

export const useDrawings = () => {
  const [drawings, setDrawings] = useState([]);
  const mountedRef = useRef(true);
  const loadTimeoutRef = useRef<NodeJS.Timeout>();

  // Stable callback that doesn't change on every render
  const loadDrawings = useCallback(() => {
    if (!mountedRef.current) return;
    
    try {
      const savedDrawings = getSavedDrawings();
      setDrawings(savedDrawings);
    } catch (error) {
      console.error('Error loading drawings:', error);
    }
  }, []); // No dependencies - this function is stable

  // Debounced storage handler to prevent excessive calls
  const handleStorage = useCallback(() => {
    if (!mountedRef.current) return;
    
    // Clear existing timeout
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
    }
    
    // Debounce the loading
    loadTimeoutRef.current = setTimeout(() => {
      if (mountedRef.current) {
        loadDrawings();
      }
    }, 100);
  }, [loadDrawings]);

  useEffect(() => {
    mountedRef.current = true;
    
    // Load initial drawings
    loadDrawings();

    // Listen for storage changes with debounced handler
    window.addEventListener('storage', handleStorage);
    window.addEventListener('drawingsUpdated', handleStorage);

    return () => {
      mountedRef.current = false;
      
      // Clear timeout on cleanup
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
      }
      
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('drawingsUpdated', handleStorage);
    };
  }, [loadDrawings, handleStorage]); // Now these are stable

  return {
    drawings,
    loadDrawings
  };
};
