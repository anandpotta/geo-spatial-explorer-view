
import { useEffect } from 'react';
import { getDrawingIdsWithFloorPlans } from '@/utils/floor-plan-utils';
import { toast } from 'sonner';

interface DrawingEffectsProps {
  activeTool: string | null;
  isInitialized: boolean;
  activateEditMode: () => void;
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
      // Use a longer delay to ensure all components are fully initialized
      const timeoutId = setTimeout(() => {
        try {
          console.log("Activating edit mode from effect with delay");
          activateEditMode();
        } catch (err) {
          console.error('Error activating edit mode:', err);
          toast.error('Could not activate edit mode. Please try again.');
        }
      }, 500); // Increased delay for better initialization
      
      return () => clearTimeout(timeoutId);
    }
  }, [activeTool, isInitialized, activateEditMode]);

  return null;
};

export default DrawingEffects;
