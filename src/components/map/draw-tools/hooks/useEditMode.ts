
import { useEffect, RefObject, useState } from 'react';
import { ensureEditControlsVisibility } from './utils/editControlsVisibility';
import { useEditModeActivation } from './useEditModeActivation';
import { useDomObserver } from './useDomObserver';

/**
 * Hook to manage edit mode activation/deactivation
 */
export function useEditMode(editControlRef: RefObject<any>, activeTool: string | null) {
  const [isEditActive, setIsEditActive] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const maxAttempts = 30; // Increase max attempts further
  
  // Use the edit mode activation hook
  const { updateEditMode } = useEditModeActivation(editControlRef, activeTool, isEditActive);
  
  // Use the DOM observer hook for control visibility
  useDomObserver();

  // More controlled activation mechanism for edit mode
  useEffect(() => {
    // Reset attempts when tool changes
    if (activeTool !== 'edit') {
      setAttempts(0);
      setIsEditActive(false);
      return;
    }
    
    // Only attempt activation if we're in edit mode and not already active
    if (isEditActive) {
      return;
    }
    
    // Initial visibility check
    ensureEditControlsVisibility();
    
    // Function to activate edit mode
    const attemptUpdateEditMode = () => {
      // Check if max attempts reached
      if (attempts >= maxAttempts) {
        console.log(`Maximum attempts (${maxAttempts}) reached. Stopping edit mode activation attempts.`);
        return;
      }
      
      console.log(`Attempting to activate edit mode (attempt ${attempts + 1} of ${maxAttempts})`);
      const result = updateEditMode();
      
      if (result) {
        console.log('Edit mode activation successful');
        setIsEditActive(true);
        setAttempts(0); // Reset attempts after success
      } else {
        setAttempts(prev => prev + 1);
      }
    };

    // Initial attempt
    attemptUpdateEditMode();
    
    // Set up a timer that periodically ensures edit controls are visible
    const controlsVisibilityId = setInterval(ensureEditControlsVisibility, 500); // More frequent checks
    
    // Progressive retry strategy with shorter initial delay
    const retryTimeoutId = setTimeout(() => {
      if (!isEditActive && activeTool === 'edit' && editControlRef.current && attempts < maxAttempts) {
        attemptUpdateEditMode();
      }
    }, Math.min(300 + attempts * 100, 2000)); // Faster retry with shorter cap
    
    return () => {
      clearInterval(controlsVisibilityId);
      clearTimeout(retryTimeoutId);
    };
  }, [editControlRef, activeTool, updateEditMode, isEditActive, attempts, maxAttempts]);
  
  return isEditActive;
}
