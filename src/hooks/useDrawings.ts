
import { useState, useEffect } from 'react';
import { DrawingData, getSavedDrawings } from '@/utils/drawing-utils';

export function useDrawings() {
  const [savedDrawings, setSavedDrawings] = useState<DrawingData[]>([]);
  
  useEffect(() => {
    const loadDrawings = () => {
      const drawings = getSavedDrawings();
      setSavedDrawings(drawings);
    };
    
    loadDrawings();
    
    window.addEventListener('storage', loadDrawings);
    return () => window.removeEventListener('storage', loadDrawings);
  }, []);

  return {
    savedDrawings
  };
}
