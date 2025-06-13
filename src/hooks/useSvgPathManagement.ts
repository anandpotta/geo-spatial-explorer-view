
import { useState, useEffect, useRef, useCallback } from 'react';
import { findSvgPathByDrawingId } from '@/utils/svg-path-finder';
import { applyImageClipMask } from '@/utils/svg-clip-mask';
import { getCurrentUser } from '@/services/auth-service';
import { getFloorPlanById } from '@/utils/floor-plan-utils';

export function useSvgPathManagement() {
  const [svgPaths, setSvgPaths] = useState<string[]>([]);
  const mountedRef = useRef(true);
  const processedDrawingsRef = useRef(new Set<string>());
  const listenerAddedRef = useRef(false);
  
  // Apply clip mask function with improved path finding and persistence
  const applyClipMaskToPath = useCallback(async (drawingId: string, floorPlanData: any) => {
    console.log(`🎯 useSvgPathManagement: Starting clip mask application for ${drawingId}`);
    
    // Find the path element using multiple strategies
    let pathElement = findSvgPathByDrawingId(drawingId);
    
    if (!pathElement) {
      // Try additional selectors with delay for DOM to stabilize
      await new Promise(resolve => setTimeout(resolve, 100));
      pathElement = document.querySelector(`#drawing-path-${drawingId}`) as SVGPathElement;
    }
    
    if (!pathElement) {
      pathElement = document.querySelector(`[data-drawing-id="${drawingId}"]`) as SVGPathElement;
    }
    
    if (!pathElement) {
      // Search in all SVG elements more thoroughly
      const allPaths = document.querySelectorAll('path');
      for (const path of Array.from(allPaths)) {
        const pathDrawingId = path.getAttribute('data-drawing-id');
        const pathId = path.getAttribute('id');
        if (pathDrawingId === drawingId || pathId === `drawing-path-${drawingId}`) {
          pathElement = path as SVGPathElement;
          break;
        }
      }
    }
    
    if (!pathElement) {
      console.error(`❌ useSvgPathManagement: Could not find path element for ${drawingId}`);
      return false;
    }
    
    console.log(`✅ useSvgPathManagement: Found path element for ${drawingId}:`, pathElement);
    
    // Check if already has clip mask applied
    const currentFill = pathElement.style.fill || pathElement.getAttribute('fill');
    if (currentFill && currentFill.includes(`pattern-${drawingId}`)) {
      console.log(`✅ useSvgPathManagement: Clip mask already applied to ${drawingId}`);
      return true;
    }
    
    // Apply the clip mask with the floor plan data
    console.log(`🎨 useSvgPathManagement: Applying clip mask to ${drawingId}`);
    const result = applyImageClipMask(pathElement, floorPlanData.data, drawingId);
    
    if (result) {
      console.log(`🎉 useSvgPathManagement: Successfully applied clip mask to ${drawingId}`);
      processedDrawingsRef.current.add(drawingId);
      
      // Ensure the fill persists with multiple checks
      const ensureFillPersists = () => {
        if (mountedRef.current && document.contains(pathElement)) {
          const expectedFill = `url(#pattern-${drawingId})`;
          const currentFill = pathElement.style.fill || pathElement.getAttribute('fill');
          
          if (!currentFill || !currentFill.includes(`pattern-${drawingId}`)) {
            console.log(`🔄 useSvgPathManagement: Reapplying fill to ${drawingId}`);
            pathElement.style.fill = expectedFill;
            pathElement.setAttribute('fill', expectedFill);
          }
        }
      };
      
      // Multiple persistence checks
      setTimeout(ensureFillPersists, 100);
      setTimeout(ensureFillPersists, 500);
      setTimeout(ensureFillPersists, 1000);
      
      return true;
    } else {
      console.error(`❌ useSvgPathManagement: Failed to apply clip mask to ${drawingId}`);
      return false;
    }
  }, []);
  
  // Floor plan update handler
  const handleFloorPlanUpdated = useCallback(async (event: CustomEvent) => {
    const { drawingId, userId, freshlyUploaded, retryNeeded, success } = event.detail;
    
    console.log(`🔄 useSvgPathManagement: Processing floor plan update for ${drawingId}`, { 
      drawingId, 
      userId, 
      freshlyUploaded, 
      retryNeeded, 
      success,
      isMounted: mountedRef.current
    });
    
    if (!drawingId || !mountedRef.current) {
      console.log(`❌ useSvgPathManagement: Invalid event or unmounted component`);
      return;
    }
    
    // Check if already processed successfully (unless retry is needed)
    if (processedDrawingsRef.current.has(drawingId) && !retryNeeded) {
      console.log(`✅ useSvgPathManagement: Already processed ${drawingId}, skipping`);
      return;
    }
    
    // Verify user access
    const currentUser = getCurrentUser();
    if (userId && currentUser && currentUser.id !== userId) {
      console.log(`❌ useSvgPathManagement: User mismatch, skipping. Event userId: ${userId}, current: ${currentUser.id}`);
      return;
    }
    
    try {
      console.log(`🎯 useSvgPathManagement: Processing floor plan update for drawing ${drawingId}`);
      
      // Get the floor plan data
      const floorPlan = await getFloorPlanById(drawingId);
      
      if (floorPlan && floorPlan.data) {
        console.log(`✅ useSvgPathManagement: Found floor plan for ${drawingId}, applying clip mask`);
        
        // Apply clip mask with multiple attempts and delays
        let success = false;
        
        // Immediate attempt
        success = await applyClipMaskToPath(drawingId, floorPlan);
        
        // Retry attempts with increasing delays
        if (!success && mountedRef.current) {
          setTimeout(async () => {
            if (mountedRef.current) {
              console.log(`🔄 useSvgPathManagement: Retry attempt 1 for ${drawingId}`);
              success = await applyClipMaskToPath(drawingId, floorPlan);
            }
          }, 200);
        }
        
        if (!success && mountedRef.current) {
          setTimeout(async () => {
            if (mountedRef.current) {
              console.log(`🔄 useSvgPathManagement: Retry attempt 2 for ${drawingId}`);
              await applyClipMaskToPath(drawingId, floorPlan);
            }
          }, 1000);
        }
        
        // Final attempt
        setTimeout(async () => {
          if (mountedRef.current && !processedDrawingsRef.current.has(drawingId)) {
            console.log(`🔄 useSvgPathManagement: Final attempt for ${drawingId}`);
            await applyClipMaskToPath(drawingId, floorPlan);
          }
        }, 2000);
        
      } else {
        console.log(`❌ useSvgPathManagement: No valid floor plan found for ${drawingId}`);
      }
    } catch (error) {
      console.error(`❌ useSvgPathManagement: Error processing floor plan update for ${drawingId}:`, error);
    }
  }, [applyClipMaskToPath]);
  
  // Check for existing floor plans and set up listener
  useEffect(() => {
    if (!mountedRef.current) return;
    
    // Add the event listener if not already added
    if (!listenerAddedRef.current) {
      console.log(`🎧 useSvgPathManagement: Adding floor plan update listener`);
      window.addEventListener('floorPlanUpdated', handleFloorPlanUpdated as EventListener);
      listenerAddedRef.current = true;
    }
    
    // Check for existing floor plans after a delay to ensure DOM is ready
    const checkExistingFloorPlans = async () => {
      if (!mountedRef.current) return;
      
      console.log(`🔍 useSvgPathManagement: Checking for existing floor plans on mount`);
      
      // Wait for DOM to stabilize
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (!mountedRef.current) return;
      
      const allPaths = document.querySelectorAll('path[data-drawing-id]');
      console.log(`🔍 useSvgPathManagement: Found ${allPaths.length} paths with drawing IDs`);
      
      for (const pathElement of Array.from(allPaths)) {
        const drawingId = pathElement.getAttribute('data-drawing-id');
        if (!drawingId || processedDrawingsRef.current.has(drawingId)) continue;
        
        console.log(`🔍 useSvgPathManagement: Checking existing path for ${drawingId}`);
        
        try {
          const floorPlan = await getFloorPlanById(drawingId);
          if (floorPlan && floorPlan.data && mountedRef.current) {
            console.log(`🔍 useSvgPathManagement: Found existing floor plan for ${drawingId}, applying clip mask`);
            await applyClipMaskToPath(drawingId, floorPlan);
          }
        } catch (error) {
          console.error(`Error checking existing floor plan for ${drawingId}:`, error);
        }
      }
    };
    
    checkExistingFloorPlans();
    
    return () => {
      console.log(`🔇 useSvgPathManagement: Cleanup function called`);
      mountedRef.current = false;
      if (listenerAddedRef.current) {
        window.removeEventListener('floorPlanUpdated', handleFloorPlanUpdated as EventListener);
        listenerAddedRef.current = false;
      }
    };
  }, [handleFloorPlanUpdated]);
  
  return {
    svgPaths,
    setSvgPaths
  };
}
