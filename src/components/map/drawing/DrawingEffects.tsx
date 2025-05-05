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
  // Track activation attempts to avoid infinite loops
  const [activationAttempts, setActivationAttempts] = useState(0);
  const [activationSucceeded, setActivationSucceeded] = useState(false);
  
  // Function to ensure edit controls are always visible
  const ensureEditControlsVisible = useCallback(() => {
    try {
      // Find the edit control container
      const editControlContainer = document.querySelector('.leaflet-draw.leaflet-control') as HTMLElement;
      if (editControlContainer) {
        // Set width and position as requested
        editControlContainer.style.width = '30px'; // Changed from 200px to 30px
        editControlContainer.style.top = '50px'; // Added top position
        editControlContainer.style.display = 'block';
        editControlContainer.style.visibility = 'visible';
        editControlContainer.style.opacity = '1';
        editControlContainer.style.pointerEvents = 'auto';
        editControlContainer.style.zIndex = '9999';
        
        // Make sure all buttons inside are visible and properly sized
        const buttons = editControlContainer.querySelectorAll('a');
        buttons.forEach(button => {
          (button as HTMLElement).style.display = 'inline-block';
          (button as HTMLElement).style.visibility = 'visible';
          (button as HTMLElement).style.opacity = '1';
        });
        
        // Ensure the edit toolbar is visible
        const toolbar = editControlContainer.querySelector('.leaflet-draw-toolbar') as HTMLElement;
        if (toolbar) {
          toolbar.style.display = 'block';
          toolbar.style.visibility = 'visible';
          toolbar.style.opacity = '1';
        }
        
        // Make edit and delete buttons specifically visible
        const editEditBtn = editControlContainer.querySelector('.leaflet-draw-edit-edit') as HTMLElement;
        if (editEditBtn) {
          editEditBtn.style.display = 'inline-block';
          editEditBtn.style.visibility = 'visible';
          editEditBtn.style.opacity = '1';
        }
        
        const editDeleteBtn = editControlContainer.querySelector('.leaflet-draw-edit-remove') as HTMLElement;
        if (editDeleteBtn) {
          editDeleteBtn.style.display = 'inline-block';
          editDeleteBtn.style.visibility = 'visible';
          editDeleteBtn.style.opacity = '1';
        }
      }
    } catch (err) {
      console.error('Error ensuring edit controls visibility:', err);
    }
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
      setActivationAttempts(0);
      setActivationSucceeded(false);
      return;
    }
    
    // Always ensure controls are visible when in edit mode
    const visibilityInterval = setInterval(ensureEditControlsVisible, 500);
    
    // Only proceed if we're in edit mode, initialized, and haven't succeeded yet
    // Using a higher number of maximum attempts
    const maxAttempts = 10;
    
    if (activeTool === 'edit' && isInitialized && !activationSucceeded && activationAttempts < maxAttempts) {
      const attemptActivation = () => {
        try {
          console.log(`Attempting to activate edit mode (attempt ${activationAttempts + 1} of ${maxAttempts})`);
          const activated = activateEditMode();
          
          if (activated) {
            console.log("Edit mode successfully activated");
            setActivationSucceeded(true);
            toast.success("Edit mode activated", { duration: 2000, id: "edit-mode-success" });
            
            // Ensure controls are visible after successful activation
            setTimeout(ensureEditControlsVisible, 100);
            setTimeout(ensureEditControlsVisible, 500);
          } else {
            console.log("Failed to activate edit mode");
            setActivationAttempts(prev => prev + 1);
            
            // Schedule another attempt with exponential backoff
            if (activationAttempts < maxAttempts - 1) {
              const delay = Math.min(300 * Math.pow(1.5, activationAttempts), 3000);
              setTimeout(attemptActivation, delay);
            } else {
              // Show message on final attempt
              toast.info("Edit controls will be available momentarily", { duration: 3000, id: "edit-mode-info" });
            }
          }
        } catch (err) {
          console.error('Error activating edit mode:', err);
          setActivationAttempts(prev => prev + 1);
        }
      };
      
      // Start the first attempt with a short delay
      setTimeout(attemptActivation, 100);
    }
    
    return () => {
      clearInterval(visibilityInterval);
    };
  }, [activeTool, isInitialized, activateEditMode, activationAttempts, activationSucceeded, ensureEditControlsVisible]);

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
    const intervalId = setInterval(ensureImageControlsVisible, 1500);
    
    // Also ensure controls are visible immediately
    ensureImageControlsVisible();
    
    return () => clearInterval(intervalId);
  }, []);

  return null;
};

export default DrawingEffects;
