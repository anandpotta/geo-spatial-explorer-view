
import { useState, useEffect } from 'react';
import { DrawingData, getSavedDrawings, deleteDrawing } from '@/utils/drawing-utils';
import { toast } from 'sonner';

export function useDrawings() {
  const [savedDrawings, setSavedDrawings] = useState<DrawingData[]>([]);
  
  const loadDrawings = () => {
    const drawings = getSavedDrawings();
    setSavedDrawings(drawings);
    console.log(`Loaded ${drawings.length} drawings`);
  };
  
  useEffect(() => {
    // Initial load
    loadDrawings();
    
    // Set up listeners for drawing updates
    const handleStorage = () => {
      loadDrawings();
    };
    
    const handleDrawingsUpdated = () => {
      loadDrawings();
    };
    
    window.addEventListener('storage', handleStorage);
    window.addEventListener('drawingsUpdated', handleDrawingsUpdated);
    window.addEventListener('floorPlanUpdated', handleDrawingsUpdated);
    
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('drawingsUpdated', handleDrawingsUpdated);
      window.removeEventListener('floorPlanUpdated', handleDrawingsUpdated);
    };
  }, []);
  
  const handleDeleteDrawing = (id: string) => {
    deleteDrawing(id);
    loadDrawings(); // Reload immediately
    toast.success('Drawing deleted');
  };
  
  return { 
    savedDrawings, 
    setSavedDrawings, 
    deleteDrawing: handleDeleteDrawing 
  };
}
