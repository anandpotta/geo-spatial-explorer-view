
import { useState, useEffect, useRef, useCallback } from 'react';
import { findSvgPathByDrawingId } from '@/utils/svg-path-finder';
import { applyImageClipMask } from '@/utils/svg-clip-mask';
import { getCurrentUser } from '@/services/auth-service';
import { getFloorPlanById } from '@/utils/floor-plan-utils';

export function useSvgPathManagement() {
  const [svgPaths, setSvgPaths] = useState<string[]>([]);
  const mountedRef = useRef(true);
  const processedDrawingsRef = useRef(new Set<string>());
  
  // Simple function to apply clip mask immediately
  const applyClipMaskToPath = useCallback(async (drawingId: string, floorPlanData: any) => {
    console.log(`🎯 useSvgPathManagement: Starting clip mask application for ${drawingId}`);
    
    // Find the path element using all available methods
    let pathElement = findSvgPathByDrawingId(drawingId);
    
    if (!pathElement) {
      // Try direct selectors
      pathElement = document.querySelector(`#drawing-path-${drawingId}`) as SVGPathElement;
    }
    
    if (!pathElement) {
      pathElement = document.querySelector(`[data-drawing-id="${drawingId}"]`) as SVGPathElement;
    }
    
    if (!pathElement) {
      // Search in all SVG elements
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
      
      // Ensure the fill persists
      setTimeout(() => {
        if (mountedRef.current && document.contains(pathElement)) {
          const expectedFill = `url(#pattern-${drawingId})`;
          const currentFill = pathElement.style.fill || pathElement.getAttribute('fill');
          
          if (!currentFill || !currentFill.includes(`pattern-${drawingId}`)) {
            console.log(`🔄 useSvgPathManagement: Reapplying fill to ${drawingId}`);
            pathElement.style.fill = expectedFill;
            pathElement.setAttribute('fill', expectedFill);
          }
        }
      }, 100);
      
      return true;
    } else {
      console.error(`❌ useSvgPathManagement: Failed to apply clip mask to ${drawingId}`);
      return false;
    }
  }, []);
  
  // Listen for floorPlanUpdated events
  useEffect(() => {
    const handleFloorPlanUpdated = async (event: CustomEvent) => {
      const { drawingId, userId, freshlyUploaded, retryNeeded, success } = event.detail;
      
      console.log(`🔄 useSvgPathManagement: Floor plan updated event received`, { 
        drawingId, 
        userId, 
        freshlyUploaded, 
        retryNeeded, 
        success 
      });
      
      if (!drawingId || !mountedRef.current) {
        console.log(`❌ useSvgPathManagement: Invalid event or unmounted component`);
        return;
      }
      
      // Check if already processed successfully
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
          
          // Apply clip mask with multiple attempts
          let success = false;
          
          // Immediate attempt
          success = await applyClipMaskToPath(drawingId, floorPlan);
          
          // If failed, try again after DOM stabilizes
          if (!success) {
            setTimeout(async () => {
              if (mountedRef.current) {
                console.log(`🔄 useSvgPathManagement: Retry attempt for ${drawingId}`);
                await applyClipMaskToPath(drawingId, floorPlan);
              }
            }, 500);
          }
          
          // Final attempt after longer delay
          setTimeout(async () => {
            if (mountedRef.current && !processedDrawingsRef.current.has(drawingId)) {
              console.log(`🔄 useSvgPathManagement: Final attempt for ${drawingId}`);
              await applyClipMaskToPath(drawingId, floorPlan);
            }
          }, 1500);
          
        } else {
          console.log(`❌ useSvgPathManagement: No valid floor plan found for ${drawingId}`);
        }
      } catch (error) {
        console.error(`❌ useSvgPathManagement: Error processing floor plan update for ${drawingId}:`, error);
      }
    };

    console.log(`🎧 useSvgPathManagement: Adding floor plan update listener`);
    window.addEventListener('floorPlanUpdated', handleFloorPlanUpdated as EventListener);
    
    return () => {
      console.log(`🔇 useSvgPathManagement: Removing floor plan update listener`);
      mountedRef.current = false;
      window.removeEventListener('floorPlanUpdated', handleFloorPlanUpdated as EventListener);
    };
  }, [applyClipMaskToPath]);
  
  // Check for existing floor plans on mount
  useEffect(() => {
    const checkExistingFloorPlans = async () => {
      if (!mountedRef.current) return;
      
      console.log(`🔍 useSvgPathManagement: Checking for existing floor plans on mount`);
      
      // Look for existing paths with floor plans
      setTimeout(async () => {
        if (!mountedRef.current) return;
        
        const allPaths = document.querySelectorAll('path[data-drawing-id]');
        console.log(`🔍 useSvgPathManagement: Found ${allPaths.length} paths with drawing IDs`);
        
        for (const pathElement of Array.from(allPaths)) {
          const drawingId = pathElement.getAttribute('data-drawing-id');
          if (!drawingId || processedDrawingsRef.current.has(drawingId)) continue;
          
          console.log(`🔍 useSvgPathManagement: Checking existing path for ${drawingId}`);
          
          try {
            const floorPlan = await getFloorPlanById(drawingId);
            if (floorPlan && floorPlan.data) {
              console.log(`🔍 useSvgPathManagement: Found existing floor plan for ${drawingId}, applying clip mask`);
              await applyClipMaskToPath(drawingId, floorPlan);
            }
          } catch (error) {
            console.error(`Error checking existing floor plan for ${drawingId}:`, error);
          }
        }
      }, 2000);
    };
    
    checkExistingFloorPlans();
  }, [applyClipMaskToPath]);
  
  return {
    svgPaths,
    setSvgPaths
  };
}
