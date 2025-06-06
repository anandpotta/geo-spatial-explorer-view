
import { useState, useEffect } from 'react';
import { DrawingData, getSavedDrawings, deleteDrawing } from '@/utils/drawing-utils';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

export function useDrawings() {
  const [savedDrawings, setSavedDrawings] = useState<DrawingData[]>([]);
  const { currentUser } = useAuth();
  
  const loadDrawings = () => {
    if (!currentUser) {
      setSavedDrawings([]);
      return;
    }
    
    const drawings = getSavedDrawings();
    setSavedDrawings(drawings);
    console.log(`Loaded ${drawings.length} drawings for user ${currentUser.id}`);
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
    
    const handleUserChanged = () => {
      // Short delay to ensure auth state is updated
      setTimeout(loadDrawings, 50);
    };
    
    window.addEventListener('storage', handleStorage);
    window.addEventListener('drawingsUpdated', handleDrawingsUpdated);
    window.addEventListener('userChanged', handleUserChanged);
    window.addEventListener('floorPlanUpdated', handleDrawingsUpdated);
    
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('drawingsUpdated', handleDrawingsUpdated);
      window.removeEventListener('userChanged', handleUserChanged);
      window.removeEventListener('floorPlanUpdated', handleDrawingsUpdated);
    };
  }, [currentUser]);
  
  const handleDeleteDrawing = (id: string) => {
    if (!currentUser) {
      toast.error('Please log in to manage drawings');
      return;
    }
    
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
