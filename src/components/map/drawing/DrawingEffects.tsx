
import { useEffect, useState } from 'react';
import { getDrawingIdsWithFloorPlans } from '@/utils/floor-plan-utils';
import { toast } from 'sonner';

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
  // Track activation attempts to avoid infinite loops
  const [activationAttempts, setActivationAttempts] = useState(0);
  const [activationSucceeded, setActivationSucceeded] = useState(false);
  
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
      setActivationAttempts(0);
      setActivationSucceeded(false);
      return;
    }
    
    // Only proceed if we're in edit mode, initialized, haven't succeeded yet, and haven't exceeded max attempts
    // Limiting to 3 attempts maximum to prevent excessive retries
    if (activeTool === 'edit' && isInitialized && !activationSucceeded && activationAttempts < 3) {
      const delay = Math.min(500 * (activationAttempts + 1), 2000); // Increased initial delay
      
      const timer = setTimeout(() => {
        try {
          console.log(`Attempting to activate edit mode (attempt ${activationAttempts + 1} of 3)`);
          const activated = activateEditMode();
          
          if (activated) {
            console.log("Edit mode successfully activated");
            setActivationSucceeded(true);
            toast.success("Edit mode activated", { duration: 2000, id: "edit-mode-success" });
          } else {
            console.log("Failed to activate edit mode");
            setActivationAttempts(prev => prev + 1);
            
            // Show message only on final attempt
            if (activationAttempts === 2) {
              toast.info("Edit controls will be available momentarily", { duration: 3000, id: "edit-mode-info" });
            }
          }
        } catch (err) {
          console.error('Error activating edit mode:', err);
          setActivationAttempts(prev => prev + 1);
        }
      }, delay);
      
      return () => clearTimeout(timer);
    }
  }, [activeTool, isInitialized, activateEditMode, activationAttempts, activationSucceeded]);

  // Make sure image controls are always visible but with reduced interval
  useEffect(() => {
    const ensureControlsVisible = () => {
      document.querySelectorAll('.image-controls-wrapper').forEach(el => {
        (el as HTMLElement).style.opacity = '1';
        (el as HTMLElement).style.visibility = 'visible';
        (el as HTMLElement).style.display = 'block';
      });
    };
    
    // Ensure controls are visible on a less frequent interval
    const intervalId = setInterval(ensureControlsVisible, 3000); // Increased to 3 seconds
    
    // Also ensure controls are visible immediately
    ensureControlsVisible();
    
    return () => clearInterval(intervalId);
  }, []);

  return null;
};

export default DrawingEffects;
