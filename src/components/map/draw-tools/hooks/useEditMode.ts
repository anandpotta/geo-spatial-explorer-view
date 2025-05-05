
import { useEffect, RefObject, useState, useCallback } from 'react';
import { ensureEditControlsVisibility, ensureImageControlsVisibility } from './utils/editControlsVisibility';
import { useEditModeActivation } from './useEditModeActivation';
import { useDomObserver } from './useDomObserver';

/**
 * Hook to manage edit mode activation/deactivation
 */
export function useEditMode(editControlRef: RefObject<any>, activeTool: string | null) {
  const [isEditActive, setIsEditActive] = useState(false);
  const [activationAttempts, setActivationAttempts] = useState(0);
  
  // Use the edit mode activation hook
  const { updateEditMode } = useEditModeActivation(editControlRef, activeTool, isEditActive);
  
  // Use the DOM observer hook for control visibility
  useDomObserver();

  // More aggressive retry mechanism for edit mode activation
  useEffect(() => {
    // Function to activate or deactivate edit mode with retries
    const attemptUpdateEditMode = (retry = 0, maxRetries = 5) => {
      if (activeTool !== 'edit') {
        return; // Don't attempt if not in edit mode
      }
      
      console.log(`Attempting to activate edit mode (attempt ${retry + 1} of ${maxRetries})`);
      
      const result = updateEditMode();
      
      if (!result && retry < maxRetries) {
        // Retry with increasing delay
        const delay = Math.min(Math.pow(1.5, retry) * 300, 2000);
        setTimeout(() => attemptUpdateEditMode(retry + 1, maxRetries), delay);
        setActivationAttempts(prev => prev + 1);
      } else if (result) {
        console.log('Edit mode activation successful');
        setIsEditActive(true);
        setActivationAttempts(0);
      }
    };

    // Reset attempts when tool changes
    if (activeTool !== 'edit') {
      setActivationAttempts(0);
      setIsEditActive(false);
      return;
    }
    
    // Initial update with retry logic
    attemptUpdateEditMode();
    
    // Always ensure controls are visible on mount
    ensureEditControlsVisibility();
    
    // Set up a timer that periodically ensures edit controls are visible
    const controlsVisibilityId = setInterval(ensureEditControlsVisibility, 1000); // Check more frequently
    
    // Set up a timer to make periodic activation attempts
    let editAttemptId: NodeJS.Timeout | null = null;
    
    if (activeTool === 'edit') {
      editAttemptId = setInterval(() => {
        if (!isEditActive && activeTool === 'edit') {
          console.log('Periodically attempting to activate edit mode');
          const result = updateEditMode();
          if (result) {
            setIsEditActive(true);
          }
        }
      }, 3000);
    }
    
    return () => {
      clearInterval(controlsVisibilityId);
      if (editAttemptId) clearInterval(editAttemptId);
    };
  }, [editControlRef, activeTool, updateEditMode, isEditActive, activationAttempts]);
  
  return isEditActive;
}
