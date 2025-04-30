
import { useState, useEffect } from 'react';
import { getSavedDrawings } from '@/utils/drawing/operations';
import { DrawingData } from '@/utils/drawing/types';
import { getDrawingIdsWithFloorPlans } from '@/utils/floor-plan-utils';

export function useDrawings() {
  const [savedDrawings, setSavedDrawings] = useState<DrawingData[]>([]);
  const [drawingsWithFloorPlans, setDrawingsWithFloorPlans] = useState<string[]>([]);
  
  useEffect(() => {
    const loadDrawings = () => {
      const drawings = getSavedDrawings();
      setSavedDrawings(drawings);
      setDrawingsWithFloorPlans(getDrawingIdsWithFloorPlans());
    };
    
    loadDrawings();
    
    const handleStorageChange = () => {
      loadDrawings();
    };
    
    const handleFloorPlanUpdated = () => {
      setDrawingsWithFloorPlans(getDrawingIdsWithFloorPlans());
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
