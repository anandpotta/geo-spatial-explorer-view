
import { useState, useEffect, useRef } from 'react';
import { DrawingData, getSavedDrawings, deleteDrawing } from '@/utils/drawing-utils';
import { toast } from 'sonner';

export function useDrawings() {
  const [savedDrawings, setSavedDrawings] = useState<DrawingData[]>([]);
  const isLoadingRef = useRef(false);
  
  const loadDrawings = () => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;
    
    const drawings = getSavedDrawings();
    setSavedDrawings(drawings);
    console.log(`Loaded ${drawings.length} drawings`);
    
    setTimeout(() => {
      isLoadingRef.current = false;
    }, 100);
  };
  
  useEffect(() => {
    loadDrawings();
    
    const handleDrawingsUpdated = () => {
      if (isLoadingRef.current) return;
      console.log("Drawings updated event received in useDrawings");
      loadDrawings();
    };
    
    // Only listen to specific drawing events, not storage
    window.addEventListener('drawingsUpdated', handleDrawingsUpdated);
    window.addEventListener('floorPlanUpdated', handleDrawingsUpdated);
    
    return () => {
      window.removeEventListener('drawingsUpdated', handleDrawingsUpdated);
      window.removeEventListener('floorPlanUpdated', handleDrawingsUpdated);
    };
  }, []);
  
  const handleDeleteDrawing = (id: string) => {
    deleteDrawing(id);
    // Update local state immediately
    setSavedDrawings(prev => prev.filter(drawing => drawing.id !== id));
    toast.success('Drawing deleted');
  };
  
  return { 
    savedDrawings, 
    setSavedDrawings, 
    deleteDrawing: handleDeleteDrawing 
  };
}
