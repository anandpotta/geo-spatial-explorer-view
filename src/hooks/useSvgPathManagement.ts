
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
      if (!currentUser || (userId && currentUser.id !== userId)) return;
      
      if (drawingId) {
        // Wait for DOM to update
        setTimeout(() => {
          const floorPlans = JSON.parse(localStorage.getItem('floorPlans') || '{}');
          const floorPlan = floorPlans[drawingId];
          
          if (floorPlan && (!floorPlan.userId || floorPlan.userId === currentUser.id)) {
            const pathElement = findSvgPathByDrawingId(drawingId);
            if (pathElement) {
              console.log(`Reapplying clip mask for drawing ${drawingId}`);
              applyImageClipMask(pathElement, floorPlan.data, drawingId);
            } else {
              console.log(`Path element not found for drawing ${drawingId}`);
            }
          }
        }, 500);
      }
    };
    
    // Handle reapply floor plans event (triggered after view mode changes)
    const handleReapplyFloorPlans = () => {
      console.log('Reapplying all floor plans after view mode change');
      
      // Get all floor plans
      const floorPlans = JSON.parse(localStorage.getItem('floorPlans') || '{}');
      const currentUser = getCurrentUser();
      if (!currentUser) return;
      
      // Process each floor plan with multiple attempts
      Object.entries(floorPlans).forEach(([drawingId, floorPlanData]: [string, any]) => {
        // Skip floor plans that don't belong to the current user
        if (floorPlanData.userId && floorPlanData.userId !== currentUser.id) return;
        
        // Use multiple attempts with increasing delays
        const attemptReapply = (attempt: number) => {
          if (attempt > 5) return; // Max 5 attempts
          
          setTimeout(() => {
            const pathElement = findSvgPathByDrawingId(drawingId);
            if (pathElement) {
              console.log(`Reapplying clip mask for drawing ${drawingId} (attempt ${attempt})`);
              applyImageClipMask(pathElement, floorPlanData.data, drawingId);
            } else if (attempt < 5) {
              console.log(`Path not found, scheduling another attempt for ${drawingId}`);
              attemptReapply(attempt + 1);
            }
          }, 500 * attempt); // Increasing delays: 500ms, 1000ms, 1500ms, etc.
        };
        
        // Start the attempt sequence
        attemptReapply(1);
      });
    };

    window.addEventListener('floorPlanUpdated', handleFloorPlanUpdated as EventListener);
    window.addEventListener('reapplyFloorPlans', handleReapplyFloorPlans);
    
    return () => {
      window.removeEventListener('floorPlanUpdated', handleFloorPlanUpdated as EventListener);
      window.removeEventListener('reapplyFloorPlans', handleReapplyFloorPlans);
    };
  }, []);
  
  return {
    svgPaths,
    setSvgPaths
  };
}
