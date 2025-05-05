
import { useEffect, useState, useCallback } from 'react';
import { getDrawingIdsWithFloorPlans } from '@/utils/floor-plan-utils';
import { toast } from 'sonner';
import { ensureEditControlsVisibility } from '../draw-tools/hooks/utils/editControlsVisibility';

interface DrawingEffectsProps {
  activeTool: string | null;
  isInitialized: boolean;
  activateEditMode: () => boolean;
}

const DrawingEffects: React.FC<DrawingEffectsProps> = ({ 
  activeTool, 
  isInitialized,
  activateEditMode
}) => {
  const [hasActivated, setHasActivated] = useState(false);
  
  // Function to ensure edit controls are always visible
  const ensureEditControlsVisible = useCallback(() => {
    ensureEditControlsVisibility();
  }, []);
  
  // Effect to load floor plans on mount
  useEffect(() => {
    getDrawingIdsWithFloorPlans();
    
    const handleFloorPlanUpdated = () => {
      try {
        window.dispatchEvent(new Event('storage'));
      } catch (err) {
        console.error('Error handling floor plan update:', err);
      }
    };
    
    window.addEventListener('floorPlanUpdated', handleFloorPlanUpdated);
    
    return () => {
      window.removeEventListener('floorPlanUpdated', handleFloorPlanUpdated);
    };
  }, []);

  // Effect to activate edit mode when activeTool changes to 'edit'
  useEffect(() => {
    // Reset activation status when tool changes
    if (activeTool !== 'edit') {
      setHasActivated(false);
      return;
    }
    
    // Always ensure controls are visible when in edit mode
    const visibilityInterval = setInterval(ensureEditControlsVisible, 2000);
    
    // Only proceed with activation if not already activated
    if (activeTool === 'edit' && isInitialized && !hasActivated) {
      // Use setTimeout to delay the first activation attempt
      const timeoutId = setTimeout(() => {
        try {
          console.log('DrawingEffects: Attempting to activate edit mode');
          const activated = activateEditMode();
          
          if (activated) {
            console.log("Edit mode successfully activated");
            setHasActivated(true);
            toast.success("Edit mode activated", { duration: 2000, id: "edit-mode-success" });
            
            // Ensure controls are visible after successful activation
            setTimeout(ensureEditControlsVisible, 100);
          } else {
            console.log("Failed to activate edit mode from DrawingEffects");
          }
        } catch (err) {
          console.error('Error activating edit mode from DrawingEffects:', err);
        }
      }, 1000);
      
      return () => {
        clearTimeout(timeoutId);
        clearInterval(visibilityInterval);
      };
    }
    
    return () => {
      clearInterval(visibilityInterval);
    };
  }, [activeTool, isInitialized, activateEditMode, hasActivated, ensureEditControlsVisible]);

  // Make sure image controls are always visible
  useEffect(() => {
    const ensureImageControlsVisible = () => {
      document.querySelectorAll('.image-controls-wrapper').forEach(el => {
        (el as HTMLElement).style.opacity = '1';
        (el as HTMLElement).style.visibility = 'visible';
        (el as HTMLElement).style.display = 'block';
        (el as HTMLElement).style.pointerEvents = 'auto';
      });
    };
    
    // Ensure controls are visible on a regular interval
    const intervalId = setInterval(ensureImageControlsVisible, 3000);
    
    // Also ensure controls are visible immediately
    ensureImageControlsVisible();
    
    return () => clearInterval(intervalId);
  }, []);

  return null;
};

export default DrawingEffects;
