
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
      const { drawingId, userId, freshlyUploaded } = event.detail;
      
      console.log(`🔄 useSvgPathManagement: Floor plan updated event received`, { drawingId, userId, freshlyUploaded });
      
      // Only process floor plan updates for the current user
      const currentUser = getCurrentUser();
      if (!currentUser || (userId && currentUser.id !== userId)) {
        console.log(`❌ useSvgPathManagement: User mismatch, skipping`, { currentUserId: currentUser?.id, eventUserId: userId });
        return;
      }
      
      if (drawingId) {
        console.log(`🎯 useSvgPathManagement: Processing floor plan update for drawing ${drawingId}`);
        
        // Wait for DOM to update, especially for freshly uploaded images
        const waitTime = freshlyUploaded ? 1000 : 500;
        setTimeout(async () => {
          try {
            // Get the floor plan data
            const floorPlan = await getFloorPlanById(drawingId);
            
            if (floorPlan && floorPlan.userId === currentUser.id) {
              console.log(`✅ useSvgPathManagement: Found floor plan for ${drawingId}`);
              
              // Find the SVG path element
              const pathElement = findSvgPathByDrawingId(drawingId);
              if (pathElement) {
                console.log(`✅ useSvgPathManagement: Found path element for ${drawingId}, applying clip mask`);
                
                // Apply the clip mask with the floor plan image data
                const result = applyImageClipMask(pathElement, floorPlan.data, drawingId);
                
                if (result) {
                  console.log(`🎉 useSvgPathManagement: Successfully applied clip mask to ${drawingId}`);
                } else {
                  console.error(`❌ useSvgPathManagement: Failed to apply clip mask to ${drawingId}`);
                }
              } else {
                console.error(`❌ useSvgPathManagement: Could not find path element for ${drawingId}`);
                
                // Try again after a longer delay for freshly uploaded images
                if (freshlyUploaded) {
                  setTimeout(() => {
                    const retryPathElement = findSvgPathByDrawingId(drawingId);
                    if (retryPathElement) {
                      console.log(`🔄 useSvgPathManagement: Retry successful, applying clip mask to ${drawingId}`);
                      applyImageClipMask(retryPathElement, floorPlan.data, drawingId);
                    } else {
                      console.error(`❌ useSvgPathManagement: Retry failed, still no path element for ${drawingId}`);
                    }
                  }, 2000);
                }
              }
            } else {
              console.log(`❌ useSvgPathManagement: No floor plan found for ${drawingId} or user mismatch`);
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
