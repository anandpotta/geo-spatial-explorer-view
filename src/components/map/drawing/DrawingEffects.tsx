
import { useEffect } from 'react';
import { getDrawingIdsWithFloorPlans } from '@/utils/floor-plan-utils';

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
      setTimeout(() => {
        try {
          console.log("Activating edit mode from effect");
          activateEditMode();
        } catch (err) {
          console.error('Error activating edit mode:', err);
        }
      }, 300);
    }
  }, [activeTool, isInitialized, activateEditMode]);

  return null;
};

export default DrawingEffects;
