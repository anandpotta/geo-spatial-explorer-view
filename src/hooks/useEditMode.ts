
import { useEffect, RefObject, useState, useCallback } from 'react';
import { toast } from 'sonner';

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
          
          // First ensure all layers are selected to make them eligible for editing
          if (editHandler._featureGroup) {
            editHandler._featureGroup.eachLayer((layer: any) => {
              if (typeof layer._path !== 'undefined') {
                editHandler._selectableLayers.addLayer(layer);
              }
            });
          }
          
          // Then enable edit mode
          editHandler.enable();
          
          // Update state and show notification
          setIsEditActive(true);
          toast.success('Edit mode activated. Select a shape to modify it.');
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
      
      // Always ensure image controls are visible regardless of edit mode
      setTimeout(() => {
        document.querySelectorAll('.image-controls-wrapper').forEach((el) => {
          (el as HTMLElement).style.opacity = '1';
          (el as HTMLElement).style.visibility = 'visible';
          (el as HTMLElement).style.display = 'block';
        });
      }, 200);
    } catch (err) {
      console.error('Error updating edit mode:', err);
    }
  }, [editControlRef, activeTool]);

  // Retry mechanism for edit mode activation with increased persistence
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
      
      // Always ensure image controls are visible
      document.querySelectorAll('.image-controls-wrapper').forEach((el) => {
        (el as HTMLElement).style.opacity = '1';
        (el as HTMLElement).style.visibility = 'visible';
        (el as HTMLElement).style.display = 'block';
      });
    }, 500);
    
    return () => {
      clearInterval(intervalId);
    };
  }, [editControlRef, activeTool, updateEditMode, isEditActive]);
  
  // Add a special effect to handle DOM changes
  useEffect(() => {
    // Monitor for DOM changes that might remove our controls
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.removedNodes.length > 0) {
          // Re-show any image controls that might have been hidden
          setTimeout(() => {
            document.querySelectorAll('.image-controls-wrapper').forEach((el) => {
              (el as HTMLElement).style.opacity = '1';
              (el as HTMLElement).style.visibility = 'visible';
              (el as HTMLElement).style.display = 'block';
            });
          }, 10);
        }
      });
    });
    
    // Start observing the document with the configured parameters
    observer.observe(document.body, { childList: true, subtree: true });
    
    return () => {
      observer.disconnect();
    };
  }, []);
  
  return isEditActive;
}
