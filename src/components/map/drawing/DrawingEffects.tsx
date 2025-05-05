import { useEffect, useState, useCallback } from 'react';
import { getDrawingIdsWithFloorPlans } from '@/utils/floor-plan-utils';
import { toast } from 'sonner';
import { ensureEditControlsVisibility, ensureImageControlsVisibility, persistentlyActivateEditMode } from '../draw-tools/hooks/utils/editControlsVisibility';

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
  const [lastEditActivation, setLastEditActivation] = useState(0);
  const maxActivationAttempts = 10; // Reduced attempts since we'll try more aggressively
  
  // Function to ensure edit controls are always visible
  const ensureEditControlsVisible = useCallback(() => {
    ensureEditControlsVisibility();
  }, []);
  
  // Function to ensure image controls are always visible
  const ensureImageControlsVisible = useCallback(() => {
    ensureImageControlsVisibility();
  }, []);
  
  // Effect to load floor plans on mount and track storage changes
  useEffect(() => {
    const floorPlans = getDrawingIdsWithFloorPlans();
    console.log("Available floor plans:", floorPlans.length > 0 ? floorPlans : "none");
    
    // Always try to activate edit mode if we have floor plans
    if (floorPlans.length > 0 && !hasActivated) {
      // Set edit as active tool after a short delay
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('set-edit-active'));
      }, 1000);
    }
    
    const handleFloorPlanUpdated = () => {
      try {
        window.dispatchEvent(new Event('storage'));
        // Try to activate edit mode when floor plan is updated
        setTimeout(() => {
          activateEditMode();
          window.dispatchEvent(new CustomEvent('set-edit-active'));
          // Dispatch custom event to force SVG path updates
          window.dispatchEvent(new CustomEvent('force-svg-path-update'));
        }, 500);
      } catch (err) {
        console.error('Error handling floor plan update:', err);
      }
    };
    
    const handleStorageEvent = () => {
      const currentFloorPlans = getDrawingIdsWithFloorPlans();
      if (currentFloorPlans.length > 0) {
        // Try to activate edit mode when storage changes and we have floor plans
        setTimeout(() => {
          activateEditMode();
          window.dispatchEvent(new CustomEvent('set-edit-active'));
          // Dispatch custom event to force SVG path updates
          window.dispatchEvent(new CustomEvent('force-svg-path-update'));
        }, 500);
      }
    };
    
    window.addEventListener('floorPlanUpdated', handleFloorPlanUpdated);
    window.addEventListener('storage', handleStorageEvent);
    
    return () => {
      window.removeEventListener('floorPlanUpdated', handleFloorPlanUpdated);
      window.removeEventListener('storage', handleStorageEvent);
    };
  }, [activateEditMode, hasActivated]);

  // Custom event handler for setting edit active
  useEffect(() => {
    const handleSetEditActive = () => {
      // Try to activate edit mode when custom event is fired
      setTimeout(() => {
        const success = activateEditMode();
        if (success) {
          setHasActivated(true);
          toast.success("Edit mode activated", { id: "edit-mode-success" });
          // Dispatch custom event to force SVG path updates
          window.dispatchEvent(new CustomEvent('force-svg-path-update'));
        }
      }, 300);
    };
    
    window.addEventListener('set-edit-active', handleSetEditActive);
    
    return () => {
      window.removeEventListener('set-edit-active', handleSetEditActive);
    };
  }, [activateEditMode]);

  // Effect to activate edit mode when activeTool changes to 'edit'
  useEffect(() => {
    // Reset activation status when tool changes
    if (activeTool !== 'edit') {
      setHasActivated(false);
      setActivationAttempts(0);
      return;
    }
    
    // Always ensure controls are visible when in edit mode
    const visibilityInterval = setInterval(ensureEditControlsVisible, 300);
    
    // Only proceed with activation if not already activated and within attempt limit
    if (activeTool === 'edit' && isInitialized && !hasActivated && activationAttempts < maxActivationAttempts) {
      const now = Date.now();
      if (now - lastEditActivation < 500) {
        // Skip if we just tried
        return;
      }
      
      setLastEditActivation(now);
      console.log(`DrawingEffects: Attempting to activate edit mode (attempt ${activationAttempts + 1}/${maxActivationAttempts})`);
      
      // Use setTimeout to delay the activation attempt
      const timeoutId = setTimeout(() => {
        try {
          // First make sure controls are visible
          ensureEditControlsVisible();
          
          // Then try to activate edit mode
          const activated = activateEditMode();
          
          if (activated) {
            console.log("Edit mode successfully activated from DrawingEffects");
            setHasActivated(true);
            toast.success("Edit mode activated", { duration: 2000, id: "edit-mode-success" });
            
            // Force SVG path updates after successful activation
            window.dispatchEvent(new CustomEvent('force-svg-path-update'));
            
            // Make sure controls are visible after successful activation
            setTimeout(ensureEditControlsVisible, 100);
          } else {
            console.log("Failed to activate edit mode from DrawingEffects");
            setActivationAttempts(prev => prev + 1);
            
            // Set up next attempt with shorter progressive delay
            if (activationAttempts + 1 < maxActivationAttempts) {
              setTimeout(() => {
                if (activeTool === 'edit' && !hasActivated) {
                  setActivationAttempts(prev => prev); // Force re-render
                }
              }, 300 + activationAttempts * 100);
            } else {
              // After max attempts, dispatch custom event for another activation strategy
              window.dispatchEvent(new CustomEvent('set-edit-active'));
              
              // Also force show controls
              window.dispatchEvent(new CustomEvent('force-show-leaflet-controls'));
            }
          }
        } catch (err) {
          console.error('Error activating edit mode from DrawingEffects:', err);
          setActivationAttempts(prev => prev + 1);
        }
      }, 200); // Short initial delay
      
      return () => {
        clearTimeout(timeoutId);
        clearInterval(visibilityInterval);
      };
    }
    
    return () => {
      clearInterval(visibilityInterval);
    };
  }, [activeTool, isInitialized, activateEditMode, hasActivated, 
      ensureEditControlsVisible, activationAttempts, lastEditActivation]);

  // Keep image controls always visible
  useEffect(() => {
    // Ensure controls are visible on a regular interval
    const intervalId = setInterval(ensureImageControlsVisible, 300);
    
    // Also ensure controls are visible immediately
    ensureImageControlsVisible();
    
    return () => clearInterval(intervalId);
  }, [ensureImageControlsVisible]);

  return null;
};

export default DrawingEffects;
