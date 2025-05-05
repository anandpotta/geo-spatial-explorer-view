
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
      // Use multiple attempts with increasing delays to ensure initialization
      const attempts = [100, 300, 600, 1000];
      
      attempts.forEach((delay, index) => {
        const timeoutId = setTimeout(() => {
          try {
            console.log(`Activating edit mode attempt ${index + 1} with delay ${delay}ms`);
            activateEditMode();
          } catch (err) {
            console.error(`Error activating edit mode (attempt ${index + 1}):`, err);
            if (index === attempts.length - 1) {
              toast.error('Could not activate edit mode. Please try again.');
            }
          }
        }, delay);
        
        return () => clearTimeout(timeoutId);
      });
    }
  }, [activeTool, isInitialized, activateEditMode]);

  return null;
};

export default DrawingEffects;
