
import { useEffect } from 'react';
import { getDrawingIdsWithFloorPlans } from '@/utils/floor-plan-utils';
import { toast } from 'sonner';

interface DrawingEffectsProps {
  activeTool: string | null;
  isInitialized: boolean;
  activateEditMode: () => boolean; // Updated type to specify it returns a boolean
}

const DrawingEffects: React.FC<DrawingEffectsProps> = ({ 
  activeTool, 
  isInitialized,
  activateEditMode
}) => {
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
    if (activeTool === 'edit' && isInitialized) {
      // Using a progressive retry with increasing delays
      const initialDelay = 300;
      const retryTimes = [initialDelay, 600, 1000, 1500];
      
      console.log("Activating edit mode from effect");
      
      // Attempt immediate activation
      const success = activateEditMode();
      
      // If not successful, try with delays
      if (!success) {
        let attemptCount = 0;
        
        const attemptActivation = () => {
          if (attemptCount < retryTimes.length) {
            setTimeout(() => {
              console.log(`Retry #${attemptCount + 1} to activate edit mode`);
              const result = activateEditMode();
              
              if (!result && attemptCount === retryTimes.length - 1) {
                // Last attempt failed
                toast.error("Edit mode couldn't be activated. Try selecting edit tool again.");
              } else if (!result) {
                // Try next delay
                attemptCount++;
                attemptActivation();
              }
            }, retryTimes[attemptCount]);
          }
        };
        
        attemptActivation();
      }
    }
  }, [activeTool, isInitialized, activateEditMode]);

  return null;
};

export default DrawingEffects;
