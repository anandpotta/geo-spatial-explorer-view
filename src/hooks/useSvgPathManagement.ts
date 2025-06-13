
import { useState, useEffect } from 'react';
import { findSvgPathByDrawingId } from '@/utils/svg-path-finder';
import { applyImageClipMask } from '@/utils/svg-clip-mask';
import { getCurrentUser } from '@/services/auth-service';
import { getFloorPlanById } from '@/utils/floor-plan-utils';

export function useSvgPathManagement() {
  const [svgPaths, setSvgPaths] = useState<string[]>([]);
  
  // Listen for floorPlanUpdated events to attempt reapplying clipmasks
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
      
      // Skip if already successfully applied and not a retry
      if (success && !retryNeeded) {
        console.log(`✅ useSvgPathManagement: Clip mask already successfully applied for ${drawingId}`);
        return;
      }
      
      // Only process floor plan updates for the current user (allow anonymous)
      const currentUser = getCurrentUser();
      if (userId && currentUser && currentUser.id !== userId) {
        console.log(`❌ useSvgPathManagement: User mismatch, skipping`, { 
          currentUserId: currentUser?.id, 
          eventUserId: userId 
        });
        return;
      }
      
      if (drawingId) {
        console.log(`🎯 useSvgPathManagement: Processing floor plan update for drawing ${drawingId}`);
        
        // Wait for DOM to update, especially for freshly uploaded images
        const waitTime = freshlyUploaded ? 3000 : 2000; // Increased wait times
        
        setTimeout(async () => {
          try {
            // Get the floor plan data
            console.log(`📋 useSvgPathManagement: Getting floor plan data for ${drawingId}`);
            const floorPlan = await getFloorPlanById(drawingId);
            
            if (floorPlan && (!currentUser || floorPlan.userId === currentUser.id || floorPlan.userId === 'anonymous')) {
              console.log(`✅ useSvgPathManagement: Found floor plan for ${drawingId}`, {
                hasData: !!floorPlan.data,
                dataLength: floorPlan.data?.length,
                fileName: floorPlan.fileName,
                userId: floorPlan.userId
              });
              
              // Find the SVG path element with more aggressive retries
              let pathElement = null;
              let pathAttempts = 0;
              const maxPathAttempts = 25; // More attempts for better reliability
              
              while (!pathElement && pathAttempts < maxPathAttempts) {
                // Try multiple selectors to find the path
                pathElement = findSvgPathByDrawingId(drawingId);
                
                // If not found by drawing ID, try by element ID
                if (!pathElement) {
                  pathElement = document.querySelector(`#drawing-path-${drawingId}`);
                }
                
                // If still not found, try data attribute selector
                if (!pathElement) {
                  pathElement = document.querySelector(`[data-drawing-id="${drawingId}"]`);
                }
                
                if (!pathElement) {
                  console.log(`🔍 useSvgPathManagement: Path search attempt ${pathAttempts + 1}/${maxPathAttempts} for ${drawingId}`);
                  await new Promise(resolve => setTimeout(resolve, 400)); // Longer interval
                  pathAttempts++;
                } else {
                  console.log(`✅ useSvgPathManagement: Found path element for ${drawingId} after ${pathAttempts + 1} attempts`);
                  console.log(`🔍 useSvgPathManagement: Path element details:`, {
                    tagName: pathElement.tagName,
                    id: pathElement.id,
                    drawingId: pathElement.getAttribute('data-drawing-id'),
                    hasParent: !!pathElement.parentElement
                  });
                }
              }
              
              if (pathElement) {
                console.log(`🎨 useSvgPathManagement: Applying clip mask to ${drawingId}`);
                console.log(`🖼️ useSvgPathManagement: Using image data: ${floorPlan.data.substring(0, 50)}...`);
                
                // Force remove any existing clip mask first
                const existingSvg = pathElement.closest('svg');
                if (existingSvg) {
                  const existingPattern = existingSvg.querySelector(`#pattern-${drawingId}`);
                  const existingClipPath = existingSvg.querySelector(`#clip-${drawingId}`);
                  if (existingPattern) {
                    console.log(`🗑️ useSvgPathManagement: Removing existing pattern for ${drawingId}`);
                    existingPattern.remove();
                  }
                  if (existingClipPath) {
                    console.log(`🗑️ useSvgPathManagement: Removing existing clip path for ${drawingId}`);
                    existingClipPath.remove();
                  }
                }
                
                // Reset path attributes
                pathElement.removeAttribute('data-has-clip-mask');
                pathElement.style.fill = '';
                pathElement.removeAttribute('fill');
                
                // Apply the clip mask with the floor plan image data
                const result = applyImageClipMask(pathElement, floorPlan.data, drawingId);
                
                if (result) {
                  console.log(`🎉 useSvgPathManagement: Successfully applied clip mask to ${drawingId}`);
                  
                  // Add verification attributes
                  pathElement.setAttribute('data-has-clip-mask', 'true');
                  pathElement.setAttribute('data-image-url', floorPlan.data);
                  if (currentUser) {
                    pathElement.setAttribute('data-user-id', currentUser.id);
                  }
                  
                  // Force multiple repaints to ensure visibility
                  setTimeout(() => {
                    window.dispatchEvent(new Event('resize'));
                    
                    // Force style recalculation
                    if (pathElement && document.contains(pathElement)) {
                      pathElement.getBoundingClientRect();
                      
                      // Ensure the fill is properly applied
                      const fill = `url(#pattern-${drawingId})`;
                      pathElement.style.fill = fill;
                      pathElement.setAttribute('fill', fill);
                      
                      console.log(`🔄 useSvgPathManagement: Forced style update for ${drawingId}`);
                    }
                  }, 100);
                  
                  // Another repaint after a longer delay
                  setTimeout(() => {
                    window.dispatchEvent(new Event('resize'));
                    window.dispatchEvent(new CustomEvent('floorPlanUpdated', { 
                      detail: { 
                        drawingId: drawingId,
                        success: true,
                        userId: currentUser?.id || 'anonymous'
                      }
                    }));
                    console.log(`🔄 useSvgPathManagement: Final UI refresh for ${drawingId}`);
                  }, 500);
                } else {
                  console.error(`❌ useSvgPathManagement: Failed to apply clip mask to ${drawingId}`);
                  
                  // Trigger failure event for potential retry
                  setTimeout(() => {
                    window.dispatchEvent(new CustomEvent('floorPlanUpdated', { 
                      detail: { 
                        drawingId: drawingId,
                        success: false,
                        retryNeeded: true,
                        userId: currentUser?.id || 'anonymous'
                      }
                    }));
                  }, 1000);
                }
              } else {
                console.error(`❌ useSvgPathManagement: Could not find path element for ${drawingId} after ${maxPathAttempts} attempts`);
                
                // Log all SVG paths in the document for debugging
                const allPaths = document.querySelectorAll('svg path');
                console.log(`🔍 useSvgPathManagement: All SVG paths in document:`, Array.from(allPaths).map(p => {
                  const className = p.className;
                  return {
                    id: p.id,
                    drawingId: p.getAttribute('data-drawing-id'),
                    className: typeof className === 'string' ? className : (className as any).baseVal || ''
                  };
                }));
                
                // Schedule a final retry
                setTimeout(() => {
                  window.dispatchEvent(new CustomEvent('floorPlanUpdated', { 
                    detail: { 
                      drawingId: drawingId,
                      success: false,
                      retryNeeded: true,
                      userId: currentUser?.id || 'anonymous'
                    }
                  }));
                }, 3000);
              }
            } else {
              console.log(`❌ useSvgPathManagement: No floor plan found for ${drawingId} or user mismatch`, {
                hasFloorPlan: !!floorPlan,
                userMatch: !currentUser || floorPlan?.userId === currentUser.id || floorPlan?.userId === 'anonymous'
              });
            }
          } catch (error) {
            console.error(`❌ useSvgPathManagement: Error processing floor plan update for ${drawingId}:`, error);
          }
        }, waitTime);
      }
    };

    console.log(`🎧 useSvgPathManagement: Adding floor plan update listener`);
    window.addEventListener('floorPlanUpdated', handleFloorPlanUpdated as EventListener);
    
    return () => {
      console.log(`🔇 useSvgPathManagement: Removing floor plan update listener`);
      window.removeEventListener('floorPlanUpdated', handleFloorPlanUpdated as EventListener);
    };
  }, []);
  
  return {
    svgPaths,
    setSvgPaths
  };
}
