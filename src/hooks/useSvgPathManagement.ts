
import { useState, useEffect, useRef, useCallback } from 'react';
import { findSvgPathByDrawingId } from '@/utils/svg-path-finder';
import { applyImageClipMask } from '@/utils/svg-clip-mask';
import { getCurrentUser } from '@/services/auth-service';
import { getFloorPlanById } from '@/utils/floor-plan-utils';

export function useSvgPathManagement() {
  const [svgPaths, setSvgPaths] = useState<string[]>([]);
  const isProcessingRef = useRef(new Set<string>());
  const mountedRef = useRef(true);
  const processedDrawingsRef = useRef(new Set<string>());
  
  // Stable function to apply clip mask
  const applyClipMaskStable = useCallback(async (drawingId: string, floorPlanData: any, retryCount = 0) => {
    const maxRetries = 10;
    const retryDelay = 500;
    
    if (retryCount >= maxRetries) {
      console.error(`❌ useSvgPathManagement: Max retries exceeded for ${drawingId}`);
      return false;
    }
    
    console.log(`🎯 useSvgPathManagement: Applying clip mask for ${drawingId} (attempt ${retryCount + 1})`);
    
    // Find path element with multiple strategies
    let pathElement = findSvgPathByDrawingId(drawingId);
    
    if (!pathElement) {
      pathElement = document.querySelector(`#drawing-path-${drawingId}`) as SVGPathElement;
    }
    
    if (!pathElement) {
      pathElement = document.querySelector(`[data-drawing-id="${drawingId}"]`) as SVGPathElement;
    }
    
    if (!pathElement) {
      // Look in all SVG containers
      const allSvgs = document.querySelectorAll('svg');
      for (const svg of Array.from(allSvgs)) {
        pathElement = svg.querySelector(`path[data-drawing-id="${drawingId}"]`) as SVGPathElement;
        if (pathElement) break;
      }
    }
    
    if (!pathElement) {
      console.log(`🔍 useSvgPathManagement: Path not found for ${drawingId}, retrying in ${retryDelay}ms`);
      setTimeout(() => {
        if (mountedRef.current) {
          applyClipMaskStable(drawingId, floorPlanData, retryCount + 1);
        }
      }, retryDelay);
      return false;
    }
    
    console.log(`✅ useSvgPathManagement: Found path element for ${drawingId}:`, pathElement);
    
    // Check if already processed successfully
    const currentFill = pathElement.style.fill || pathElement.getAttribute('fill');
    if (currentFill && currentFill.includes(`pattern-${drawingId}`)) {
      console.log(`✅ useSvgPathManagement: Clip mask already applied to ${drawingId}`);
      processedDrawingsRef.current.add(drawingId);
      return true;
    }
    
    // Apply the clip mask
    console.log(`🎨 useSvgPathManagement: Applying clip mask with image data to ${drawingId}`);
    const result = applyImageClipMask(pathElement, floorPlanData.data, drawingId);
    
    if (result) {
      console.log(`🎉 useSvgPathManagement: Successfully applied clip mask to ${drawingId}`);
      
      // Mark as processed
      processedDrawingsRef.current.add(drawingId);
      
      // Ensure the fill is properly applied
      setTimeout(() => {
        if (mountedRef.current && document.contains(pathElement)) {
          const expectedFill = `url(#pattern-${drawingId})`;
          const currentFill = pathElement.style.fill || pathElement.getAttribute('fill');
          
          if (!currentFill || !currentFill.includes(`pattern-${drawingId}`)) {
            console.log(`🔄 useSvgPathManagement: Reapplying fill to ${drawingId}`);
            pathElement.style.fill = expectedFill;
            pathElement.setAttribute('fill', expectedFill);
          }
          
          // Force repaint
          pathElement.getBoundingClientRect();
          window.dispatchEvent(new Event('resize'));
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
      
      // Skip if already successfully processed
      if (processedDrawingsRef.current.has(drawingId) && !retryNeeded) {
        console.log(`✅ useSvgPathManagement: Already processed ${drawingId}, skipping`);
        return;
      }
      
      // Prevent duplicate processing
      if (isProcessingRef.current.has(drawingId)) {
        console.log(`⏭️ useSvgPathManagement: Already processing ${drawingId}, skipping`);
        return;
      }
      
      // Only process for current user
      const currentUser = getCurrentUser();
      if (userId && currentUser && currentUser.id !== userId) {
        console.log(`❌ useSvgPathManagement: User mismatch, skipping`);
        return;
      }
      
      if (drawingId && mountedRef.current) {
        isProcessingRef.current.add(drawingId);
        
        console.log(`🎯 useSvgPathManagement: Processing floor plan update for drawing ${drawingId}`);
        
        try {
          // Get the floor plan data
          const floorPlan = await getFloorPlanById(drawingId);
          
          if (floorPlan && floorPlan.data && (!currentUser || floorPlan.userId === currentUser.id || floorPlan.userId === 'anonymous')) {
            console.log(`✅ useSvgPathManagement: Found floor plan for ${drawingId}`, {
              hasData: !!floorPlan.data,
              dataLength: floorPlan.data?.length,
              fileName: floorPlan.fileName
            });
            
            // Wait a bit for DOM to stabilize
            const waitTime = freshlyUploaded ? 1000 : 500;
            
            setTimeout(async () => {
              if (mountedRef.current) {
                await applyClipMaskStable(drawingId, floorPlan);
              }
              isProcessingRef.current.delete(drawingId);
            }, waitTime);
          } else {
            console.log(`❌ useSvgPathManagement: No valid floor plan found for ${drawingId}`);
            isProcessingRef.current.delete(drawingId);
          }
        } catch (error) {
          console.error(`❌ useSvgPathManagement: Error processing floor plan update for ${drawingId}:`, error);
          isProcessingRef.current.delete(drawingId);
        }
      }
    };

    console.log(`🎧 useSvgPathManagement: Adding floor plan update listener`);
    window.addEventListener('floorPlanUpdated', handleFloorPlanUpdated as EventListener);
    
    return () => {
      console.log(`🔇 useSvgPathManagement: Removing floor plan update listener`);
      mountedRef.current = false;
      window.removeEventListener('floorPlanUpdated', handleFloorPlanUpdated as EventListener);
    };
  }, [applyClipMaskStable]);
  
  // Check for existing floor plans on mount
  useEffect(() => {
    const checkExistingFloorPlans = async () => {
      if (!mountedRef.current) return;
      
      // Look for existing paths with floor plans
      const allPaths = document.querySelectorAll('path[data-drawing-id]');
      
      for (const pathElement of Array.from(allPaths)) {
        const drawingId = pathElement.getAttribute('data-drawing-id');
        if (!drawingId || processedDrawingsRef.current.has(drawingId)) continue;
        
        try {
          const floorPlan = await getFloorPlanById(drawingId);
          if (floorPlan && floorPlan.data) {
            console.log(`🔍 useSvgPathManagement: Found existing floor plan for ${drawingId}, applying clip mask`);
            await applyClipMaskStable(drawingId, floorPlan);
          }
        } catch (error) {
          console.error(`Error checking existing floor plan for ${drawingId}:`, error);
        }
      }
    };
    
    // Check after a short delay to ensure DOM is ready
    setTimeout(checkExistingFloorPlans, 1000);
  }, [applyClipMaskStable]);
  
  return {
    svgPaths,
    setSvgPaths
  };
}
