
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { applyImageClipMask, findSvgPathByDrawingId } from '@/utils/svg-clip-mask';
import { getDrawingIdsWithFloorPlans } from '@/utils/floor-plan-utils';
import { debugSvgElement } from '@/utils/svg-debug-utils';

/**
 * Hook that manages clip mask application and reapplication
 */
export function useClipMaskManagement() {
  const attemptQueueRef = useRef<Map<string, number>>(new Map());
  const [reapplyTriggered, setReapplyTriggered] = useState(false);

  // Function to apply a clip mask with retry logic
  const applyClipMaskWithRetry = (drawingId: string) => {
    console.log(`Attempting to apply clip mask for ${drawingId}`);
    const floorPlanData = getFloorPlan(drawingId);
    
    if (floorPlanData && floorPlanData.imageData) {
      const pathElement = findSvgPathByDrawingId(drawingId);
      if (pathElement) {
        console.log(`Found path element for ${drawingId}, applying clip mask`);
        debugSvgElement(pathElement, `Before applying clip mask to ${drawingId}`);
        
        const result = applyImageClipMask(
          pathElement, 
          floorPlanData.imageData, 
          drawingId
        );
        
        if (result) {
          console.log(`Successfully applied clip mask for ${drawingId}`);
          debugSvgElement(pathElement, `After applying clip mask to ${drawingId}`);
          
          // Force SVG update
          setTimeout(() => {
            window.dispatchEvent(new Event('resize'));
          }, 100);
          
          return true;
        } else {
          console.log(`Failed to apply clip mask for ${drawingId}, will retry`);
          return false;
        }
      } else {
        console.log(`Path element not found for ${drawingId}`);
        return false;
      }
    }
    return false;
  };

  const setupEventListeners = () => {
    const handleFloorPlanUpdated = (event: CustomEvent) => {
      const { drawingId } = event.detail || {};
      console.log('Floor plan updated event received:', drawingId);
      
      if (drawingId) {
        // Initialize retry counter if not set
        if (!attemptQueueRef.current.has(drawingId)) {
          attemptQueueRef.current.set(drawingId, 0);
        }
        
        const tryApply = () => {
          const attempts = attemptQueueRef.current.get(drawingId) || 0;
          
          if (attempts >= 10) {
            console.warn(`Maximum retries reached for ${drawingId}`);
            attemptQueueRef.current.delete(drawingId);
            return;
          }
          
          attemptQueueRef.current.set(drawingId, attempts + 1);
          
          setTimeout(() => {
            const success = applyClipMaskWithRetry(drawingId);
            if (!success && attemptQueueRef.current.has(drawingId)) {
              console.log(`Retry ${attempts + 1}/10 for ${drawingId}`);
              tryApply();
            } else if (success) {
              attemptQueueRef.current.delete(drawingId);
            }
          }, Math.min(300 * (attempts + 1), 2000));
        };
        
        tryApply();
      }
    };

    // Also listen for clipMaskUpdated events
    const handleClipMaskUpdated = (event: CustomEvent) => {
      const { drawingId } = event.detail || {};
      console.log('Clip mask updated event received:', drawingId);
      
      if (drawingId) {
        // Force SVG update to make sure the change is visible
        setTimeout(() => {
          window.dispatchEvent(new Event('resize'));
        }, 100);
      }
    };
    
    // Listen for visibility changes to reapply clip masks when returning to the page
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('Page became visible, checking for drawings with floor plans to reapply');
        setReapplyTriggered(prev => !prev); // Toggle to trigger useEffect
      }
    };

    window.addEventListener('floorPlanUpdated', handleFloorPlanUpdated as EventListener);
    window.addEventListener('clipMaskUpdated', handleClipMaskUpdated as EventListener);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Return cleanup function
    return () => {
      window.removeEventListener('floorPlanUpdated', handleFloorPlanUpdated as EventListener);
      window.removeEventListener('clipMaskUpdated', handleClipMaskUpdated as EventListener);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  };

  const reapplyAllClipMasks = () => {
    const drawingIds = getDrawingIdsWithFloorPlans();
    console.log(`Attempting to reapply all clip masks for ${drawingIds.length} drawings`);
    
    if (drawingIds.length === 0) return;
    
    // Stagger applications to avoid overwhelming the browser
    drawingIds.forEach((drawingId, index) => {
      setTimeout(() => {
        applyClipMaskWithRetry(drawingId);
      }, index * 200);
    });
  };

  // Add the missing function import
  const getFloorPlan = (drawingId: string) => {
    try {
      const floorPlans = JSON.parse(localStorage.getItem('floorPlans') || '{}');
      return floorPlans[drawingId];
    } catch (err) {
      console.error('Error getting floor plan:', err);
      return null;
    }
  };

  return {
    reapplyTriggered,
    setReapplyTriggered,
    applyClipMaskWithRetry,
    setupEventListeners,
    reapplyAllClipMasks,
    attemptQueueRef
  };
}
