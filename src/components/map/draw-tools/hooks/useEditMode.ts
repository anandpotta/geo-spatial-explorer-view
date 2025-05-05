
import { useEffect, RefObject, useState } from 'react';
import { ensureEditControlsVisibility, persistentlyActivateEditMode } from './utils/editControlsVisibility';
import { useEditModeActivation } from './useEditModeActivation';
import { useDomObserver } from './useDomObserver';

/**
 * Hook to manage edit mode activation/deactivation
 */
export function useEditMode(editControlRef: RefObject<any>, activeTool: string | null) {
  const [isEditActive, setIsEditActive] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [lastActivationTime, setLastActivationTime] = useState(0);
  const maxAttempts = 10; // Fewer attempts but more aggressive strategy
  
  // Use the edit mode activation hook
  const { updateEditMode } = useEditModeActivation(editControlRef, activeTool, isEditActive);
  
  // Use the DOM observer hook for control visibility
  useDomObserver();
  
  // Check for floor plans to determine if edit mode should be active
  useEffect(() => {
    const checkForFloorPlans = () => {
      try {
        const floorPlans = JSON.parse(localStorage.getItem('floorPlans') || '{}');
        // If we have floor plans, try to ensure edit mode is active
        if (Object.keys(floorPlans).length > 0 && !isEditActive) {
          // Should try to activate edit mode
          window.dispatchEvent(new CustomEvent('set-edit-active'));
        }
      } catch (e) {
        console.error("Error checking floor plans:", e);
      }
    };
    
    // Check initially
    checkForFloorPlans();
    
    // Listen for storage changes
    window.addEventListener('storage', checkForFloorPlans);
    
    return () => {
      window.removeEventListener('storage', checkForFloorPlans);
    };
  }, [isEditActive]);

  // Listen for custom event to force edit mode activation
  useEffect(() => {
    const handleForceEditMode = () => {
      if (!isEditActive && editControlRef.current) {
        console.log("Forcing edit mode activation from custom event");
        const success = persistentlyActivateEditMode(editControlRef);
        if (success) {
          setIsEditActive(true);
          setAttempts(0);
          // Force SVG path update when edit mode is activated
          window.dispatchEvent(new CustomEvent('force-svg-path-update'));
        }
      }
    };
    
    window.addEventListener('set-edit-active', handleForceEditMode);
    
    return () => {
      window.removeEventListener('set-edit-active', handleForceEditMode);
    };
  }, [editControlRef, isEditActive]);

  // More controlled activation mechanism for edit mode
  useEffect(() => {
    // Initial visibility check
    ensureEditControlsVisibility();
    
    // Reset attempts when tool changes
    if (activeTool !== 'edit') {
      setAttempts(0);
      
      // But don't deactivate if we have floor plans
      try {
        const floorPlans = JSON.parse(localStorage.getItem('floorPlans') || '{}');
        if (Object.keys(floorPlans).length === 0) {
          setIsEditActive(false);
        }
      } catch (e) {
        console.error("Error checking floor plans:", e);
        setIsEditActive(false);
      }
      return;
    }
    
    // Only attempt activation if we're in edit mode and not already active
    if (isEditActive) {
      return;
    }
    
    // Throttle activation attempts
    const now = Date.now();
    if (now - lastActivationTime < 500) {
      return;
    }
    
    setLastActivationTime(now);
    
    // Function to activate edit mode
    const attemptUpdateEditMode = () => {
      // Check if max attempts reached
      if (attempts >= maxAttempts) {
        console.log(`Maximum attempts (${maxAttempts}) reached. Switching to persistent strategy.`);
        const success = persistentlyActivateEditMode(editControlRef);
        if (success) {
          setIsEditActive(true);
          setAttempts(0);
          // Force SVG path update
          window.dispatchEvent(new CustomEvent('force-svg-path-update'));
        }
        return;
      }
      
      console.log(`Attempting to activate edit mode (attempt ${attempts + 1} of ${maxAttempts})`);
      const result = updateEditMode();
      
      if (result) {
        console.log('Edit mode activation successful');
        setIsEditActive(true);
        setAttempts(0); // Reset attempts after success
        // Force SVG path update
        window.dispatchEvent(new CustomEvent('force-svg-path-update'));
      } else {
        setAttempts(prev => prev + 1);
        
        // Try persistent method as a last resort
        if (attempts + 1 >= maxAttempts) {
          const success = persistentlyActivateEditMode(editControlRef);
          if (success) {
            setIsEditActive(true);
            setAttempts(0);
            // Force SVG path update
            window.dispatchEvent(new CustomEvent('force-svg-path-update'));
          }
        }
      }
    };

    // Initial attempt
    attemptUpdateEditMode();
    
    // Set up a timer that periodically ensures edit controls are visible
    const controlsVisibilityId = setInterval(ensureEditControlsVisibility, 300);
    
    // Progressive retry strategy with shorter initial delay
    const retryTimeoutId = setTimeout(() => {
      if (!isEditActive && activeTool === 'edit' && editControlRef.current && attempts < maxAttempts) {
        attemptUpdateEditMode();
      }
    }, Math.min(200 + attempts * 100, 1000));
    
    return () => {
      clearInterval(controlsVisibilityId);
      clearTimeout(retryTimeoutId);
    };
  }, [editControlRef, activeTool, updateEditMode, isEditActive, attempts, maxAttempts, lastActivationTime]);
  
  return isEditActive;
}
