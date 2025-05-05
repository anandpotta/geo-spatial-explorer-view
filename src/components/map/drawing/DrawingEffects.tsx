
import { useEffect, useState } from 'react';
import { getDrawingIdsWithFloorPlans } from '@/utils/floor-plan-utils';

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
    
    // Only proceed if we're in edit mode, initialized, and haven't succeeded yet
    if (activeTool === 'edit' && isInitialized && !activationSucceeded && activationAttempts < 5) {
      const delay = Math.min(300 * (activationAttempts + 1), 2000); // Exponential backoff with max
      
      const timer = setTimeout(() => {
        try {
          console.log(`Attempting to activate edit mode (attempt ${activationAttempts + 1})`);
          const activated = activateEditMode();
          
          if (activated) {
            console.log("Edit mode successfully activated");
            setActivationSucceeded(true);
          } else {
            console.log("Failed to activate edit mode, may retry");
            setActivationAttempts(prev => prev + 1);
          }
        } catch (err) {
          console.error('Error activating edit mode:', err);
          setActivationAttempts(prev => prev + 1);
        }
      }, delay);
      
      return () => clearTimeout(timer);
    }
  }, [activeTool, isInitialized, activateEditMode, activationAttempts, activationSucceeded]);

  // Make sure image controls are always visible
  useEffect(() => {
    const ensureControlsVisible = () => {
      document.querySelectorAll('.image-controls-wrapper').forEach(el => {
        (el as HTMLElement).style.opacity = '1';
        (el as HTMLElement).style.visibility = 'visible';
        (el as HTMLElement).style.display = 'block';
      });
    };
    
    // Ensure controls are visible periodically
    const intervalId = setInterval(ensureControlsVisible, 1000);
    
    // Also ensure controls are visible immediately
    ensureControlsVisible();
    
    return () => clearInterval(intervalId);
  }, []);

  return null;
};

export default DrawingEffects;
