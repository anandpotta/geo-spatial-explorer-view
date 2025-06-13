
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
  const retryTimeoutsRef = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  
  // Stable function to apply clip mask
  const applyClipMaskStable = useCallback(async (drawingId: string, floorPlanData: any, retryCount = 0) => {
    const maxRetries = 15;
    const baseRetryDelay = 300;
    
    console.log(`🎯 useSvgPathManagement: applyClipMaskStable CALLED for ${drawingId} (attempt ${retryCount + 1})`);
    
    if (retryCount >= maxRetries) {
      console.error(`❌ useSvgPathManagement: Max retries exceeded for ${drawingId}`);
      return false;
    }
    
    console.log(`🎯 useSvgPathManagement: Applying clip mask for ${drawingId} (attempt ${retryCount + 1})`);
    
    // Clear any existing retry timeout for this drawing
    const existingTimeout = retryTimeoutsRef.current.get(drawingId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
      retryTimeoutsRef.current.delete(drawingId);
    }
    
    // Find path element with comprehensive search
    let pathElement = findSvgPathByDrawingId(drawingId);
    console.log(`🔍 useSvgPathManagement: findSvgPathByDrawingId result for ${drawingId}:`, pathElement);
    
    if (!pathElement) {
      pathElement = document.querySelector(`#drawing-path-${drawingId}`) as SVGPathElement;
      console.log(`🔍 useSvgPathManagement: querySelector by ID result for ${drawingId}:`, pathElement);
    }
    
    if (!pathElement) {
      pathElement = document.querySelector(`[data-drawing-id="${drawingId}"]`) as SVGPathElement;
      console.log(`🔍 useSvgPathManagement: querySelector by data-drawing-id result for ${drawingId}:`, pathElement);
    }
    
    if (!pathElement) {
      // Look in all SVG containers and leaflet panes
      const allSvgs = document.querySelectorAll('svg');
      console.log(`🔍 useSvgPathManagement: Found ${allSvgs.length} SVG elements to search`);
      
      for (const svg of Array.from(allSvgs)) {
        pathElement = svg.querySelector(`path[data-drawing-id="${drawingId}"]`) as SVGPathElement;
        if (pathElement) {
          console.log(`🔍 useSvgPathManagement: Found path in SVG element:`, svg);
          break;
        }
      }
    }
    
    if (!pathElement) {
      // Also search in leaflet overlay panes specifically
      const overlayPanes = document.querySelectorAll('.leaflet-overlay-pane');
      console.log(`🔍 useSvgPathManagement: Found ${overlayPanes.length} overlay panes to search`);
      
      for (const pane of Array.from(overlayPanes)) {
        pathElement = pane.querySelector(`path[data-drawing-id="${drawingId}"]`) as SVGPathElement;
        if (pathElement) {
          console.log(`🔍 useSvgPathManagement: Found path in overlay pane:`, pane);
          break;
        }
      }
    }
    
    // Additional comprehensive search
    if (!pathElement) {
      const allPaths = document.querySelectorAll('path');
      console.log(`🔍 useSvgPathManagement: Searching through ${allPaths.length} total path elements`);
      
      for (const path of Array.from(allPaths)) {
        const pathDrawingId = path.getAttribute('data-drawing-id');
        const pathId = path.getAttribute('id');
        console.log(`🔍 useSvgPathManagement: Path attributes:`, {
          'data-drawing-id': pathDrawingId,
          'id': pathId,
          'matches': pathDrawingId === drawingId || pathId === `drawing-path-${drawingId}`
        });
        
        if (pathDrawingId === drawingId || pathId === `drawing-path-${drawingId}`) {
          pathElement = path as SVGPathElement;
          console.log(`🔍 useSvgPathManagement: Found matching path element:`, pathElement);
          break;
        }
      }
    }
    
    if (!pathElement) {
      console.log(`🔍 useSvgPathManagement: Path not found for ${drawingId}, retrying in ${baseRetryDelay * (retryCount + 1)}ms`);
      
      const timeoutId = setTimeout(() => {
        if (mountedRef.current) {
          console.log(`🔄 useSvgPathManagement: Retrying clip mask application for ${drawingId}`);
          applyClipMaskStable(drawingId, floorPlanData, retryCount + 1);
        }
      }, baseRetryDelay * (retryCount + 1));
      
      retryTimeoutsRef.current.set(drawingId, timeoutId);
      return false;
    }
    
    console.log(`✅ useSvgPathManagement: Found path element for ${drawingId}:`, pathElement);
    console.log(`🔍 usSvgPathManagement: Path element details:`, {
      tagName: pathElement.tagName,
      id: pathElement.id,
      'data-drawing-id': pathElement.getAttribute('data-drawing-id'),
      'd': pathElement.getAttribute('d')?.substring(0, 50) + '...',
      className: pathElement.className,
      parentElement: pathElement.parentElement?.tagName
    });
    
    // Check if already processed successfully
    const currentFill = pathElement.style.fill || pathElement.getAttribute('fill');
    if (currentFill && currentFill.includes(`pattern-${drawingId}`)) {
      console.log(`✅ useSvgPathManagement: Clip mask already applied to ${drawingId}`);
      processedDrawingsRef.current.add(drawingId);
      return true;
    }
    
    // Apply the clip mask
    console.log(`🎨 useSvgPathManagement: Applying clip mask with image data to ${drawingId}`);
    console.log(`🎨 useSvgPathManagement: Floor plan data length:`, floorPlanData.data?.length);
    console.log(`🎨 useSvgPathManagement: Floor plan data type:`, typeof floorPlanData.data);
    console.log(`🎨 useSvgPathManagement: Floor plan data preview:`, floorPlanData.data?.substring(0, 100));
    
    const result = applyImageClipMask(pathElement, floorPlanData.data, drawingId);
    console.log(`🎨 useSvgPathManagement: applyImageClipMask result:`, result);
    
    if (result) {
      console.log(`🎉 useSvgPathManagement: Successfully applied clip mask to ${drawingId}`);
      
      // Mark as processed
      processedDrawingsRef.current.add(drawingId);
      
      // Verify the fill was applied
      const newFill = pathElement.style.fill || pathElement.getAttribute('fill');
      console.log(`🔍 useSvgPathManagement: New fill after application:`, newFill);
      
      // Ensure the fill persists with multiple checks
      const ensureFillPersistence = (attempt = 0) => {
        if (!mountedRef.current || attempt > 5) return;
        
        setTimeout(() => {
          if (mountedRef.current && document.contains(pathElement)) {
            const expectedFill = `url(#pattern-${drawingId})`;
            const currentFill = pathElement.style.fill || pathElement.getAttribute('fill');
            
            console.log(`🔄 useSvgPathManagement: Fill persistence check ${attempt + 1} for ${drawingId}:`, {
              expectedFill,
              currentFill,
              needsReapply: !currentFill || !currentFill.includes(`pattern-${drawingId}`)
            });
            
            if (!currentFill || !currentFill.includes(`pattern-${drawingId}`)) {
              console.log(`🔄 useSvgPathManagement: Reapplying fill to ${drawingId} (attempt ${attempt + 1})`);
              pathElement.style.fill = expectedFill;
              pathElement.setAttribute('fill', expectedFill);
              
              // Force repaint
              pathElement.getBoundingClientRect();
              
              // Continue checking
              ensureFillPersistence(attempt + 1);
            } else {
              console.log(`✅ useSvgPathManagement: Fill persistence confirmed for ${drawingId}`);
            }
          }
        }, 100 * (attempt + 1));
      };
      
      ensureFillPersistence();
      
      return true;
    } else {
      console.error(`❌ useSvgPathManagement: Failed to apply clip mask to ${drawingId}`);
      
      // Retry on failure
      const timeoutId = setTimeout(() => {
        if (mountedRef.current) {
          console.log(`🔄 useSvgPathManagement: Retrying after failure for ${drawingId}`);
          applyClipMaskStable(drawingId, floorPlanData, retryCount + 1);
        }
      }, baseRetryDelay * (retryCount + 1));
      
      retryTimeoutsRef.current.set(drawingId, timeoutId);
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
      
      // Skip if already successfully processed and no retry needed
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
        console.log(`❌ useSvgPathManagement: User mismatch, skipping. Event userId: ${userId}, current: ${currentUser.id}`);
        return;
      }
      
      if (drawingId && mountedRef.current) {
        isProcessingRef.current.add(drawingId);
        
        console.log(`🎯 useSvgPathManagement: Processing floor plan update for drawing ${drawingId}`);
        
        try {
          // Get the floor plan data
          const floorPlan = await getFloorPlanById(drawingId);
          
          console.log(`🔍 useSvgPathManagement: Retrieved floor plan:`, {
            exists: !!floorPlan,
            hasData: !!(floorPlan?.data),
            dataLength: floorPlan?.data?.length,
            fileName: floorPlan?.fileName,
            userId: floorPlan?.userId,
            currentUserId: currentUser?.id || 'anonymous'
          });
          
          if (floorPlan && floorPlan.data && (!currentUser || floorPlan.userId === currentUser.id || floorPlan.userId === 'anonymous')) {
            console.log(`✅ useSvgPathManagement: Found floor plan for ${drawingId}, starting clip mask application`);
            
            // Apply immediately, then retry to ensure it sticks
            const result = await applyClipMaskStable(drawingId, floorPlan);
            console.log(`🎯 useSvgPathManagement: First application result:`, result);
            
            // Additional attempt after a short delay to ensure persistence
            setTimeout(async () => {
              if (mountedRef.current && !processedDrawingsRef.current.has(drawingId)) {
                console.log(`🔄 useSvgPathManagement: Second application attempt for ${drawingId}`);
                const secondResult = await applyClipMaskStable(drawingId, floorPlan);
                console.log(`🎯 useSvgPathManagement: Second application result:`, secondResult);
              }
            }, 1000);
            
          } else {
            console.log(`❌ useSvgPathManagement: No valid floor plan found for ${drawingId}`);
          }
        } catch (error) {
          console.error(`❌ useSvgPathManagement: Error processing floor plan update for ${drawingId}:`, error);
        } finally {
          isProcessingRef.current.delete(drawingId);
        }
      }
    };

    console.log(`🎧 useSvgPathManagement: Adding floor plan update listener`);
    window.addEventListener('floorPlanUpdated', handleFloorPlanUpdated as EventListener);
    
    return () => {
      console.log(`🔇 useSvgPathManagement: Removing floor plan update listener`);
      mountedRef.current = false;
      
      // Clear all retry timeouts
      retryTimeoutsRef.current.forEach(timeoutId => clearTimeout(timeoutId));
      retryTimeoutsRef.current.clear();
      
      window.removeEventListener('floorPlanUpdated', handleFloorPlanUpdated as EventListener);
    };
  }, [applyClipMaskStable]);
  
  // Check for existing floor plans on mount
  useEffect(() => {
    const checkExistingFloorPlans = async () => {
      if (!mountedRef.current) return;
      
      console.log(`🔍 useSvgPathManagement: Checking for existing floor plans on mount`);
      
      // Look for existing paths with floor plans
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
            await applyClipMaskStable(drawingId, floorPlan);
          }
        } catch (error) {
          console.error(`Error checking existing floor plan for ${drawingId}:`, error);
        }
      }
    };
    
    // Check after a short delay to ensure DOM is ready
    setTimeout(checkExistingFloorPlans, 1500);
  }, [applyClipMaskStable]);
  
  return {
    svgPaths,
    setSvgPaths
  };
}
