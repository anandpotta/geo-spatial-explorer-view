
import { useState, useEffect } from 'react';
import { DrawingData, getSavedDrawings } from '@/utils/drawing-utils';
import { getDrawingIdsWithFloorPlans } from '@/utils/floor-plan-utils';

export function useDrawings() {
  const [savedDrawings, setSavedDrawings] = useState<DrawingData[]>([]);
  const [drawingsWithFloorPlans, setDrawingsWithFloorPlans] = useState<string[]>([]);
  
  useEffect(() => {
    const loadDrawings = () => {
      const drawings = getSavedDrawings();
      setSavedDrawings(drawings);
      
      // Handle the Promise correctly
      getDrawingIdsWithFloorPlans().then(ids => {
        setDrawingsWithFloorPlans(ids);
      }).catch(err => {
        console.error('Error loading drawings with floor plans:', err);
        setDrawingsWithFloorPlans([]);
      });
    };
    
    loadDrawings();
    
    const handleStorageChange = () => {
      loadDrawings();
    };
    
    const handleFloorPlanUpdated = () => {
      // Handle the Promise correctly here too
      getDrawingIdsWithFloorPlans().then(ids => {
        setDrawingsWithFloorPlans(ids);
      }).catch(err => {
        console.error('Error updating drawings with floor plans:', err);
      });
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('floorPlanUpdated', handleFloorPlanUpdated);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('floorPlanUpdated', handleFloorPlanUpdated);
    };
  }, []);

  return {
    savedDrawings,
    drawingsWithFloorPlans
  };
}
