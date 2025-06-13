
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
      
      // Skip if already successfully applied
      if (success && !retryNeeded) {
        console.log(`✅ useSvgPathManagement: Clip mask already successfully applied for ${drawingId}`);
        return;
      }
      
      // Only process floor plan updates for the current user
      const currentUser = getCurrentUser();
      if (!currentUser || (userId && currentUser.id !== userId)) {
        console.log(`❌ useSvgPathManagement: User mismatch, skipping`, { 
          currentUserId: currentUser?.id, 
          eventUserId: userId 
        });
        return;
      }
      
      if (drawingId) {
        console.log(`🎯 useSvgPathManagement: Processing floor plan update for drawing ${drawingId}`);
        
        // Wait for DOM to update, especially for freshly uploaded images
        const waitTime = freshlyUploaded ? 2000 : 1000;
        
        setTimeout(async () => {
          try {
            // Get the floor plan data
            console.log(`📋 useSvgPathManagement: Getting floor plan data for ${drawingId}`);
            const floorPlan = await getFloorPlanById(drawingId);
            
            if (floorPlan && floorPlan.userId === currentUser.id) {
              console.log(`✅ useSvgPathManagement: Found floor plan for ${drawingId}`, {
                hasData: !!floorPlan.data,
                dataLength: floorPlan.data?.length,
                fileName: floorPlan.fileName
              });
              
              // Find the SVG path element with retries
              let pathElement = null;
              let pathAttempts = 0;
              const maxPathAttempts = 10;
              
              while (!pathElement && pathAttempts < maxPathAttempts) {
                pathElement = findSvgPathByDrawingId(drawingId);
                if (!pathElement) {
                  console.log(`🔍 useSvgPathManagement: Path search attempt ${pathAttempts + 1}/${maxPathAttempts} for ${drawingId}`);
                  await new Promise(resolve => setTimeout(resolve, 500));
                  pathAttempts++;
                } else {
                  console.log(`✅ useSvgPathManagement: Found path element for ${drawingId} after ${pathAttempts + 1} attempts`);
                }
              }
              
              if (pathElement) {
                console.log(`🎨 useSvgPathManagement: Applying clip mask to ${drawingId}`);
                
                // Apply the clip mask with the floor plan image data
                const result = applyImageClipMask(pathElement, floorPlan.data, drawingId);
                
                if (result) {
                  console.log(`🎉 useSvgPathManagement: Successfully applied clip mask to ${drawingId}`);
                  
                  // Add verification attributes
                  pathElement.setAttribute('data-has-clip-mask', 'true');
                  pathElement.setAttribute('data-image-url', floorPlan.data);
                  pathElement.setAttribute('data-user-id', currentUser.id);
                  
                  // Trigger UI refresh
                  setTimeout(() => {
                    window.dispatchEvent(new Event('resize'));
                    console.log(`🔄 useSvgPathManagement: Triggered UI refresh for ${drawingId}`);
                  }, 200);
                } else {
                  console.error(`❌ useSvgPathManagement: Failed to apply clip mask to ${drawingId}`);
                }
              } else {
                console.error(`❌ useSvgPathManagement: Could not find path element for ${drawingId} after ${maxPathAttempts} attempts`);
              }
            } else {
              console.log(`❌ useSvgPathManagement: No floor plan found for ${drawingId} or user mismatch`, {
                hasFloorPlan: !!floorPlan,
                userMatch: floorPlan?.userId === currentUser.id
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
