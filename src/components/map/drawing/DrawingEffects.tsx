
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
  const [activationAttempts, setActivationAttempts] = useState(0);
  const maxActivationAttempts = 20;
  
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
      setActivationAttempts(0);
      return;
    }
    
    // Always ensure controls are visible when in edit mode
    const visibilityInterval = setInterval(ensureEditControlsVisible, 1000);
    
    // Only proceed with activation if not already activated and within attempt limit
    if (activeTool === 'edit' && isInitialized && !hasActivated && activationAttempts < maxActivationAttempts) {
      console.log(`DrawingEffects: Attempting to activate edit mode (attempt ${activationAttempts + 1}/${maxActivationAttempts})`);
      
      // Use setTimeout to delay the activation attempt
      const timeoutId = setTimeout(() => {
        try {
          const activated = activateEditMode();
          
          if (activated) {
            console.log("Edit mode successfully activated from DrawingEffects");
            setHasActivated(true);
            toast.success("Edit mode activated", { duration: 2000, id: "edit-mode-success" });
            
            // Ensure controls are visible after successful activation
            setTimeout(ensureEditControlsVisible, 100);
          } else {
            console.log("Failed to activate edit mode from DrawingEffects");
            setActivationAttempts(prev => prev + 1);
            
            // Set up next attempt with progressive delay
            if (activationAttempts + 1 < maxActivationAttempts) {
              setTimeout(() => {
                if (activeTool === 'edit' && !hasActivated) {
                  setActivationAttempts(prev => prev); // Force re-render
                }
              }, Math.min(500 + activationAttempts * 100, 2000));
            }
          }
        } catch (err) {
          console.error('Error activating edit mode from DrawingEffects:', err);
          setActivationAttempts(prev => prev + 1);
        }
      }, 300 + activationAttempts * 200); // Progressive delay
      
      return () => {
        clearTimeout(timeoutId);
        clearInterval(visibilityInterval);
      };
    }
    
    return () => {
      clearInterval(visibilityInterval);
    };
  }, [activeTool, isInitialized, activateEditMode, hasActivated, ensureEditControlsVisible, activationAttempts]);

  // Make sure image controls are always visible
  useEffect(() => {
    const ensureImageControlsVisible = () => {
      document.querySelectorAll('.image-controls-wrapper').forEach(el => {
        const element = el as HTMLElement;
        element.style.cssText = `
          opacity: 1 !important;
          visibility: visible !important; 
          display: block !important;
          pointer-events: auto !important;
          z-index: 9999 !important;
        `;
      });
    };
    
    // Ensure controls are visible on a regular interval
    const intervalId = setInterval(ensureImageControlsVisible, 1000);
    
    // Also ensure controls are visible immediately
    ensureImageControlsVisible();
    
    return () => clearInterval(intervalId);
  }, []);

  return null;
};

export default DrawingEffects;
