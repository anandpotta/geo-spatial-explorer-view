
import { useEffect, RefObject, useState } from 'react';
import { ensureEditControlsVisibility, ensureImageControlsVisibility } from './utils/editControlsVisibility';
import { useEditModeActivation } from './useEditModeActivation';
import { useDomObserver } from './useDomObserver';

/**
 * Hook to manage edit mode activation/deactivation
 */
export function useEditMode(editControlRef: RefObject<any>, activeTool: string | null) {
  const [isEditActive, setIsEditActive] = useState(false);
  
  // Use the edit mode activation hook
  const { updateEditMode } = useEditModeActivation(editControlRef, activeTool, isEditActive);
  
  // Use the DOM observer hook for control visibility
  useDomObserver();

  // More controlled activation mechanism for edit mode
  useEffect(() => {
    // Only attempt activation if we're in edit mode and not already active
    if (activeTool !== 'edit' || isEditActive) {
      if (activeTool !== 'edit') {
        setIsEditActive(false);
      }
      return;
    }
    
    // Initial visibility check
    ensureEditControlsVisibility();
    
    // Function to activate edit mode with limited retries
    const attemptUpdateEditMode = () => {
      console.log('Attempting to activate edit mode');
      const result = updateEditMode();
      
      if (result) {
        console.log('Edit mode activation successful');
        setIsEditActive(true);
      }
    };

    // Initial attempt
    attemptUpdateEditMode();
    
    // Set up a timer that periodically ensures edit controls are visible
    const controlsVisibilityId = setInterval(ensureEditControlsVisibility, 2000);
    
    // Set up a timer for occasional activation attempts (limited frequency)
    const editAttemptId = setInterval(() => {
      if (!isEditActive && activeTool === 'edit' && editControlRef.current) {
        attemptUpdateEditMode();
      }
    }, 5000); // Less frequent attempts to avoid overwhelming the system
    
    return () => {
      clearInterval(controlsVisibilityId);
      clearInterval(editAttemptId);
    };
  }, [editControlRef, activeTool, updateEditMode, isEditActive]);
  
  return isEditActive;
}
