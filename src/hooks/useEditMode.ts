
import { useEffect, RefObject, useState, useCallback } from 'react';

/**
 * Hook to manage edit mode activation/deactivation
 */
export function useEditMode(editControlRef: RefObject<any>, activeTool: string | null) {
  const [isEditActive, setIsEditActive] = useState(false);
  
  // More reliable way to update edit mode
  const updateEditMode = useCallback(() => {
    if (!editControlRef.current) {
      console.log('Edit control not available yet');
      return;
    }
    
    try {
      const editControl = editControlRef.current;
      const editToolbar = editControl._toolbars?.edit;
      
      if (!editToolbar) {
        console.log('Edit toolbar not available');
        return;
      }
      
      const editHandler = editToolbar._modes?.edit?.handler;
      const deleteHandler = editToolbar._modes?.remove?.handler;
      
      const shouldEnableEdit = activeTool === 'edit';
      
      if (shouldEnableEdit && editHandler && typeof editHandler.enable === 'function') {
        const isAlreadyEnabled = editHandler.enabled && editHandler.enabled();
        if (!isAlreadyEnabled) {
          console.log('Activating edit mode');
          editHandler.enable();
          setIsEditActive(true);
        }
      } else if (!shouldEnableEdit) {
        // Deactivate edit mode
        if (editHandler && typeof editHandler.disable === 'function' && editHandler.enabled && editHandler.enabled()) {
          console.log('Deactivating edit mode');
          editHandler.disable();
          setIsEditActive(false);
        }
        
        // Deactivate delete mode
        if (deleteHandler && typeof deleteHandler.disable === 'function' && deleteHandler.enabled && deleteHandler.enabled()) {
          console.log('Deactivating delete mode');
          deleteHandler.disable();
        }
      }
    } catch (err) {
      console.error('Error updating edit mode:', err);
    }
  }, [editControlRef, activeTool]);

  // Retry mechanism for edit mode activation
  useEffect(() => {
    // Function to activate or deactivate edit mode based on activeTool
    const attemptUpdateEditMode = (retry = 0) => {
      if (!editControlRef.current && retry < 5) {
        // Retry with increasing delay
        const delay = Math.pow(2, retry) * 100;
        setTimeout(() => attemptUpdateEditMode(retry + 1), delay);
        return;
      }
      
      updateEditMode();
    };

    // Initial update with retry logic
    attemptUpdateEditMode();
    
    // Also set up periodic check to ensure the edit mode stays correctly set
    const intervalId = setInterval(() => {
      const shouldBeActive = activeTool === 'edit';
      if (shouldBeActive !== isEditActive) {
        updateEditMode();
      }
    }, 1000);
    
    return () => {
      clearInterval(intervalId);
    };
  }, [editControlRef, activeTool, updateEditMode, isEditActive]);
}
