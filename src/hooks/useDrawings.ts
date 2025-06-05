
import { useState, useEffect, useCallback } from 'react';
import { getSavedDrawings } from '@/utils/drawing-utils';

export const useDrawings = () => {
  const [drawings, setDrawings] = useState([]);

  const loadDrawings = useCallback(() => {
    const savedDrawings = getSavedDrawings();
    setDrawings(savedDrawings);
  }, []);

  const handleStorage = useCallback(() => {
    loadDrawings();
  }, [loadDrawings]);

  useEffect(() => {
    // Load initial drawings
    loadDrawings();

    // Listen for storage changes
    window.addEventListener('storage', handleStorage);
    window.addEventListener('drawingsUpdated', handleStorage);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('drawingsUpdated', handleStorage);
    };
  }, [loadDrawings, handleStorage]);

  return {
    drawings,
    loadDrawings
  };
};
