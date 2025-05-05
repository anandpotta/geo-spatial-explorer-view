
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
      return false;
    }
    
    try {
      const editControl = editControlRef.current;
      const editToolbar = editControl._toolbars?.edit;
      
      if (!editToolbar) {
        console.log('Edit toolbar not available');
        return false;
      }
      
      const editHandler = editToolbar._modes?.edit?.handler;
      const deleteHandler = editToolbar._modes?.remove?.handler;
      
      const shouldEnableEdit = activeTool === 'edit';
      
      if (shouldEnableEdit && editHandler && typeof editHandler.enable === 'function') {
        const isAlreadyEnabled = editHandler.enabled && editHandler.enabled();
        if (!isAlreadyEnabled) {
          console.log('Activating edit mode through useEditMode hook');
          
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
          return true;
        }
        return isAlreadyEnabled;
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
          (el as HTMLElement).style.pointerEvents = 'auto';
        });
      }, 200);
      
      return shouldEnableEdit && isEditActive;
    } catch (err) {
      console.error('Error updating edit mode:', err);
      return false;
    }
  }, [editControlRef, activeTool, isEditActive]);

  // Retry mechanism for edit mode activation with increased persistence
  useEffect(() => {
    // Function to activate or deactivate edit mode with retries
    const attemptUpdateEditMode = (retry = 0, maxRetries = 5) => {
      if (!editControlRef.current && retry < maxRetries) {
        // Retry with increasing delay
        const delay = Math.min(Math.pow(2, retry) * 100, 2000);
        setTimeout(() => attemptUpdateEditMode(retry + 1, maxRetries), delay);
        return;
      }
      
      updateEditMode();
    };

    // Initial update with retry logic
    attemptUpdateEditMode();
    
    // Set up a timer that periodically ensures image controls are visible
    const visibilityCheckId = setInterval(() => {
      document.querySelectorAll('.image-controls-wrapper').forEach((el) => {
        (el as HTMLElement).style.opacity = '1';
        (el as HTMLElement).style.visibility = 'visible';
        (el as HTMLElement).style.display = 'block';
        (el as HTMLElement).style.pointerEvents = 'auto';
      });
    }, 1000);
    
    // Also set up a less frequent check for edit mode status
    const editCheckId = setInterval(() => {
      const shouldBeActive = activeTool === 'edit';
      if (shouldBeActive !== isEditActive) {
        updateEditMode();
      }
    }, 3000);
    
    return () => {
      clearInterval(visibilityCheckId);
      clearInterval(editCheckId);
    };
  }, [editControlRef, activeTool, updateEditMode, isEditActive]);
  
  // Add a special effect to handle DOM changes
  useEffect(() => {
    // Monitor for DOM changes that might remove our controls
    const observer = new MutationObserver((mutations) => {
      let needsCheck = false;
      
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.removedNodes.length > 0) {
          needsCheck = true;
        }
        
        // Also check for attribute changes on image controls
        if (mutation.type === 'attributes' && 
            (mutation.target.classList.contains('image-controls-wrapper') || 
             mutation.target.classList.contains('image-controls-container'))) {
          needsCheck = true;
        }
      });
      
      if (needsCheck) {
        // Re-show any image controls that might have been hidden
        setTimeout(() => {
          document.querySelectorAll('.image-controls-wrapper').forEach((el) => {
            (el as HTMLElement).style.opacity = '1';
            (el as HTMLElement).style.visibility = 'visible';
            (el as HTMLElement).style.display = 'block';
            (el as HTMLElement).style.pointerEvents = 'auto';
          });
        }, 10);
      }
    });
    
    // Start observing the document with the configured parameters
    observer.observe(document.body, { 
      childList: true, 
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class']
    });
    
    return () => {
      observer.disconnect();
    };
  }, []);
  
  return isEditActive;
}
