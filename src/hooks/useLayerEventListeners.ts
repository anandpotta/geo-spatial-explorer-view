
import { useEffect } from 'react';

interface LayerEventProps {
  isMountedRef: React.MutableRefObject<boolean>;
  updateLayers: () => void;
  ensureDrawControlsVisibility: () => void;
}

/**
 * Hook to handle layer-related event listeners
 */
export function useLayerEventListeners({
  isMountedRef,
  updateLayers,
  ensureDrawControlsVisibility
}: LayerEventProps) {
  // Set up event listeners for layer updates
  useEffect(() => {
    const handleMarkerUpdated = () => {
      if (isMountedRef.current) {
        // Small delay to ensure storage is updated first
        setTimeout(updateLayers, 50);
      }
    };
    
    const handleImageUpdated = () => {
      if (isMountedRef.current) {
        // Update layers when an image is uploaded or changed
        setTimeout(updateLayers, 50);
      }
    };
    
    const handleFloorPlanUpdated = (event: CustomEvent) => {
      if (isMountedRef.current) {
        // Update layers when a floor plan is uploaded or changed
        console.log('Floor plan updated for drawing:', event.detail?.drawingId);
        setTimeout(updateLayers, 50);
      }
    };
    
    // Add event listener for z-index interference
    const handleZIndexChange = () => {
      if (!isMountedRef.current) return;
      ensureDrawControlsVisibility();
    };
    
    window.addEventListener('markersUpdated', handleMarkerUpdated);
    window.addEventListener('image-uploaded', handleImageUpdated as EventListener);
    window.addEventListener('floorPlanUpdated', handleFloorPlanUpdated as EventListener);
    window.addEventListener('click', handleZIndexChange);
    
    return () => {
      window.removeEventListener('markersUpdated', handleMarkerUpdated);
      window.removeEventListener('image-uploaded', handleImageUpdated as EventListener);
      window.removeEventListener('floorPlanUpdated', handleFloorPlanUpdated as EventListener);
      window.removeEventListener('click', handleZIndexChange);
    };
  }, [isMountedRef, updateLayers, ensureDrawControlsVisibility]);
}
