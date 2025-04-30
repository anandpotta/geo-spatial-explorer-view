
import { useEffect } from 'react';
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
      // Add delay to ensure map and tools are fully initialized
      const timerId = setTimeout(() => {
        try {
          console.log("Activating edit mode from effect");
          
          // Make multiple attempts if needed
          let attempts = 0;
          const tryActivate = () => {
            attempts++;
            const activated = activateEditMode();
            
            if (activated) {
              console.log("Edit mode successfully activated");
              toast.success("Edit mode activated");
            } else if (attempts < 3) {
              // Try again with a delay
              console.log(`Attempt ${attempts} failed, trying again in 500ms`);
              setTimeout(tryActivate, 500);
            } else {
              console.log("Failed to activate edit mode after multiple attempts");
              toast.error("Could not activate edit mode. Try toggling the tool again.");
            }
          };
          
          tryActivate();
        } catch (err) {
          console.error('Error activating edit mode:', err);
          toast.error('Error activating edit mode');
        }
      }, 500);
      
      return () => clearTimeout(timerId);
    }
  }, [activeTool, isInitialized, activateEditMode]);

  return null;
};

export default DrawingEffects;
