
import { useState, useEffect } from 'react';
import { findSvgPathByDrawingId } from '@/utils/svg-path-finder';
import { applyImageClipMask } from '@/utils/svg-clip-mask';
import { getCurrentUser } from '@/services/auth-service';

export function useSvgPathManagement() {
  const [svgPaths, setSvgPaths] = useState<string[]>([]);
  
  // Listen for floorPlanUpdated events to attempt reapplying clipmasks
  useEffect(() => {
    const handleFloorPlanUpdated = (event: CustomEvent) => {
      const { drawingId, userId } = event.detail;
      
      // Only process floor plan updates for the current user
      const currentUser = getCurrentUser();
      if (!currentUser || currentUser.id !== userId) return;
      
      if (drawingId) {
        // Wait for DOM to update
        setTimeout(() => {
          const floorPlans = JSON.parse(localStorage.getItem('floorPlans') || '{}');
          const floorPlan = floorPlans[drawingId];
          
          if (floorPlan && floorPlan.userId === currentUser.id) {
            const pathElement = findSvgPathByDrawingId(drawingId);
            if (pathElement) {
              applyImageClipMask(pathElement, floorPlan.data, drawingId);
            }
          }
        }, 500);
      }
    };

    window.addEventListener('floorPlanUpdated', handleFloorPlanUpdated as EventListener);
    
    return () => {
      window.removeEventListener('floorPlanUpdated', handleFloorPlanUpdated as EventListener);
    };
  }, []);
  
  return {
    svgPaths,
    setSvgPaths
  };
}
